/**
 * Talks to the DartFit API, or — in the demo build (`vite build --mode demo`) — runs the very same
 * engine in the browser against the bundled catalogue. Both return the same shapes.
 */
import {
  buildExplainInput,
  fit as runFit,
  proTwin,
  recommend,
  sensitivity,
  templateExplanation,
  type Answers,
  type Fit,
  type Measurements,
  type Pick,
  type ProTwin,
  type Recommendation,
  type Variant,
  type WhatIf,
} from '@dartfit/engine';
import { catalogue } from 'virtual:dartfit-catalogue';
import { getLang, type Lang } from './i18n';

export const DEMO = import.meta.env.MODE === 'demo';

export interface Offer {
  id: string;
  retailer: string;
  retailerName: string;
  kind: 'product' | 'search';
  country: string;
  price: number | null;
  currency: string | null;
  goUrl: string;
}

export interface FitResult {
  id: string | null;
  saved: boolean;
  fit: Fit;
  recommendation: Omit<Recommendation, 'picks'> & { picks: Array<Pick & { offers: Offer[] }> };
  proTwin: ProTwin | null;
  whatIf: WhatIf[];
  country: string;
  measurements?: Measurements | null;
  answers?: Answers;
  demo?: boolean;
}

export const variants = (): Variant[] => catalogue.variants;
export const pros = () => catalogue.pros;

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'same-origin',
  });
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status });
  return (await r.json()) as T;
}

// ── Demo: the engine in the browser ────────────────────────────────────
const LOCAL_KEY = 'df_local_result';

function demoOffers(v: Variant): Offer[] {
  const q = encodeURIComponent(`${v.brand} ${v.model} ${v.weightG}g`);
  return [
    {
      id: `search:bol:${v.id}`,
      retailer: 'bol',
      retailerName: 'bol.com',
      kind: 'search',
      country: 'NL',
      price: null,
      currency: null,
      goUrl: `https://www.bol.com/nl/nl/s/?searchtext=${q}`,
    },
    {
      id: `azdarts:${v.id}`,
      retailer: 'azdarts',
      retailerName: 'A-Z Darts',
      kind: 'product',
      country: '*',
      price: v.priceUsd,
      currency: 'USD',
      goUrl: v.sourceUrl,
    },
  ];
}

function resolveCurrent(answers: Answers): Answers {
  const cur = answers.current;
  if (!cur?.variantId) return answers;
  const v = catalogue.variants.find((x) => x.id === cur.variantId);
  if (!v) return answers;
  return {
    ...answers,
    current: {
      ...cur,
      weightG: v.weightG,
      lengthMm: v.lengthMm,
      diameterMm: v.diameterMm,
      ...(v.gripIntensity !== null ? { gripIntensity: v.gripIntensity } : {}),
      ...(v.balance ? { balance: v.balance } : {}),
    },
  };
}

function localFit(m: Measurements | undefined, answers: Answers): FitResult {
  const a = resolveCurrent(answers);
  const f = runFit(m, a);
  const rec = recommend(f, catalogue.variants, { budgetUsd: a.budgetUsd });
  const result: FitResult = {
    id: 'local',
    saved: false,
    fit: f,
    recommendation: { ...rec, picks: rec.picks.map((p) => ({ ...p, offers: demoOffers(p.variant) })) },
    proTwin: proTwin(f, catalogue.pros, catalogue.variants),
    whatIf: sensitivity(m, a, catalogue.variants, { budgetUsd: a.budgetUsd }).slice(0, 4),
    country: 'NL',
    measurements: m ?? null,
    answers: a,
    demo: true,
  };
  try {
    sessionStorage.setItem(LOCAL_KEY, JSON.stringify({ m: m ?? null, a }));
  } catch {
    /* ignore */
  }
  return result;
}

// ── Public API ─────────────────────────────────────────────────────────
export async function createFit(m: Measurements | undefined, answers: Answers): Promise<FitResult> {
  if (DEMO) return localFit(m, answers);
  return json<FitResult>('/api/fit', {
    method: 'POST',
    body: JSON.stringify({ measurements: m, answers, lang: getLang() }),
  });
}

export async function getFit(id: string): Promise<FitResult> {
  if (DEMO || id === 'local') {
    const raw = (() => {
      try {
        return sessionStorage.getItem(LOCAL_KEY);
      } catch {
        return null;
      }
    })();
    if (!raw) throw Object.assign(new Error('not found'), { status: 404 });
    const { m, a } = JSON.parse(raw) as { m: Measurements | null; a: Answers };
    return localFit(m ?? undefined, a);
  }
  return json<FitResult>(`/api/fit/${encodeURIComponent(id)}`);
}

export async function explain(r: FitResult, pick: Pick, lang: Lang): Promise<{ text: string; source: 'ai' | 'template' }> {
  if (DEMO || !r.id || r.id === 'local') {
    const m = r.measurements ?? null;
    const input = buildExplainInput(
      lang,
      r.fit,
      r.answers as Answers,
      pick,
      r.proTwin,
      m ? { handLengthMm: m.handLengthMm, middleLengthMm: m.middleLengthMm } : null,
    );
    return { text: templateExplanation(input), source: 'template' };
  }
  return json('/api/explain', { method: 'POST', body: JSON.stringify({ fitId: r.id, variantId: pick.variant.id, lang }) });
}

export interface Me {
  user: null | { id: string; email: string; lang: Lang; alerts_email: boolean; alerts_push: boolean; feedback_email: boolean; admin?: boolean };
  fits?: Array<{ id: string; created_at: string; brand: string | null; name: string | null; weight_g: number | null }>;
}

export const me = (): Promise<Me> => (DEMO ? Promise.resolve({ user: null }) : json<Me>('/api/me'));

export const requestLogin = (body: {
  email: string;
  fitId?: string;
  alertsEmail: boolean;
  feedbackEmail: boolean;
  confirmsAge16: boolean;
}) => json('/api/auth/request', { method: 'POST', body: JSON.stringify({ ...body, lang: getLang() }) });

export const setOptins = (o: { alertsEmail?: boolean; feedbackEmail?: boolean; alertsPush?: boolean }) =>
  json('/api/me/optins', { method: 'POST', body: JSON.stringify(o) });

export const logout = () => json('/api/auth/logout', { method: 'POST', body: '{}' });
export const deleteAccount = () => json('/api/me', { method: 'DELETE' });

/** Refresh the bundled catalogue from the API (admin-added darts), when one is running. */
export async function refreshCatalogue(): Promise<void> {
  if (DEMO) return;
  try {
    const r = await json<{ variants: Variant[] }>('/api/catalogue');
    if (Array.isArray(r.variants) && r.variants.length) catalogue.variants = r.variants;
  } catch {
    /* keep the bundled copy */
  }
}
