/**
 * "Je gooit als …": a page about the pro whose dart is closest to your fit. Their dart next to your
 * ideal, what you have in common, the next pros on the list, and a share. Everything comes from the
 * same scoring as the result (engine `scoreVariant` on the catalogue's pro darts).
 */
import { scoreVariant, type Fit, type Pro, type Variant } from '@dartfit/engine';
import { h } from '../h';
import { getLang, num, t } from '../i18n';
import { go } from '../router';
import { getFit, pros, shopFor, variants } from '../api';
import { matchPct } from '../score';
import { dartMedia } from '../media';
import { balanceName, dartName, shapeName } from './words';
import { shareBox } from './share';
import { proArt } from '../draw/pro-art';

const slug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** The static guide page about this pro, in the visitor's language. */
export function proGuideUrl(name: string): string {
  const lang = getLang();
  const dir = lang === 'en' ? 'pros' : lang === 'de' ? 'profis' : 'profs';
  return `/${lang}/${dir}/${slug(name)}/`;
}

export interface RankedPro {
  pro: Pro;
  v: Variant;
  pct: number;
}

/** Every pro whose dart is in the catalogue, best match first. */
export function rankPros(f: Fit): RankedPro[] {
  const byId = new Map(variants().map((v) => [v.id, v]));
  return pros()
    .map((pro) => {
      const v = byId.get(pro.variantId);
      return v && v.tip === f.tip ? { pro, v, pct: matchPct(scoreVariant(f, v).cost) } : null;
    })
    .filter((x): x is RankedPro => !!x)
    .sort((a, b) => b.pct - a.pct);
}

/** Plain sentences on what your ideal dart and the pro's dart share, and where they differ. */
function common(f: Fit, v: Variant): string[] {
  const out: string[] = [];
  const ideal = f.barrel;
  if (v.shape && ideal.shape === v.shape) out.push(t('pm.same.shape', { shape: shapeName(v.shape) }));
  const dw = v.weightG - ideal.massG;
  out.push(
    Math.abs(dw) < 1
      ? t('pm.same.weight', { w: num(v.weightG, 0) })
      : t(dw > 0 ? 'pm.heavier' : 'pm.lighter', { d: num(Math.abs(dw), 0) }),
  );
  const dl = v.lengthMm - ideal.lengthMm;
  out.push(
    Math.abs(dl) < 2
      ? t('pm.same.length')
      : t(dl > 0 ? 'pm.longer' : 'pm.shorter', { d: num(Math.abs(dl), 0) }),
  );
  const dd = v.diameterMm - ideal.diameterMm;
  out.push(
    Math.abs(dd) < 0.3
      ? t('pm.same.thick')
      : t(dd > 0 ? 'pm.thicker' : 'pm.thinner', { d: num(Math.abs(dd), 1) }),
  );
  if (v.balance && v.balance === f.preferredBalance)
    out.push(t('pm.same.balance', { b: balanceName(v.balance) }));
  return out;
}

export async function proMatchView(root: HTMLElement, params: Record<string, string>) {
  let r;
  try {
    r = await getFit(params.id ?? '');
  } catch {
    return go('/questions');
  }
  const f = r.fit;
  const ranked = rankPros(f);
  const top = ranked[0];
  if (!top) return go(`/fit/${params.id}`);
  const { pro, v, pct } = top;
  const ideal = f.barrel;
  const row = (label: string, you: string, him: string) =>
    h('tr', null, h('th', { scope: 'row' }, label), h('td', null, you), h('td', null, him));
  const shop = shopFor(v);
  root.append(
    h(
      'section',
      { class: 'stack pm' },
      h(
        'div',
        { class: 'twin pm-hero has-art' },
        proArt(pro),
        h('p', { class: 'kicker' }, t('r.twin')),
        h('h1', null, pro.name),
        h('p', null, t('pm.dart', { dart: dartName(v), w: num(v.weightG) })),
        h('p', { class: 'pm-pct' }, t('fit.win.total', { n: pct })),
      ),
      h('p', { class: 'lead' }, t(pro.exactDart ? 'pm.lead.exact' : 'pm.lead.signature', { name: pro.name })),
      h(
        'article',
        { class: 'card pm-dart' },
        dartMedia(v),
        shop
          ? h(
              'a',
              { class: 'btn block', href: shop.url, target: '_blank', rel: 'noopener sponsored' },
              t('r.search', { shop: shop.name }),
            )
          : null,
      ),
      h('h2', null, t('pm.compare')),
      h(
        'div',
        { class: 'table-wrap' },
        h(
          'table',
          { class: 'pm-table' },
          h(
            'thead',
            null,
            h('tr', null, h('th', null, ''), h('th', null, t('pm.you')), h('th', null, pro.name)),
          ),
          h(
            'tbody',
            null,
            row(t('fit.r.weight'), `${num(ideal.massG, 0)} g`, `${num(v.weightG)} g`),
            row(t('fit.r.length'), `${num(ideal.lengthMm)} mm`, `${num(v.lengthMm)} mm`),
            row(t('fit.r.diameter'), `${num(ideal.diameterMm, 1)} mm`, `${num(v.diameterMm, 1)} mm`),
            row(t('pm.shape'), shapeName(ideal.shape), shapeName(v.shape)),
            row(t('r.balance'), balanceName(f.preferredBalance), balanceName(v.balance)),
          ),
        ),
      ),
      h('h2', null, t('pm.common', { name: pro.name })),
      h('ul', { class: 'pm-common' }, ...common(f, v).map((x) => h('li', null, x))),
      ranked.length > 1
        ? h(
            'section',
            { class: 'stack' },
            h('h2', null, t('pm.more')),
            h(
              'ol',
              { class: 'pm-more' },
              ...ranked
                .slice(1, 4)
                .map((x) =>
                  h(
                    'li',
                    null,
                    h(
                      'a',
                      { href: proGuideUrl(x.pro.name) },
                      h('b', null, x.pro.name),
                      h('span', null, dartName(x.v)),
                    ),
                    h('span', { class: 'pm-more-pct' }, `${x.pct}%`),
                  ),
                ),
            ),
          )
        : null,
      shareBox({ v, pct, proId: pro.id, proName: pro.name }),
      h('a', { class: 'btn link', href: proGuideUrl(pro.name) }, t('pm.guide', { name: pro.name })),
      h('a', { class: 'btn ghost block', href: `#/fit/${params.id}` }, t('pm.back')),
    ),
  );
}
