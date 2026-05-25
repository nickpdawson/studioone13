/**
 * Single source of truth for the media types George works in.
 * Used by the painting detail page (label + back-link) and the gallery
 * pages. To add a new medium:
 *   1. Add an entry here.
 *   2. Add it to the `z.enum` in src/content/config.ts.
 *   3. Add it to the medium select options in public/admin/config.yml.
 *
 * The Astro enum and the Sveltia options have to be kept in sync —
 * this list doesn't drive those automatically.
 */

export const MEDIUMS = [
  { value: 'oil',          label: 'Oil',          plural: 'Oil paintings',     gallery: '/oils' },
  { value: 'watercolor',   label: 'Watercolor',   plural: 'Watercolors',       gallery: '/watercolors' },
  { value: 'pen-and-ink',  label: 'Pen and ink',  plural: 'Pen and ink',       gallery: '/work' },
  { value: 'pencil',       label: 'Pencil',       plural: 'Pencil drawings',   gallery: '/work' },
  { value: 'charcoal',     label: 'Charcoal',     plural: 'Charcoal drawings', gallery: '/work' },
  { value: 'pastels',      label: 'Pastels',      plural: 'Pastels',           gallery: '/work' },
  { value: 'acrylic',      label: 'Acrylic',      plural: 'Acrylic paintings', gallery: '/work' },
  { value: 'mixed-media',  label: 'Mixed media',  plural: 'Mixed media',       gallery: '/work' },
] as const;

export type MediumValue = (typeof MEDIUMS)[number]['value'];

export function mediumInfo(value: string) {
  return MEDIUMS.find((m) => m.value === value);
}

export function mediumLabel(value: string): string {
  return mediumInfo(value)?.label ?? value;
}

export function mediumGallery(value: string): string {
  return mediumInfo(value)?.gallery ?? '/work';
}

export function mediumGalleryLabel(value: string): string {
  return mediumInfo(value)?.plural ?? 'Work';
}
