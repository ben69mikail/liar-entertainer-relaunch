import { describe, it, expect } from 'vitest';
import { page } from './helpers';

describe('built start page', () => {
  const $ = page('/');

  it('declares German and the neutral umbrella zone', () => {
    expect($('html').attr('lang')).toBe('de');
    expect($('html').attr('data-zone')).toBe('neutral');
  });

  it('has a self-referencing canonical on the apex host', () => {
    expect($('link[rel=canonical]').attr('href')).toBe('https://liar-entertainer.com/');
  });
});
