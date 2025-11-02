// Friendly display names for MIME types

const OVERRIDES: Record<string, string> = {
  'image/vnd.microsoft.icon': 'Windows Icon (ICO)',
  'image/vnd.ms-dds': 'DirectDraw Surface (DDS)',
  'image/vnd.ms-photo': 'HD Photo / JPEG XR',
  'image/vnd.mozilla.apng': 'Animated PNG (APNG)',
  'image/vnd.net-fpx': 'FlashPix (FPX)',
  'image/vnd.radiance': 'Radiance HDR',
  'image/vnd.mix': 'Microsoft Image eXtension (MIX)',
  'image/vnd.ms-modi': 'Microsoft Document Imaging (MDI)',
  'image/vnd.fujixerox.edmics-rlc': 'Fuji Xerox EDMICS RLC',
  'image/vnd.globalgraphics.pgb': 'Global Graphics Page Buffer (PGB)',
  'image/vnd.pco.b16': 'PCO B16 Image',
};

const VENDOR_LABELS: Record<string, string> = {
  'ms': 'Microsoft',
  'microsoft': 'Microsoft',
  'mozilla': 'Mozilla',
  'fujixerox': 'Fuji Xerox',
  'globalgraphics': 'Global Graphics',
  'radiance': 'Radiance',
  'net': 'Net',
  'pco': 'PCO',
};

function titleCaseToken(t: string): string {
  if (!t) return t;
  if (/^[a-z]{1,3}$/.test(t)) {
    // Likely acronym-ish; prefer upper case
    return t.toUpperCase();
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function displayNameForMime(type: string, subtype: string): string {
  const full = `${type}/${subtype}`;
  if (OVERRIDES[full]) return OVERRIDES[full];

  // Try to derive from vendor tree
  let s = subtype;
  if (s.startsWith('vnd.')) s = s.slice(4);
  // Split on dots and hyphens
  const parts = s.split(/[.-]/g).filter(Boolean);
  if (parts.length === 0) return full;

  const labelParts: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const vendor = VENDOR_LABELS[p.toLowerCase()];
    if (vendor) labelParts.push(vendor);
    else labelParts.push(titleCaseToken(p));
  }

  const label = labelParts.join(' ');
  return label;
}

// Canonicalization for known vendor aliases
export function canonicalizeMime(type: string, subtype: string): { type: string; subtype: string } | null {
  const t = type.toLowerCase();
  const s = subtype.toLowerCase();
  if (t === 'image' && s === 'vnd.mozilla.apng') return { type: 'image', subtype: 'apng' };
  if (t === 'image' && s === 'vnd.ms-photo') return { type: 'image', subtype: 'jxr' };
  // Add more as we confirm
  return null;
}
