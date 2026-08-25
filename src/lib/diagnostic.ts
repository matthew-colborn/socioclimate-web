/**
 * The data moat diagnostic.
 *
 * Scores live as the visitor answers, shows the verdict and the reasoning
 * immediately, and never gates either behind contact details. Contact is the
 * obvious next step and is never required — a gated result would make the tool
 * a lead form wearing a diagnostic's clothes.
 */

type Answer = 'yes' | 'partly' | 'no';
const WEIGHT: Record<Answer, number> = { yes: 1, partly: 0.5, no: 0 };

/**
 * One question at a time.
 *
 * Progressive enhancement: with this module absent every question renders, in
 * order, and the form still works — the stepping is added on top, never relied
 * on. The class that hides the inactive ones is only ever applied from here.
 */
import { gate } from './scenes/threshold';

export function initDiagnostic(root: HTMLElement): void {
  const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-question]'));
  const scoreEl = root.querySelector<HTMLElement>('[data-score]');
  const verdictEl = root.querySelector<HTMLElement>('[data-verdict]');
  const reasonEl = root.querySelector<HTMLElement>('[data-reason]');
  const resultEl = root.querySelector<HTMLElement>('[data-result]');
  const form = root.querySelector<HTMLFormElement>('form');
  const payload = root.querySelector<HTMLInputElement>('[data-payload]');
  const status = root.querySelector<HTMLElement>('[data-status]');

  const answers = new Map<string, Answer>();

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

  // ---- one at a time --------------------------------------------------
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let at = 0;

  // Only now does anything get hidden, so a failed script leaves all five
  // questions visible rather than an empty form.
  root.classList.add('is-stepped');

  const show = (i: number, instant = false): void => {
    at = Math.max(0, Math.min(groups.length, i));
    groups.forEach((g, k) => {
      g.classList.toggle('is-on', k === at);
      // Off-screen questions must not be reachable by keyboard either.
      g.querySelectorAll<HTMLElement>('input').forEach((el) => {
        if (k === at) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', '-1');
      });
    });
    root.classList.toggle('is-done', at >= groups.length);
    if (progress) progress.style.setProperty('--k', String(at / groups.length));
    if (!instant && !reduced) gate.pulse = 1;
  };

  const progress = root.querySelector<HTMLElement>('[data-progress]');

  for (const g of groups) {
    g.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.type !== 'radio') return;
      answers.set(g.dataset.question!, input.value as Answer);
      update();

      // Let the choice register visually, then hand over to the next.
      const i = groups.indexOf(g);
      if (i !== at) return;
      g.classList.add('is-leaving');
      window.setTimeout(() => {
        g.classList.remove('is-leaving');
        show(at + 1);
        // Moving focus keeps a keyboard user with the question that just
        // arrived instead of stranding them on a hidden radio.
        if (at < groups.length) groups[at].querySelector<HTMLElement>('input')?.focus();
      }, reduced ? 0 : 380);
    });
  }

  // Stepping back, for anyone who wants to change an answer.
  root.querySelector('[data-back]')?.addEventListener('click', () => {
    if (at > 0) show(at - 1);
  });

  show(0, true);
  update();

  // The gateway swings open when the questions appear.
  const details = root.closest('.diag')?.querySelector<HTMLDetailsElement>('.reveal-form');
  details?.addEventListener('toggle', () => {
    gate.open = details.open ? 1 : 0;
    if (details.open && !reduced) gate.pulse = 1;
  });

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
    gate.surge = 1;
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
      gate.surge = res.ok ? 1 : 0;
      if (res.ok) form.reset();
    } catch {
      status.textContent = 'That did not send. Mail matthew@socioclimate.io instead.';
    }
  });
}
