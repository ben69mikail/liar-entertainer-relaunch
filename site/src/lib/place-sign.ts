/**
 * Places the language sign (rendered once at the end of <main> by V2Layout, between <!--ls--> and
 * <!--/ls-->) between sections: at the start of the 3rd top-level section of <main>, and on long
 * pages again every 3 sections (6th, 9th …), never in the last one. Every second copy leans right
 * (.ls--r). Inside a section it goes right after the gold star / suit divider when the section
 * opens with one, otherwise into its first container. Short pages: start of the 2nd section.
 * So the sign fills gaps instead of the hero, and `section + section` seam rules stay intact.
 * String surgery on purpose: German pages must not go through an HTML parser round-trip.
 */
const START = '<!--ls-->';
const END = '<!--/ls-->';
const EVERY = 3;

function topSections(html: string, from: number, to: number): number[] {
  const re = /<(\/?)section\b[^>]*>/g;
  re.lastIndex = from;
  const starts: number[] = [];
  let depth = 0;
  for (let m = re.exec(html); m && m.index < to; m = re.exec(html)) {
    if (m[1]) depth--;
    else {
      if (depth === 0) starts.push(m.index);
      depth++;
    }
  }
  return starts;
}

/** where inside the section starting at `start` the sign goes */
function insertionPoint(html: string, start: number): number {
  const openEnd = html.indexOf('>', start) + 1;
  const head = html.slice(openEnd, openEnd + 1200);
  const d = head.search(/<div class="(gd|sr)"/);
  if (d >= 0) {
    const close = html.indexOf('</div>', openEnd + d) + '</div>'.length;
    if (close > openEnd) return close;
  }
  const c = head.match(/^\s*<div class="[^"]*\bcontainer\b[^"]*"[^>]*>/);
  return c ? openEnd + c[0].length : openEnd;
}

export function placeSign(html: string): string {
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a < 0 || b < a) return html;
  const sign = html.slice(a + START.length, b);
  let out = html.slice(0, a) + html.slice(b + END.length);

  const mainOpen = out.search(/<main\b/);
  const mainClose = out.indexOf('</main>');
  if (mainOpen < 0 || mainClose < 0) return out;
  const sections = topSections(out, mainOpen, mainClose);

  const targets: number[] = [];
  for (let i = 2; i < sections.length - 1; i += EVERY) targets.push(sections[i]);
  if (!targets.length && sections.length > 1) targets.push(sections[sections.length >= 3 ? 2 : 1]);
  if (!targets.length) return out.slice(0, mainClose) + sign + out.slice(mainClose);

  // insert back to front so earlier offsets stay valid
  const points = targets.map((t) => insertionPoint(out, t));
  for (let k = points.length - 1; k >= 0; k--) {
    const copy = k % 2 ? sign.replace('class="ls"', 'class="ls ls--r"') : sign;
    out = out.slice(0, points[k]) + copy + out.slice(points[k]);
  }
  return out;
}
