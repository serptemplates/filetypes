import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['app', 'components', 'lib', path.join('packages', 'ui', 'src'), path.join('packages', 'app-core', 'src')];
const EXTS = new Set(['.tsx', '.ts', '.jsx', '.js']);
const IGNORE_DIRS = new Set(['node_modules', '.next', 'dist', 'out']);

function listFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full));
    else if (EXTS.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

function collectUrlErrors(file: string, content: string): string[] {
  const errs: string[] = [];

  // 1) Obvious double slashes in internal paths (exclude http:// https:// data: mailto: tel:)
  // Look at string literals in href attributes first
  const hrefLiteralRe = /href\s*=\s*(["'])(.*?)\1/g;
  let m: RegExpExecArray | null;
  while ((m = hrefLiteralRe.exec(content))) {
    const val = m[2];
    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:') || val.startsWith('mailto:') || val.startsWith('tel:')) continue;
    if (val.startsWith('//')) {
      errs.push(`${file}: protocol-relative href not allowed: ${val}`);
    }
    if (val.startsWith('/') && val.includes('//')) {
      errs.push(`${file}: double slash in href: ${val}`);
    }
    // discourage hardcoded route families; prefer helpers
    if (val.startsWith('/filetypes') || val.startsWith('/mimetypes') || val.startsWith('/tools') || val.startsWith('/categories')) {
      // Allow root '/mimetypes/' and root '/'
      if (val !== '/mimetypes/' && val !== '/') {
        errs.push(`${file}: hardcoded href '${val}'. Use lib/url.ts helpers`);
      }
    }
  }

  // 2) Template strings that assemble critical paths without helper or encoding
  const hrefTplRe = /href\s*=\s*\{\s*`([^`]+)`\s*\}/g;
  while ((m = hrefTplRe.exec(content))) {
    const tpl = m[1];
    if (tpl.includes('/tools/${')) errs.push(`${file}: template builds /tools path; use hrefTool()`);
    if (tpl.includes('/filetypes/${')) errs.push(`${file}: template builds /filetypes path; use hrefFiletype()`);
    if (tpl.includes('/categories/${')) errs.push(`${file}: template builds /categories path; use buildCategoryHref()`);
    if (tpl.includes('/mimetypes/${')) errs.push(`${file}: template builds /mimetypes path; use hrefMimeType()/hrefMimeSubtype()`);
    // double slash in template body
    if (tpl.includes('//') && !tpl.includes('://')) errs.push(`${file}: template contains double slash: ${tpl}`);
  }

  // 3) Concatenation patterns for core routes inside href
  const hrefConcatRe = /href\s*=\s*\{[^}]*(['"])\/(filetypes|mimetypes|tools|categories)\/[^}]*\+[^}]*\}/g;
  if (hrefConcatRe.test(content)) {
    errs.push(`${file}: href builds path via concatenation; use lib/url.ts helpers`);
  }

  // 4) Raw '/tools//' anywhere in file is almost certainly wrong
  if (/['"`]\/tools\/\//.test(content)) {
    errs.push(`${file}: found '/tools//' in source`);
  }

  // 5) Global template usage for core routes (not only in href)
  const globalTplRe = /`\/(filetypes|mimetypes|tools|categories)\/[^`]*\$\{/g;
  if (globalTplRe.test(content)) {
    errs.push(`${file}: template builds core route outside href; use helpers in lib/url.ts`);
  }

  // 6) String concatenation for core routes (anywhere)
  const globalConcatRe = /(['"])\/(filetypes|mimetypes|tools|categories)\/[^'"`]*\1\s*\+|\+\s*(['"])\/(filetypes|mimetypes|tools|categories)\/[^'"`]*/g;
  if (globalConcatRe.test(content)) {
    errs.push(`${file}: concatenation builds core route; use helpers in lib/url.ts`);
  }

  // 7) Router push/replace with hardcoded core routes
  const routerRe = /router\.(push|replace)\(\s*(["'])\/(filetypes|mimetypes|tools|categories)\//g;
  if (routerRe.test(content)) {
    errs.push(`${file}: router.push/replace uses hardcoded core route; use helpers`);
  }

  // 8) new URL('/core/...')
  const newUrlRe = /new\s+URL\(\s*(["'])\/(filetypes|mimetypes|tools|categories)\//g;
  if (newUrlRe.test(content)) {
    errs.push(`${file}: new URL() with hardcoded core route; ensure helpers/encoding`);
  }

  // 9) encodeURIComponent in path assembly (signal for manual build)
  const encPathRe = /(encodeURIComponent\()([^)]*\/(filetypes|mimetypes|tools|categories)\/)/g;
  if (encPathRe.test(content)) {
    errs.push(`${file}: encodeURIComponent used in path assembly; prefer lib/url.ts helpers`);
  }

  return errs;
}

describe('URL hygiene (project-wide)', () => {
  it('contains no obvious URL construction errors', async () => {
    const files = SCAN_DIRS.flatMap((d) => listFiles(path.join(ROOT, d)));
    const errors: string[] = [];
    for (const f of files) {
      const rel = path.relative(ROOT, f);
      // Allow helper implementations themselves
      if (rel === 'lib/url.ts' || rel === 'lib/files-categories.ts' || rel === path.join('packages','app-core','src','lib','url.ts')) continue;
      const src = fs.readFileSync(f, 'utf8');
      errors.push(...collectUrlErrors(rel, src));
    }
    if (errors.length) {
      // Print all errors for quick fixing
      console.error('\nURL issues found:\n' + errors.map((e) => ` - ${e}`).join('\n'));
    }
    expect(errors).toEqual([]);
  });
});
