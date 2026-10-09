# playwright-laya-healer

Self-healing Playwright locators, **without putting AI in your CI**.

When a locator breaks, a small local decision model ([Laya](https://github.com/NandhaKishorM/laya), which speaks the same API as TypeSafe's [Jev](https://docs.typesafe.ai/api)) picks the element the locator was meant to find. The healer writes the fix, **re-runs the failing test to verify it**, and undoes it if the test still fails. Breaks it can't fix are handed to the [Playwright healer agent](https://playwright.dev/docs/test-agents) (Claude), and a human reviews every change.

```
npx playwright test ── ✅ pass ──► done (no AI involved)
        │
        ❌ "waiting for getByTestId('proceed-1')"
        ▼
npm run heal
   1. report      which locator broke?            test-results/results.json
   2. memory      what was it meant to be?        @intent comment in the page object
   3. eyes        what is on the page now?        heal-snapshot saved at failure time
   4. Laya        which element is it? (+ confidence, ~0.2 s, free)
   5. fix + verify: edit page object → re-run the test
        ├── ✅ passes → keep, you review the diff
        └── ❌ fails or low confidence → undo → hand-off note for the Playwright healer (Claude)
```

The full write-up, with two measured scenarios, is in the accompanying blog post.

---

## Why this design

| | Normal spec | Runtime AI agent | **This healer** |
|---|---|---|---|
| AI in CI | no | every step, every run | **no** |
| UI change (renamed id/text) | fails | adapts silently | **fixed once, verified, reviewed** |
| Cost per CI run | 0 | tokens/compute each run | **0** |
| Cost per fix | your time | – | **free (Laya)**, tokens only for hard cases (Claude) |

- **The model only chooses, it never invents.** Playwright lists the real elements on the page, and the model picks one, so it can't hallucinate a selector.
- **Verification beats confidence.** In our runs a wrong answer came back with confidence 0.51. The re-run caught it and the change was undone.
- **The expensive model is the fallback, not the default.**

## What's in this repo

| Path | Role |
|---|---|
| `agent/decision-client.ts` | Client for any `/v1/systemone` decision model (Laya or Jev). Max 10 options, stable option order, retries on 429/529. |
| `agent/perception.ts` | Lists visible clickable elements in page order, drops the footer, keeps at most 10 |
| `agent/intents.ts` | Reads `@intent` comments, i.e. what each locator is for |
| `agent/heal.ts` | The healer: report → intent → snapshot → Laya → fix → verify → undo or hand off |
| `agent/try-*.ts` | Small scripts to try each part on its own |
| `tests/pages/base.ts` | `healSnapshot` fixture (saves page elements when a test fails) and `simulateUiChange` (demo only) |
| `tests/pages/**` `@intent` | e.g. `/** @intent button "Proceed to checkout" — cart (step 1) to sign-in (step 2) */` |
| `.claude/agents/`, `.mcp.json` | Playwright Test Agents (planner, generator, healer) for Claude Code |

## Setup

**Requirements:** Node.js 24+ (runs `.ts` files directly) and Python 3.10+ for Laya.

```bash
npm ci
npx playwright install chromium
cp env/.env.decision.example env/.env.decision.local     # Windows: copy env\.env.decision.example env\.env.decision.local
```

**Start Laya** (separate terminal; the first start downloads ~1–2 GB of weights):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
# Intel GPU (XPU): pip install torch --index-url https://download.pytorch.org/whl/xpu   (before Laya)
pip install "laya[serve]"
$env:LAYA_HOST="127.0.0.1"; $env:LAYA_MODELS="english"; $env:LAYA_PRELOAD="1"   # add $env:LAYA_DEVICE="xpu" / "cuda" if available
laya-serve
```

Laya runs on CPU too (slower). To use **Jev** instead, change `DECISION_URL`, `DECISION_API_KEY` and `DECISION_MODEL` in `env/.env.decision.local`; the code stays the same.

## Usage

```bash
npx playwright test                 # as usual. Command line, not --ui, so the report is written
npm run heal                        # only when a locator broke
```

Then review the change (`git diff`) before committing. If Laya hands over, paste `test-results/heal-handoff.md` into Claude Code, which runs the `playwright-test-healer` agent.

### Try the demo

`simulateUiChange` changes the cart's checkout button in the test browser only. Create `env/.env.simulate.local` with:

| Value | Simulated change | Expected |
|---|---|---|
| `SIMULATE_UI_CHANGE=1` | id `checkout-continue`, text "Continue to checkout" | Laya fixes it |
| `SIMULATE_UI_CHANGE=2` | id `btn-next`, text "→" (icon only) | Laya fails safely → Claude |

Delete the file afterwards and restore the locator with `git checkout`.

## Limits (honest list)

- Laya's English checkpoint reads ~512 tokens, so perception keeps at most 10 options. The right element can be cut on busy pages.
- Confidence depends on wording and **option order**. The question format is fixed in code for that reason.
- The 0.5 confidence threshold is a starting point, not calibrated.
- Only `getByTestId` breakages are detected so far, and elements without text or a label are invisible to perception.

## The base framework

The E2E / API / ARIA-snapshot framework underneath (page component objects, API seeding, session caching, GraphQL and HTTP `QUERY` tests, CI pipeline) targets the public [Practice Software Testing (Toolshop)](https://practicesoftwaretesting.com) demo app.

| Command | Scope |
|---|---|
| `npm run test:e2e` | Browser E2E (`toolshop-e2e`) |
| `npm run test:api` | API tests (`toolshop-api`) |
| `npm run test:mock` | Network-mocking tests (`toolshop-mock`) |
| `npm run test:visual` | ARIA snapshot tests |
| `npx tsc --noEmit` | Type check |

## Credits

Built on top of [szendzij/playwright-sample-project](https://github.com/szendzij/playwright-sample-project) (MIT), which provides the Playwright framework this healer was added to. See [LICENSE](LICENSE).
