/**
 * Client for a "System One" decision model (Laya locally, or Jev).
 * Both speak the same POST /v1/systemone format, so this file does not care which one it talks to.
 */

export type DecisionConfig = {
  url: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
};

/** One thing the model can pick, e.g. { label: 'button "Proceed to checkout"' }. */
export type ChoiceOption = {
  label: string;
};

export type ChoiceRequest = {
  /** What the model "sees": the goal and where we are. */
  state: string;
  /** The question, e.g. "Which element should be clicked next to reach the goal?" */
  instructions: string;
  /** Options in page order (top to bottom). Order affects confidence, so never shuffle them. */
  options: ChoiceOption[];
};

export type ChoiceAnswer = {
  /** Index into the options array that the model picked. */
  index: number;
  /** Probability per option, same order as the options array. */
  probabilities: number[];
  /** 0 = belief spread evenly ("no idea"), 1 = all belief on one option. */
  confidence: number;
  latencyMs: number;
};

// Laya warns that confidence for 11+ options is uncalibrated, so we refuse to ask that.
export const MAX_OPTIONS = 10;

const RETRY_STATUSES = new Set([429, 529]);
const MAX_ATTEMPTS = 3;

export class DecisionClient {
  private readonly config: DecisionConfig;

  constructor(config: DecisionConfig) {
    this.config = config;
  }

  static fromEnv(): DecisionClient {
    const url = process.env.DECISION_URL;
    if (!url) {
      throw new Error('DECISION_URL is not set. Load env/.env.decision.local first.');
    }
    return new DecisionClient({
      url,
      apiKey: process.env.DECISION_API_KEY || undefined,
      model: process.env.DECISION_MODEL || undefined,
    });
  }

  async choose(request: ChoiceRequest): Promise<ChoiceAnswer> {
    const { options } = request;
    if (options.length < 2 || options.length > MAX_OPTIONS) {
      throw new Error(`choose() needs 2..${MAX_OPTIONS} options, got ${options.length}`);
    }

    // Keys are the option indexes "0", "1", ... JavaScript always orders integer-like keys
    // ascending, so the JSON we send keeps page order (the PowerShell problem can't happen here).
    const criteria: Record<string, string> = {};
    options.forEach((option, i) => {
      criteria[String(i)] = option.label;
    });

    const body = {
      ...(this.config.model ? { model: this.config.model } : {}),
      state: request.state,
      questions: {
        next: { type: 'choice', instructions: request.instructions, criteria },
      },
    };

    const started = performance.now();
    const json = await this.post(body);
    const latencyMs = Math.round(performance.now() - started);

    const answer = json?.answers?.next;
    if (!answer || answer.type !== 'choice') {
      throw new Error(`Unexpected response: ${JSON.stringify(json).slice(0, 300)}`);
    }

    return {
      index: Number(answer.choice),
      probabilities: options.map((_, i) => answer.probabilities[String(i)] ?? 0),
      confidence: answer.confidence,
      latencyMs,
    };
  }

  private async post(body: unknown): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    for (let attempt = 1; ; attempt++) {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 30_000),
      });

      if (response.ok) {
        return response.json();
      }
      // 429 = rate limited, 529 = overloaded: wait and retry (Jev docs recommend backoff).
      if (RETRY_STATUSES.has(response.status) && attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        continue;
      }
      const text = await response.text();
      throw new Error(`Decision model returned HTTP ${response.status}: ${text.slice(0, 300)}`);
    }
  }
}
