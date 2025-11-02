import urlcat from 'urlcat';
import { toCategoryUrlSlug } from './files-categories';
import { toHrefExtParam } from './filetypes-slug';

// Centralized URL builders. Ensures proper encoding and avoids double slashes.

export function hrefHome(): string {
  return '/';
}

export function hrefFiletype(slug: string): string {
  const s = toHrefExtParam(slug);
  return urlcat('/filetypes/:slug', { slug: s });
}

export function hrefCategoryInternal(internalSlug: string): string {
  const slug = toCategoryUrlSlug(String(internalSlug || ''));
  return urlcat('/categories/:slug', { slug });
}

export function hrefMimeType(type: string): string {
  return urlcat('/mimetypes/:type', { type: String(type || '') });
}

export function hrefMimeSubtype(type: string, subtype: string): string {
  return urlcat('/mimetypes/:type/:subtype', {
    type: String(type || ''),
    subtype: String(subtype || ''),
  });
}

export function hrefTool(route: string): string {
  // Route may start with '/' or be a bare segment.
  const clean = String(route || '').replace(/^\/+/, '');
  return urlcat('/tools/:route', { route: clean });
}

export function joinWithQuery(path: string, query?: Record<string, any>): string {
  // urlcat encodes query keys/values correctly.
  return urlcat(path || '/', {}, query || {});
}

export function hrefMimeRoot(): string {
  return '/mimetypes/';
}

export function hrefCodecsRoot(): string {
  return '/codecs/';
}

export function hrefCodec(id: string): string {
  return urlcat('/codecs/:id', { id: String(id || '') });
}
