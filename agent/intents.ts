/**
 * Reads the @intent comments in page objects, e.g.
 *   /** @intent button "Proceed to checkout" — cart (step 1) to sign-in (step 2) *\/
 *   readonly proceed1Button: Locator = this.page.getByTestId('proceed-1');
 * The healer uses them to know what a broken locator was meant to find.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type Intent = {
  file: string;
  /** 1-based line of the `readonly ...` declaration (for editor links and patches). */
  line: number;
  property: string;
  role: 'button' | 'link';
  label: string;
  purpose: string;
  /** The locator code as written, possibly spanning lines. */
  locatorSource: string;
  /** First getByTestId('...') value in the locator, if any. */
  testId?: string;
};

const INTENT = /@intent\s+(button|link)\s+"([^"]+)"\s+—\s+(.+?)\s*\*\//;
const DECLARATION = /readonly\s+(\w+)\s*:\s*Locator\s*=/;
const TEST_ID = /getByTestId\(\s*['"]([^'"]+)['"]\s*\)/;

export function readIntents(file: string): Intent[] {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const intents: Intent[] = [];

  lines.forEach((text, i) => {
    const intent = INTENT.exec(text);
    if (!intent) return;

    const declarationIndex = i + 1;
    const declaration = DECLARATION.exec(lines[declarationIndex] ?? '');
    if (!declaration) {
      throw new Error(`${file}:${i + 1}: @intent must sit directly above a readonly Locator`);
    }

    // The locator may span several lines; read until the closing semicolon.
    const sourceLines: string[] = [];
    for (let j = declarationIndex; j < lines.length; j++) {
      sourceLines.push(lines[j].trim());
      if (lines[j].trimEnd().endsWith(';')) break;
    }
    const locatorSource = sourceLines.join(' ');

    intents.push({
      file,
      line: declarationIndex + 1,
      property: declaration[1],
      role: intent[1] as Intent['role'],
      label: intent[2],
      purpose: intent[3],
      locatorSource,
      testId: TEST_ID.exec(locatorSource)?.[1],
    });
  });

  return intents;
}

/** All intents in tests/pages (page objects and components). */
export function readAllIntents(root = 'tests/pages'): Intent[] {
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.ts'))
    .flatMap((name) => readIntents(join(root, name)));
}

/** Which intents use this test id? (A broken test id can appear in several page objects.) */
export function findIntentsByTestId(intents: Intent[], testId: string): Intent[] {
  return intents.filter((intent) => intent.testId === testId);
}
