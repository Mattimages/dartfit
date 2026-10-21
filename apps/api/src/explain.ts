import {
  allowedNumbers,
  findUnsupportedNumbers,
  templateExplanation,
  type ExplainInput,
} from '@dartfit/engine';

export interface ExplainClient {
  complete(system: string, user: string): Promise<string>;
}

/** Anthropic client, created only when ANTHROPIC_API_KEY is set. */
export async function anthropicClient(apiKey: string, model: string): Promise<ExplainClient> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey, timeout: 10_000, maxRetries: 1 });
  return {
    async complete(system, user) {
      const msg = await client.messages.create({
        model,
        max_tokens: 400,
        system,
        messages: [{ role: 'user', content: user }],
      });
      return msg.content
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('')
        .trim();
    },
  };
}

export function systemPrompt(lang: 'nl' | 'en'): string {
  const language = lang === 'nl' ? 'Dutch (informal "je")' : 'British English';
  return [
    `You explain a dart fitting result to a darts player in ${language}.`,
    'Write 3 or 4 short sentences of plain prose: no lists, no headings, no emoji.',
    'Use ONLY the facts in the JSON. Every number you write must appear in the JSON; do not convert units, add percentages, or estimate anything.',
    'Say why the recommended dart suits this player, naming at most two strengths and the biggest compromise if there is one.',
    "If proTwin is present, say the player is closest on specs to that player's dart (or signature range when exactDart is false). Never claim the player throws like the pro.",
    'Never say "perfect", "scientific" or "guaranteed". Confidence is given in the JSON; if it is low, say the result is a starting point to try.',
  ].join('\n');
}

export interface ExplainResult {
  text: string;
  source: 'ai' | 'template';
  rejected?: string[];
}

/**
 * Ask the model, check every number against the input, retry once with the problem named,
 * and fall back to the deterministic template if it still invents numbers or fails.
 */
export async function explain(input: ExplainInput, client: ExplainClient | null): Promise<ExplainResult> {
  if (!client) return { text: templateExplanation(input), source: 'template' };
  const allowed = allowedNumbers(input);
  const user = JSON.stringify(input);
  let rejected: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const note = rejected.length
        ? `\n\nYour previous answer used numbers not in the JSON (${rejected.join(', ')}). Remove them.`
        : '';
      const text = await client.complete(systemPrompt(input.lang), user + note);
      const bad = findUnsupportedNumbers(text, allowed);
      if (!bad.length && text.length >= 40 && text.length <= 900) return { text, source: 'ai' };
      rejected = bad.length ? bad : ['length'];
    } catch {
      break;
    }
  }
  return { text: templateExplanation(input), source: 'template', rejected };
}
