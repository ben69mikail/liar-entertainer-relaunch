/**
 * Tiny model of Netlify's `_redirects` evaluation, enough to test our rules offline.
 *
 * Modelled behaviour (Netlify docs "Redirects and rewrites"):
 * - one rule per line: `from [key=:val ...] to [status[!]]`, `#` comments, default status 301
 * - first matching rule wins
 * - rules WITHOUT `!` are skipped when a file exists for the path (no shadowing); `!` always applies
 * - trailing slashes are ignored when matching (`/foo` == `/foo/`)
 * - `:name` matches exactly one path segment, a final `*` matches one or more remaining segments
 *   (`:splat`); we deliberately do NOT let `/foo/*` match `/foo` (conservative — the rules list
 *   the bare path explicitly where it matters)
 * - query conditions require every listed parameter to be present; such rules drop the query
 * - absolute `from` URLs (host rules) only match when a host is given
 */
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface Rule {
  line: number;
  host?: string;
  from: string;
  query: Record<string, string>;
  to: string;
  status: number;
  force: boolean;
}

export interface Hit {
  rule: Rule;
  to: string;
  status: number;
}

export function parseRedirects(text: string): Rule[] {
  const rules: Rule[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const parts = line.split(/\s+/);
    let from = parts.shift()!;
    const query: Record<string, string> = {};
    while (parts.length && /^[^/:]+=/.test(parts[0]) && !/^https?:/.test(parts[0])) {
      const [k, v] = parts.shift()!.split('=');
      query[k] = v;
    }
    const to = parts.shift();
    if (!to) throw new Error(`_redirects line ${i + 1}: missing target`);
    const st = parts.shift() ?? '301';
    if (parts.length) throw new Error(`_redirects line ${i + 1}: unexpected "${parts.join(' ')}"`);
    const m = st.match(/^(\d{3})(!?)$/);
    if (!m) throw new Error(`_redirects line ${i + 1}: bad status "${st}"`);
    let host: string | undefined;
    const abs = from.match(/^(https?:\/\/[^/]+)(\/.*)$/);
    if (abs) { host = abs[1]; from = abs[2]; }
    rules.push({ line: i + 1, host, from, query, to, status: Number(m[1]), force: m[2] === '!' });
  });
  return rules;
}

const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);
const segs = (p: string) => norm(p).split('/').filter(Boolean);

function matchPath(pattern: string, path: string): Record<string, string> | null {
  const ps = segs(pattern);
  const xs = segs(path);
  const params: Record<string, string> = {};
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    if (p === '*' && i === ps.length - 1) {
      if (xs.length <= i && i > 0) return null; // `/*` alone also matches `/`
      params.splat = xs.slice(i).join('/') + (path.length > 1 && path.endsWith('/') ? '/' : '');
      return params;
    }
    if (i >= xs.length) return null;
    if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(xs[i]);
    else if (p !== xs[i]) return null;
  }
  return xs.length === ps.length ? params : null;
}

/** true when Netlify would serve a file for this path (exact file, dir index or pretty .html) */
export function fileExists(dist: string, path: string): boolean {
  const p = decodeURIComponent(path.split('?')[0]);
  if (p === '/') return existsSync(join(dist, 'index.html'));
  const f = join(dist, p);
  if (existsSync(f) && statSync(f).isFile()) return true;
  if (existsSync(join(f, 'index.html'))) return true;
  return existsSync(join(dist, `${norm(p)}.html`));
}

export function resolve(rules: Rule[], url: string, dist: string, host?: string): Hit | null {
  const u = new URL(url, 'https://liar-entertainer.com');
  const path = u.pathname;
  const exists = fileExists(dist, path);
  for (const rule of rules) {
    if (rule.host && rule.host !== host) continue;
    if (!rule.host && host && !host.endsWith('//liar-entertainer.com')) continue;
    const keys = Object.keys(rule.query);
    if (keys.some((k) => !u.searchParams.has(k))) continue;
    const params = matchPath(rule.from, path);
    if (!params) continue;
    if (!rule.force && exists) continue;
    for (const k of keys) {
      const v = rule.query[k];
      if (v.startsWith(':')) params[v.slice(1)] = u.searchParams.get(k)!;
    }
    let to = rule.to.replace(/:([a-z]+)/gi, (all, name) => (name in params ? params[name] : all));
    to = to.replace(/(?<!:)\/{2,}/g, '/');
    if (!keys.length && u.search && rule.status < 400) to += u.search;
    return { rule, to, status: rule.status };
  }
  return null;
}
