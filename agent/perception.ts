/**
 * Perception: turns the live page into a short, ordered list of things the agent could click.
 * The decision model only ever chooses from this list, so it can never invent a selector.
 */
import type { Locator, Page } from '@playwright/test';
import { MAX_OPTIONS, type ChoiceOption } from './decision-client.ts';

export type Region = 'main' | 'header' | 'footer';

export type Candidate = {
  /** Stamped on the element as data-agent-id, so we can find it again to click it. */
  agentId: number;
  role: 'button' | 'link';
  name: string;
  testId?: string;
  region: Region;
};

export type Perception = {
  /** What we send to the model (at most MAX_OPTIONS). */
  options: Candidate[];
  /** What we left out to stay under the limit; logged so nothing disappears silently. */
  dropped: Candidate[];
};

const CLICKABLE = 'a[href], button, input[type="submit"], input[type="button"], [role="button"]';

/** All visible, enabled clickable elements, in page (DOM) order. */
export async function collectCandidates(page: Page): Promise<Candidate[]> {
  return page.evaluate((selector) => {
    // Clear ids from the previous step so a stale id can't point at the wrong element.
    document.querySelectorAll('[data-agent-id]').forEach((el) => el.removeAttribute('data-agent-id'));

    const found: Candidate[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
      if (!el.checkVisibility() || el.getBoundingClientRect().width === 0) continue;
      if ((el as HTMLButtonElement).disabled) continue;

      const testId = el.getAttribute('data-test') ?? undefined;
      const text =
        el.getAttribute('aria-label') ||
        el.innerText ||
        (el as HTMLInputElement).value ||
        el.title ||
        testId ||
        '';
      const name = text.trim().replace(/\s+/g, ' ').slice(0, 60);
      if (!name) continue;

      const region = el.closest('footer, app-footer')
        ? 'footer'
        : el.closest('nav, header, app-header')
          ? 'header'
          : 'main';

      const agentId = found.length;
      el.setAttribute('data-agent-id', String(agentId));
      found.push({ agentId, role: el.tagName === 'A' ? 'link' : 'button', name, testId, region });
    }
    return found;
  }, CLICKABLE);
}

/**
 * Picks at most MAX_OPTIONS candidates. Version 1 rules, kept simple on purpose:
 *   1. drop the footer (legal links, socials),
 *   2. main content first, then header — the next step usually lives in the content,
 *   3. page order inside each group, then cut at the limit.
 * Rule 2 is a deliberate bias: options listed first get slightly higher confidence.
 */
export function narrow(candidates: Candidate[], max = MAX_OPTIONS): Perception {
  const ranked = [
    ...candidates.filter((c) => c.region === 'main'),
    ...candidates.filter((c) => c.region === 'header'),
  ];
  const footer = candidates.filter((c) => c.region === 'footer');
  return { options: ranked.slice(0, max), dropped: [...ranked.slice(max), ...footer] };
}

export async function perceive(page: Page): Promise<Perception> {
  return narrow(await collectCandidates(page));
}

/** The label format we tested in step 7: button "Proceed to checkout". */
export function toChoiceOptions(candidates: Candidate[]): ChoiceOption[] {
  return candidates.map((c) => ({ label: `${c.role} "${c.name}"` }));
}

export function locatorFor(page: Page, candidate: Candidate): Locator {
  return page.locator(`[data-agent-id="${candidate.agentId}"]`);
}
