/**
 * The data moat diagnostic.
 *
 * Scores live as the visitor answers, shows the verdict and the reasoning
 * immediately, and never gates either behind contact details. Contact is the
 * obvious next step and is never required — a gated result would make the tool
 * a lead form wearing a diagnostic's clothes.
 */
import { Engine, prefersReducedMotion } from './field/engine';
import { diagnosticField, state } from './scenes/diagnostic-field';

type Answer = 'yes' | 'partly' | 'no';
const WEIGHT: Record<Answer, number> = { yes: 1, partly: 0.5, no: 0 };

export function initDiagnostic(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-diag-field]');
  const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-question]'));
  const scoreEl = root.querySelector<HTMLElement>('[data-score]');
  const verdictEl = root.querySelector<HTMLElement>('[data-verdict]');
  const reasonEl = root.querySelector<HTMLElement>('[data-reason]');
  const resultEl = root.querySelector<HTMLElement>('[data-result]');
  const form = root.querySelector<HTMLFormElement>('form');
  const payload = root.querySelector<HTMLInputElement>('[data-payload]');
  const status = root.querySelector<HTMLElement>('[data-status]');

  const answers = new Map<string, Answer>();

  let engine: Engine | undefined;
  if (canvas) {
    engine = new Engine({
      canvas,
      scene: diagnosticField,
      seed: 90210,
      still: prefersReducedMotion(),
    });
    if (!prefersReducedMotion()) engine.play();
  }

  function verdict(score: number, answered: number): { title: string; body: string } {
    if (answered === 0) {
      return {
        title: 'Answer the five',
        body: 'Nothing is sent anywhere and no address is required to see the result.',
      };
    }
    if (score >= 4) {
      return {
        title: 'There is a moat here',
        body:
          'You are generating a record nobody else holds, in a market where the rules ' +
          'are public but scattered and the price is not set by open bidding. The work ' +
          'to normalise it is tedious rather than hard, which is why no large vendor has ' +
          'done it. The history is the part that cannot be bought later — that clock ' +
          'starts the day someone begins keeping it properly.',
      };
    }
    if (score >= 2.5) {
      return {
        title: 'Partial. The gap is specific',
        body:
          'Some of the conditions hold and some do not. That is usually more tractable ' +
          'than it sounds, because the missing piece is normally the record-keeping ' +
          'rather than the market. Worth a conversation about which condition is ' +
          'actually absent.',
      };
    }
    return {
      title: 'Probably not a moat',
      body:
        'On these answers the record you produce is either already public, already ' +
        'standardised, or set by a market that publishes its prices. That is not a bad ' +
        'business — it is just not one where owning the observation layer is the ' +
        'advantage. We would rather tell you that than sell you a project.',
    };
  }

  function update(): void {
    let score = 0;
    for (const v of answers.values()) score += WEIGHT[v];
    const answered = answers.size;

    state.target = score;
    state.total = groups.length;

    if (scoreEl) scoreEl.textContent = `${score % 1 === 0 ? score : score.toFixed(1)} / ${groups.length}`;
    const v = verdict(score, answered);
    if (verdictEl) verdictEl.textContent = v.title;
    if (reasonEl) reasonEl.textContent = v.body;
    if (resultEl) resultEl.dataset.answered = answered === groups.length ? 'all' : 'some';

    if (payload) {
      const lines = groups.map((g) => {
        const key = g.dataset.question!;
        const label = g.querySelector('[data-qtext]')?.textContent?.trim() ?? key;
        return `${label} — ${answers.get(key) ?? 'unanswered'}`;
      });
      payload.value = `Score ${score} of ${groups.length}\nVerdict: ${v.title}\n\n${lines.join('\n')}`;
    }
  }

  for (const g of groups) {
    g.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.type !== 'radio') return;
      answers.set(g.dataset.question!, input.value as Answer);
      update();
    });
  }

  update();

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!status) return;
    const endpoint = form.dataset.endpoint;
    const key = form.dataset.key;
    if (!endpoint || !key) {
      status.textContent =
        'The form endpoint is not configured yet. Mail matthew@socioclimate.io directly.';
      return;
    }
    status.textContent = 'Sending…';
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: key, ...body }),
      });
      status.textContent = res.ok
        ? 'Sent. You will get a reply from a person, not a sequence.'
        : 'That did not send. Mail matthew@socioclimate.io instead.';
      if (res.ok) form.reset();
    } catch {
      status.textContent = 'That did not send. Mail matthew@socioclimate.io instead.';
    }
  });
}
