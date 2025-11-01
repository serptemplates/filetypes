import { describe, it, expect } from 'vitest';
import { FileTypeSchema } from '../schemas/filetype';

describe('FileTypeSchema', () => {
  it('accepts a valid minimal record', () => {
    const rec = {
      slug: 'mp4',
      extension: 'mp4',
      name: 'MPEG-4 Video',
      summary: 'MP4 container for video and audio.',
      developer: 'MPEG',
      category: 'Video',
      category_slug: 'video',
      mime: ['video/mp4'],
      technical_info: { content: ['Container based on ISO BMFF.'] },
      how_to_open: { instructions: ['Open with VLC or any modern player.'] },
      programs: {
        windows: [{ name: 'VLC', url: 'https://www.videolan.org/vlc/' }],
      },
      images: [
        { url: 'https://example.com/shot.png', alt: 'Screenshot' },
      ],
      sources: [
        { source: 'fileformat.com', url: 'https://docs.fileformat.com/video/mp4/', retrieved_at: new Date().toISOString() },
      ],
      last_updated: new Date().toISOString(),
    };
    const parsed = FileTypeSchema.parse(rec);
    expect(parsed.slug).toBe('mp4');
  });

  it('rejects bad images/sources urls and empty technical/how_to', () => {
    const bad = {
      slug: 'heic',
      extension: 'heic',
      name: 'HEIC Image',
      technical_info: { content: [] }, // invalid (min(1))
      how_to_open: { instructions: [] }, // invalid (min(1))
      images: [{ url: 'ftp://bad/url' }], // invalid
      sources: [{ url: 'notaurl' }], // invalid
    } as any;
    expect(() => FileTypeSchema.parse(bad)).toThrow();
  });
});

