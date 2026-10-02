import testimonials from '../data/testimonials.json';

export type Testimonial = { name: string; rating: number; text: string; when: string };

const AVATAR_COLORS = ['#c2185b', '#7b1fa2', '#1565c0', '#bf360c', '#2e7d32', '#006064', '#c62828', '#3f51b5', '#00695c', '#4e342e'];

export const initialsOf = (name: string) => {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : name.slice(0, 2)).toUpperCase();
};

export const colorFor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/** Real Google reviews rendered server-side (crawlable). No Review schema on purpose. */
export const featuredReviews = (testimonials as Testimonial[]).slice(0, 5);
