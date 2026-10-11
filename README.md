# playwright-laya-healer

**Self-healing Playwright locators. A free, local decision model fixes the simple breaks, every fix is verified by re-running the test, and Claude is only called for the hard ones.**

---

## Why this is needed

UI tests break for boring reasons. A developer renames a button or reshuffles the markup, a data-test id or a CSS class changes, and the test fails with waiting for getByTestId('proceed-1'), even though nothing is broken for the user.
The app works fine. Only the locator went stale.

The AI options for fixing this all have a cost:

| Option | The catch |
|---|---|
| Fix it by hand | Minutes of engineer time, again and again |
| **AI healer agent** (e.g. Playwright's healer, running on Claude) | Works well, but costs **tokens and minutes for every fix**, even trivial ones |
| **AI agent that drives the browser at run time** | Costs tokens **on every step of every CI run**, and a test that adapts at run time can **pass when it should fail** |

Most breaks are simple: something renamed or reworded. They don't need a large model that reasons for two minutes.

## What Laya / Jev bring

[Laya](https://github.com/NandhaKishorM/laya) (open source, runs locally) and [Jev](https://docs.typesafe.ai/api) (TypeSafe AI, hosted) are **"System One" decision models**. They don't write text. Given a situation and a list of options, they return **which option**, the **probability of each option** and a **calibrated confidence**, in a single fast pass.

That's exactly the question a broken locator asks: *"Which of the elements on this page is the 'Proceed to checkout' button now?"*

- **Fast:** about 0.2 s per decision (Laya on a laptop GPU).
- **Free or nearly free:** Laya runs locally; Jev costs about $0.084 per million input tokens.
- **Can't invent selectors:** it only chooses from elements Playwright actually found on the page.
- **Interchangeable:** both speak the same `POST /v1/systemone` API. This repo uses Laya; switching to Jev is a config change.

## How it saves tokens

An **escalation ladder**: the cheapest tool that can do the job goes first.

```
test fails → Laya (free, ~0.2 s) → verify → ✅ done
                                     │
                                     ❌ → undo → Claude (Playwright healer agent) → verify → you review
```

Measured on the Toolshop checkout flow:

| Scenario | Who fixed it | Claude tokens |
|---|---|---|
| Button renamed: new id, text "Proceed to checkout" → "Continue to checkout" | **Laya** (confidence 0.78, verified) | **0** |
| Button became an icon: text "→" | Laya was wrong (0.51) → undone → **Claude** | ~26k (~2 min) |

Every simple break Laya fixes is one Claude session you don't pay for. And **CI never uses AI**: while tests pass, the cost is zero.

## Guardrails

AI that edits tests has to be trusted, so the healer is built around checks.

1. **No AI in CI.** CI runs plain Playwright specs. The healer runs only on demand, after a failure.
2. **Choose, never invent.** The model only picks from real elements Playwright listed. It never writes selectors.
3. **Written intent.** Each locator carries an `@intent` note (`button "Proceed to checkout" — cart (step 1) to sign-in (step 2)`), so the healer knows *what* it's looking for, not just where it used to be.
4. **Controlled questions.** At most 10 options, always in page order, always the same tested wording. Confidence from small models shifts with wording and option order.
5. **Confidence threshold.** Below it, Laya doesn't touch the code; it hands over.
6. **Verification by re-run.** Every fix is proven by re-running the failing test.
7. **Automatic undo.** If the test still fails, the files are restored exactly.
8. **Rules for the fallback.** The hand-off tells Claude to change only the listed locators and, *if the app itself looks broken, to explain instead of changing the test*. Real bugs must not be "healed" away.
9. **Human review.** Every change ends as a normal diff you read before committing.
10. **Paid AI is opt-in.** Claude or any LLM-powered test agent is never called automatically; you decide when a fix is worth the tokens.

## How it works

| Piece | File | Job |
|---|---|---|
| Report | `test-results/results.json` | Which locator broke |
| Memory | `@intent` notes, `agent/intents.ts` | What it was meant to be |
| Eyes | `healSnapshot` fixture, `agent/perception.ts` | The clickable elements on the page at the moment of failure |
| Decision | `agent/decision-client.ts` | Asks Laya / Jev, returns choice + confidence |
| Healer | `agent/heal.ts` | Fix → verify → undo or hand off |
| Fallback | `.claude/agents/`, `.mcp.json` | Playwright Test Agents for Claude Code |

## Quick start

Requirements: Node.js 24+, and Python 3.10+ for Laya.

```bash
npm ci
npx playwright install chromium
cp env/.env.decision.example env/.env.decision.local      # Windows: copy env\.env.decision.example env\.env.decision.local
```

Start Laya in its own terminal (the first start downloads ~1–2 GB):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
# Intel GPU: pip install torch --index-url https://download.pytorch.org/whl/xpu   (before Laya)
pip install "laya[serve]"
$env:LAYA_HOST="127.0.0.1"; $env:LAYA_MODELS="english"; $env:LAYA_PRELOAD="1"   # + $env:LAYA_DEVICE="xpu" or "cuda"
laya-serve
```

Use it:

```bash
npx playwright test        # as usual (command line, so the report is written)
npm run heal               # only when a locator broke, then review the diff
```

If Laya hands over, paste `test-results/heal-handoff.md` into Claude Code to run the `playwright-test-healer` agent.

### Try the two scenarios

Create `env/.env.simulate.local` with `SIMULATE_UI_CHANGE=1` (renamed button, Laya fixes it) or `SIMULATE_UI_CHANGE=2` (icon-only button, goes to Claude). This changes the button in the test browser only. Run the checkout test, then `npm run heal`. Delete the file and `git checkout` the page objects afterwards.


## Limits (and how to extend them)

- **Only `getByTestId` breakages are detected for now.** Other locator types (`getByRole`, `getByText`, `getByLabel`, CSS) can be handled with small framework changes: extend the failure pattern in `agent/heal.ts` to recognise them, and match them to their `@intent` note in `agent/intents.ts`. The decision part stays the same, because Laya only ever chooses between elements on the page.
- **Only clickable elements are collected.** Inputs, dropdowns and checkboxes can be added to `agent/perception.ts` the same way.
- **Elements without text or a label are invisible to perception.** Adding `aria-label`s to icon-only buttons fixes this, and improves accessibility too.
- **Small context.** Laya's English model reads about 512 tokens, so busy pages are trimmed to 10 candidates and the right element can be cut. If you need more context or more candidates, switch to **Jev**: it reads about 32k–64k tokens and accepts up to 255 options per question. It uses the same API, so only `env/.env.decision.local` changes (and `MAX_OPTIONS` in `agent/decision-client.ts` can be raised). Laya's multilingual model, with up to about 8k tokens, is a free middle ground.


---

Built on top of an open-source sample Playwright framework for the [Practice Software Testing](https://practicesoftwaretesting.com) demo app. See [LICENSE](LICENSE).
