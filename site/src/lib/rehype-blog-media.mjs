// Rehype plugin: harden Markdown-rendered <img> tags in blog articles.
// Astro does not optimize images referenced by absolute/root-relative URLs in Markdown, so inline
// blog images ship as raw <img> without dimensions (CLS), without lazy loading, and as JPEG only.
// This plugin repairs them at build time via an injected `resolve(src)` seam (sharp in production,
// a fake in tests): it adds loading/decoding, sets intrinsic width/height, and — when an optimized
// sibling exists — wraps the <img> in a <picture> with modern <source>s. Degrades to a plain,
// still-hardened <img> when nothing resolves.

/** Depth-first walk invoking `fn(node, parent, index)` for every node. */
function walk(node, parent, index, fn) {
  fn(node, parent, index);
  const children = node.children;
  if (children) for (let i = 0; i < children.length; i++) walk(children[i], node, i, fn);
}

function sourceNode(type, srcSet) {
  return { type: 'element', tagName: 'source', properties: { type, srcSet }, children: [] };
}

/**
 * @param {{ resolve: (src: string) => ({ width?: number, height?: number, webp?: string, avif?: string } | null | undefined) }} opts
 */
export function rehypeBlogMedia({ resolve }) {
  return (tree) => {
    walk(tree, null, 0, (node, parent, index) => {
      if (node.type !== 'element' || node.tagName !== 'img') return;
      const props = node.properties || (node.properties = {});
      const src = typeof props.src === 'string' ? props.src : '';
      if (!src) return;
      const info = resolve(src);
      if (!info) return;
      if (props.loading == null) props.loading = 'lazy';
      if (props.decoding == null) props.decoding = 'async';
      if (props.width == null && info.width) props.width = info.width;
      if (props.height == null && info.height) props.height = info.height;

      // Wrap in <picture> with modern sources, but only when the img is not already inside one.
      const already = parent && parent.type === 'element' && parent.tagName === 'picture';
      if (already || !parent) return;
      const sources = [];
      if (info.avif) sources.push(sourceNode('image/avif', info.avif));
      if (info.webp) sources.push(sourceNode('image/webp', info.webp));
      if (sources.length === 0) return;
      parent.children[index] = {
        type: 'element',
        tagName: 'picture',
        properties: {},
        children: [...sources, node],
      };
    });
    return tree;
  };
}
