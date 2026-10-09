/**
 * Moves the language sign (rendered once at the end of <main> by V2Layout, between <!--ls--> and
 * <!--/ls-->) between two sections: into the 3rd top-level section of <main> (2nd on short pages),
 * right after its gold star / suit divider when it opens with one, otherwise at its very start.
 * So the sign fills a gap instead of the hero, and `section + section` seam rules stay intact.
 * String surgery on purpose: German pages must not go through an HTML parser round-trip.
 */
const START = '<!--ls-->';
const END = '<!--/ls-->';

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

export function placeSign(html: string): string {
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a < 0 || b < a) return html;
  const sign = html.slice(a + START.length, b);
  const rest = html.slice(0, a) + html.slice(b + END.length);

  const mainOpen = rest.search(/<main\b/);
  const mainClose = rest.indexOf('</main>');
  if (mainOpen < 0 || mainClose < 0) return rest;
  const sections = topSections(rest, mainOpen, mainClose);
  const target = sections[2] ?? sections[1];
  if (target === undefined) return rest.slice(0, mainClose) + sign + rest.slice(mainClose);

  const openEnd = rest.indexOf('>', target) + 1;
  let at = openEnd;
  // after a divider near the top of the section (seams test: the star stays at the top)
  const head = rest.slice(openEnd, openEnd + 1200);
  const d = head.search(/<div class="(gd|sr)"/);
  if (d >= 0) {
    const close = rest.indexOf('</div>', openEnd + d) + '</div>'.length;
    if (close > openEnd) at = close;
  } else {
    // inside the first container, so the sign is centred with the content
    const c = head.match(/^\s*<div class="[^"]*\bcontainer\b[^"]*"[^>]*>/);
    if (c) at = openEnd + c[0].length;
  }
  return rest.slice(0, at) + sign + rest.slice(at);
}
