import { describe, it, expect } from 'vitest';
// @ts-ignore - plain JS rehype plugin, no type declarations
import { rehypeBlogMedia } from '../src/lib/rehype-blog-media.mjs';

type Props = Record<string, unknown>;
const img = (properties: Props) => ({ type: 'element', tagName: 'img', properties, children: [] });
const root = (...children: unknown[]) => ({ type: 'root', children });

/** Run the plugin on a tree with an injected dimension/format resolver. */
const run = (tree: any, resolve: (src: string) => any) => {
  rehypeBlogMedia({ resolve })(tree);
  return tree;
};

describe('rehypeBlogMedia', () => {
  it('adds lazy loading and async decoding to a local image', () => {
    const tree = root(img({ src: 'https://liar-entertainer.com/blog-images/post/inline-1.jpg', alt: 'Kinder im Park' }));
    run(tree, () => ({ width: 800, height: 600 }));
    const node: any = tree.children[0];
    expect(node.properties.loading).toBe('lazy');
    expect(node.properties.decoding).toBe('async');
    // untouched content attributes survive
    expect(node.properties.alt).toBe('Kinder im Park');
    expect(node.properties.src).toBe('https://liar-entertainer.com/blog-images/post/inline-1.jpg');
  });

  it('sets intrinsic width and height from the resolver', () => {
    const tree = root(img({ src: '/blog-images/post/inline-2.jpg', alt: 'x' }));
    run(tree, () => ({ width: 1200, height: 800 }));
    const node: any = tree.children[0];
    expect(node.properties.width).toBe(1200);
    expect(node.properties.height).toBe(800);
  });

  it('never overwrites attributes the author already set', () => {
    const tree = root(img({ src: '/blog-images/hero.jpg', alt: 'x', loading: 'eager', width: 640 }));
    run(tree, () => ({ width: 1200, height: 800 }));
    const node: any = tree.children[0];
    expect(node.properties.loading).toBe('eager'); // not clobbered to lazy
    expect(node.properties.width).toBe(640); // author dimension kept
    expect(node.properties.decoding).toBe('async'); // still fills the gap
  });

  it('wraps the image in <picture> with a WebP source when a sibling exists', () => {
    const tree = root(img({ src: '/blog-images/post/inline-1.jpg', alt: 'x' }));
    run(tree, () => ({ width: 800, height: 600, webp: '/blog-images/post/inline-1.webp' }));
    const pic: any = tree.children[0];
    expect(pic.tagName).toBe('picture');
    const source = pic.children.find((c: any) => c.tagName === 'source');
    const inner = pic.children.find((c: any) => c.tagName === 'img');
    expect(source.properties.type).toBe('image/webp');
    expect(source.properties.srcSet ?? source.properties.srcset).toBe('/blog-images/post/inline-1.webp');
    expect(inner.properties.src).toBe('/blog-images/post/inline-1.jpg'); // original stays as fallback
    expect(inner.properties.loading).toBe('lazy'); // inner img still hardened
  });

  it('leaves a plain <img> when no WebP sibling exists', () => {
    const tree = root(img({ src: '/blog-images/post/inline-9.jpg', alt: 'x' }));
    run(tree, () => ({ width: 800, height: 600 }));
    expect((tree.children[0] as any).tagName).toBe('img');
  });

  it('leaves images untouched when the resolver returns null (remote/unmanaged)', () => {
    const tree = root(img({ src: 'https://cdn.example.com/x.jpg', alt: 'x' }));
    run(tree, () => null);
    const node: any = tree.children[0];
    expect(node.tagName).toBe('img');
    expect(node.properties.loading).toBeUndefined();
    expect(node.properties.width).toBeUndefined();
  });

  it('is idempotent: a second pass does not double-wrap', () => {
    const tree = root(img({ src: '/blog-images/post/inline-1.jpg', alt: 'x' }));
    const resolve = () => ({ width: 800, height: 600, webp: '/blog-images/post/inline-1.webp' });
    run(tree, resolve);
    run(tree, resolve);
    const pic: any = tree.children[0];
    expect(pic.tagName).toBe('picture');
    expect(pic.children.filter((c: any) => c.tagName === 'picture').length).toBe(0);
    expect(pic.children.filter((c: any) => c.tagName === 'source').length).toBe(1);
  });
});
