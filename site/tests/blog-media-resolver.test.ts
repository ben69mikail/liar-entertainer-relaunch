import { describe, it, expect } from 'vitest';
// @ts-ignore - plain JS
import { normalizeSrc, makeResolver } from '../src/lib/blog-media-resolver.mjs';

describe('normalizeSrc', () => {
  it('strips the site origin to a root-relative path', () => {
    expect(normalizeSrc('https://liar-entertainer.com/blog-images/p/inline-1.jpg')).toBe('/blog-images/p/inline-1.jpg');
  });
  it('keeps an already root-relative path', () => {
    expect(normalizeSrc('/blog-images/p/inline-2.jpg')).toBe('/blog-images/p/inline-2.jpg');
  });
  it('returns null for a foreign host (never touch remote images)', () => {
    expect(normalizeSrc('https://cdn.example.com/x.jpg')).toBeNull();
  });
});

describe('makeResolver', () => {
  it('returns the manifest entry for a known local image', () => {
    const resolve = makeResolver({ '/blog-images/p/inline-1.jpg': { width: 800, height: 600, webp: '/blog-images/p/inline-1.webp' } });
    expect(resolve('https://liar-entertainer.com/blog-images/p/inline-1.jpg')).toEqual({ width: 800, height: 600, webp: '/blog-images/p/inline-1.webp' });
  });
  it('returns null for an unknown or remote image', () => {
    const resolve = makeResolver({});
    expect(resolve('/blog-images/missing.jpg')).toBeNull();
    expect(resolve('https://cdn.example.com/x.jpg')).toBeNull();
  });
});
