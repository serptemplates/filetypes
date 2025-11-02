import type { Pluggable } from 'unified';

type Node = any;

const EXT_TO_FILETYPE = new Set([
  'mp4','webm','mkv','mov','ts','flv','avi','mpg','mpeg',
  'mp3','aac','opus','vorbis','flac','alac','ac3','eac3','dts','amr','pcm',
  'srt','vtt','ass','ssa','sub','idx'
]);

function isLinkableWord(word: string): string | null {
  const w = word.toLowerCase();
  if (EXT_TO_FILETYPE.has(w)) return `/filetypes/${w}/`;
  return null;
}

function buildMimeLink(mime: string): string {
  const [type, subtypeRaw] = mime.split('/');
  const subtype = encodeURIComponent(subtypeRaw);
  return `/mimetypes/${type}/${subtype}/`;
}

function tokenizeText(text: string): Array<{ type: 'text'|'link'; value?: string; url?: string }>{
  const out: Array<{ type: 'text'|'link'; value?: string; url?: string }> = [];
  let i = 0;
  const pushText = (s: string) => { if (s) out.push({ type: 'text', value: s }); };
  // Regex to match MIME types or simple words
  const mimeRe = /(audio|video|application|text)\/[A-Za-z0-9.+-]+/g;
  // We'll scan for MIME matches first by splitting, then process remaining words
  let last = 0; let m: RegExpExecArray | null;
  while ((m = mimeRe.exec(text))) {
    const start = m.index; const end = start + m[0].length;
    pushText(text.slice(last, start));
    out.push({ type: 'link', url: buildMimeLink(m[0]), value: m[0] });
    last = end;
  }
  pushText(text.slice(last));

  // Second pass: turn bare words like 'mp4' into links (skip inside URLs)
  const final: typeof out = [];
  for (const part of out) {
    if (part.type === 'link') { final.push(part); continue; }
    const chunk = part.value || '';
    // Ignore obvious URLs
    if (/https?:\/\//i.test(chunk)) { final.push(part); continue; }
    const pieces = chunk.split(/(\b)/); // keep word boundaries
    for (const p of pieces) {
      if (!p) continue;
      if (p === '\\b') continue;
      const href = isLinkableWord(p);
      if (href) final.push({ type: 'link', url: href, value: p });
      else final.push({ type: 'text', value: p });
    }
  }
  return final;
}

function transform(node: Node, parent?: Node) {
  // Skip links and code
  if (!node) return;
  if (node.type === 'link' || node.type === 'code' || node.type === 'inlineCode') return;
  if (node.type === 'text') {
    const parts = tokenizeText(node.value as string);
    if (parts.length === 1 && parts[0].type === 'text') return; // nothing to change
    // Replace this text node in parent with sequence
    if (!parent || !Array.isArray(parent.children)) return;
    const idx = parent.children.indexOf(node);
    if (idx === -1) return;
    const newNodes = parts.map(p => p.type === 'text' ? { type: 'text', value: p.value } : { type: 'link', url: p.url, children: [{ type: 'text', value: p.value }] });
    parent.children.splice(idx, 1, ...newNodes);
    return;
  }
  if (Array.isArray(node.children)) {
    // Copy array since we may mutate during iteration
    const children = [...node.children];
    for (const child of children) transform(child, node);
  }
}

export default function remarkAutolinkInternal(): Pluggable<any[]> {
  return function attacher() {
    return (tree: Node) => {
      transform(tree, undefined);
    };
  };
}

