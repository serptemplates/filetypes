import { describe, it, expect } from 'vitest';
import { cleanName, preferName, unionStrings, unionHowTo, mergePrograms } from '../scraper/scripts/lib/merge-helpers.mjs';

describe('merge helpers', () => {
  it('cleans noisy names', () => {
    expect(cleanName('What is MP4?', 'mp4')).toBe('MP4');
    expect(cleanName('ZIP - Archive File Format', 'zip')).toBe('ZIP');
    expect(cleanName('JPEG File Extension', 'jpg')).toBe('JPEG');
  });

  it('prefers fileinfo type_name then fileformat name', () => {
    const recs = [
      { source: 'fileformat.com', name: 'ZIP' },
      { source: 'fileinfo.com', type_name: 'Zipped File' },
    ];
    expect(preferName(recs as any, 'zip')).toBe('Zipped File');
  });

  it('unions string arrays and how-to', () => {
    const arr = unionStrings([
      { mime: ['video/mp4', 'video/mp4'] },
      { mime: ['audio/aac'] },
    ] as any, 'mime');
    expect(arr.sort()).toEqual(['audio/aac', 'video/mp4']);

    const how = unionHowTo([
      { how_to_open: { instructions: ['Use VLC'] } },
      { how_to_open: { instructions: ['Use QuickTime'] } },
    ] as any, 'how_to_open');
    expect(how?.instructions.length).toBe(2);
  });

  it('merges programs deduping by name', () => {
    const programs = mergePrograms([
      { programs: { windows: [{ name: 'VLC', url: 'https://example.com' }] } },
      { programs: { windows: [{ name: 'VLC', url: 'https://example.org' }, { name: 'MPC' }] } },
    ] as any);
    expect(programs?.windows?.length).toBe(2);
  });
});

