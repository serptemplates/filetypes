import urlcat from 'urlcat';

export function hrefHome(): string { return '/'; }
export function hrefMimeRoot(): string { return '/mimetypes/'; }
export function hrefMimeType(type: string): string { return urlcat('/mimetypes/:type', { type }); }
export function hrefFiletype(slug: string): string { return urlcat('/filetypes/:slug', { slug: String(slug || '').replace(/^\./, '') }); }
export function hrefToolsRoot(): string { return '/tools/'; }
export function hrefFiletypesRoot(): string { return '/filestypes/'; }
export function hrefCodecsRoot(): string { return '/codecs/'; }

