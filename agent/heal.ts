/**
 * Laya healer. Run after a failed test run (Laya must be running):
 *   node agent/heal.ts
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import dotenv from 'dotenv';
import { DecisionClient } from './decision-client.ts';
import { findIntentsByTestId, readAllIntents, type Intent } from './intents.ts';
import { narrow, toChoiceOptions, type Candidate } from './perception.ts';

dotenv.config({ path: 'env/.env.decision.local', quiet: true });

// Playwright writes this file after every command-line run (see playwright.config.ts).
const REPORT = 'test-results/results.json';

// In the report, a missing element looks like: waiting for getByTestId('proceed-x')
const BROKEN_TEST_ID = /waiting for getByTestId\('([^']+)'\)/;

// Below this, Laya is not sure enough and we hand over to a human / the Playwright healer.
const MIN_CONFIDENCE = 0.5;

type Snapshot = { url: string; candidates: Candidate[] };
type Breakage = {
  testId: string;
  snapshot?: Snapshot;
  /** The failing test, so we can re-run exactly it after the fix, e.g. tests/spec/...:7 */
  testLocation: string;
  project: string;
};

/** Piece 1 + 2: each broken test id, with the page snapshot saved when that test failed. */
function findBreakages(): Breakage[] {
  if (!existsSync(REPORT)) {
    console.log(`No ${REPORT} yet. Run the tests from the command line first (not --ui, no --reporter).`);
    process.exit(1);
  }
  const report = JSON.parse(readFileSync(REPORT, 'utf8'));
  const breakages = new Map<string, Breakage>();

  // The report is a tree: suites contain suites and specs; specs contain tests, results, errors.
  const visit = (suite: any): void => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        for (const result of test.results ?? []) {
          // The heal-snapshot attachment comes from the healSnapshot fixture in tests/pages/base.ts.
          const attachment = (result.attachments ?? []).find((a: any) => a.name === 'heal-snapshot');
          const snapshot = attachment?.body
            ? (JSON.parse(Buffer.from(attachment.body, 'base64').toString('utf8')) as Snapshot)
            : undefined;

          for (const error of result.errors ?? []) {
            const match = BROKEN_TEST_ID.exec(error.message ?? '');
            if (match && !breakages.has(match[1])) {
              breakages.set(match[1], {
                testId: match[1],
                snapshot,
                // Relative path with "/": Playwright reads the argument as a pattern, where a
                // Windows "\" or drive letter "C:" would break the file:line filter.
                testLocation: `${relative('.', join(report.config.rootDir, spec.file)).replaceAll('\\', '/')}:${spec.line}`,
                project: test.projectName,
              });
            }
          }
        }
      }
    }
    (suite.suites ?? []).forEach(visit);
  };
  (report.suites ?? []).forEach(visit);

  return [...breakages.values()];
}

/** The locator code we would write for this element. */
function suggestLocator(candidate: Candidate): string {
  if (candidate.testId) {
    return `this.page.getByTestId('${candidate.testId}')`;
  }
  return `this.page.getByRole('${candidate.role}', { name: '${candidate.name}' })`;
}

/** Piece 3: ask Laya which element on the snapshot is the one the intent describes. */
async function askLaya(client: DecisionClient, intent: Intent, snapshot: Snapshot) {
  const { options } = narrow(snapshot.candidates);
  const answer = await client.choose({
    state: `Looking for: ${intent.role} "${intent.label}" — ${intent.purpose}. Page: ${snapshot.url}`,
    instructions: 'Which element on the page is the one we are looking for?',
    options: toChoiceOptions(options),
  });
  return { picked: options[answer.index], options, answer };
}

type Edit = { file: string; before: string };

/**
 * Piece 4a: replace the locator declaration (it may span several lines) with the new locator.
 * Returns the original file contents so the change can be undone.
 */
function applyFix(intent: Intent, newLocator: string): Edit {
  const before = readFileSync(intent.file, 'utf8');
  const eol = before.includes('\r\n') ? '\r\n' : '\n';
  const lines = before.split(/\r?\n/);

  const start = intent.line - 1;
  let end = start;
  while (end < lines.length - 1 && !lines[end].trimEnd().endsWith(';')) end++;

  const indent = /^\s*/.exec(lines[start])![0];
  lines.splice(start, end - start + 1, `${indent}readonly ${intent.property}: Locator = ${newLocator};`);
  writeFileSync(intent.file, lines.join(eol));
  return { file: intent.file, before };
}

