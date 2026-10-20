/** Hash router. Hash routes work on any static host and match the API's magic-link redirects. */
export type Cleanup = void | (() => void);
export type View = (root: HTMLElement, params: Record<string, string>, query: URLSearchParams) => Cleanup | Promise<Cleanup>;

const routes: Array<{ re: RegExp; keys: string[]; view: View }> = [];
let cleanup: (() => void) | null = null;
let onChange: ((path: string) => void) | null = null;

export function route(pattern: string, view: View) {
  const keys: string[] = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k: string) => (keys.push(k), '([^/]+)'))}$`);
  routes.push({ re, keys, view });
}

export function go(path: string) {
  if (location.hash.slice(1) === path) void render();
  else location.hash = path;
}

export function current(): { path: string; query: URLSearchParams } {
  const raw = location.hash.slice(1) || '/';
  const [path, q] = raw.split('?');
  return { path: path || '/', query: new URLSearchParams(q ?? '') };
}

export async function render() {
  const root = document.getElementById('main');
  if (!root) return;
  cleanup?.();
  cleanup = null;
  const { path, query } = current();
  for (const r of routes) {
    const m = path.match(r.re);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1] ?? '')]));
    root.replaceChildren();
    window.scrollTo({ top: 0 });
    const c = await r.view(root, params, query);
    cleanup = typeof c === 'function' ? c : null;
    onChange?.(path);
    // Move focus to the new page's heading for screen-reader and keyboard users.
    const h1 = root.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    }
    return;
  }
  go('/');
}

export function start(listener: (path: string) => void) {
  onChange = listener;
  window.addEventListener('hashchange', () => void render());
  void render();
}