/** Piece 4b: the safety rail. Re-run the test that failed; true if it passes now. */
function verify(breakage: Breakage): boolean {
  console.log(`\n  Verifying: re-running ${breakage.testLocation}\n`);
  // One command string: on Windows `npx` needs a shell to start.
  const run = spawnSync(
    `npx playwright test "${breakage.testLocation}" --project=${breakage.project}`,
    { stdio: 'inherit', shell: true }
  );
  return run.status === 0;
}

const HANDOFF = 'test-results/heal-handoff.md';

/**
 * Step 14: Laya could not fix it, so write a ready-made request for the Playwright healer agent
 * (Claude). We only prepare it; a human decides to spend the tokens by pasting it into Claude Code.
 */
function handOff(breakage: Breakage, matches: Intent[], reason: string): void {
  const where = matches.map((m) => `- ${m.file.replaceAll('\\', '/')}:${m.line} (${m.property})`);
  const meaning = matches[0]
    ? `It was meant to be: ${matches[0].role} "${matches[0].label}" — ${matches[0].purpose}.`
    : 'It has no @intent note, so its meaning is unknown.';

  const request = [
    `Use the playwright-test-healer agent to fix the failing test`,
    `${breakage.testLocation} (project ${breakage.project}).`,
    ``,
    `The locator getByTestId('${breakage.testId}') no longer finds anything. It is defined in:`,
    ...where,
    meaning,
    `The fast local healer (Laya) could not fix it: ${reason}`,
    ``,
    `Rules: change only the locator(s) listed above, keep the @intent comments,`,
    `prefer getByTestId or getByRole, and run the test to confirm it passes.`,
    `If the app itself looks broken, do not change the test; explain why instead.`,
  ].join('\n');

  appendFileSync(HANDOFF, `${request}\n\n---\n\n`);
  console.log(`\n  ➡️  Handing over to the Playwright healer agent (Claude).`);
  console.log(`  Paste this into Claude Code (opened in playwright-sample-project), or open ${HANDOFF}:\n`);
  console.log(request.replace(/^/gm, '    '));
}

const client = DecisionClient.fromEnv();
const intents = readAllIntents();
rmSync(HANDOFF, { force: true });
const breakages = findBreakages();

if (breakages.length === 0) {
  console.log('No broken locators found in the last test run. Nothing to heal.');
}

for (const breakage of breakages) {
  const { testId, snapshot } = breakage;
  console.log(`\nBroken locator: getByTestId('${testId}')`);

  const matches = findIntentsByTestId(intents, testId);
  if (matches.length === 0) {
    console.log('  No @intent note for it, so Laya cannot know what it was for.');
    handOff(breakage, matches, 'the locator has no @intent note.');
    continue;
  }
  if (!snapshot) {
    console.log('  No heal-snapshot in the report. Re-run the failing test from the command line.');
    continue;
  }

  // Every page object using this test id means the same thing, so one question is enough.
  const intent = matches[0];
  console.log(`  It was meant to be: ${intent.role} "${intent.label}" — ${intent.purpose}`);
  console.log(`  Asking Laya (${snapshot.candidates.length} elements on ${snapshot.url})...`);

  const { picked, options, answer } = await askLaya(client, intent, snapshot);
  options.forEach((c, i) => {
    const marker = i === answer.index ? '<- picked' : '';
    console.log(`    ${answer.probabilities[i].toFixed(3)}  ${c.role} "${c.name}" ${marker}`);
  });
  console.log(`  confidence ${answer.confidence.toFixed(2)}, ${answer.latencyMs} ms`);

  if (answer.confidence < MIN_CONFIDENCE) {
    console.log(`  ✋ Not confident enough (< ${MIN_CONFIDENCE}).`);
    handOff(
      breakage,
      matches,
      `its best guess was ${picked.role} "${picked.name}" with confidence ` +
        `${answer.confidence.toFixed(2)}, below the ${MIN_CONFIDENCE} threshold.`
    );
    continue;
  }

  const newLocator = suggestLocator(picked);
  console.log(`\n  Applying fix:`);
  const edits: Edit[] = [];
  for (const m of matches) {
    console.log(`    ${m.file}:${m.line}  ${m.property}`);
    console.log(`      before: ${m.locatorSource}`);
    console.log(`      after:  readonly ${m.property}: Locator = ${newLocator};`);
    edits.push(applyFix(m, newLocator));
  }

  if (verify(breakage)) {
    console.log(`\n  ✅ Fixed and verified. Review the change in VS Code (Source Control) before committing.`);
  } else {
    edits.forEach((edit) => writeFileSync(edit.file, edit.before));
    console.log(`\n  ❌ The test still fails with the fix, so I undid it.`);
    handOff(
      breakage,
      matches,
      `it tried ${newLocator}, but the test still failed, so the change was undone.`
    );
  }
}
