/**
 * Generates all FastHabit brand assets from a single SVG design.
 * Run: node scripts/generate-brand-assets.mjs
 *
 * Brand mark: a fasting progress ring (amber arc on a deep-teal ground)
 * wrapped around a crescent moon — calm, disciplined, health-focused.
 * Regenerate whenever the palette or mark changes.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets', 'images');

const TEAL = '#0F766E';
const TEAL_DEEP = '#0B5A54';
const AMBER = '#F59E0B';
const WHITE = '#FFFFFF';

/**
 * The mark itself, drawn in a 1024×1024 viewBox.
 * `mode` controls the ground: 'solid' for the full square icon,
 * 'transparent' for Android adaptive foreground / monochrome / splash.
 */
function markSvg({ mode, mono = false }) {
  const ground =
    mode === 'solid'
      ? `<rect width="1024" height="1024" rx="0" fill="${TEAL}"/>
         <rect width="1024" height="1024" rx="0" fill="url(#vignette)"/>`
      : '';
  const ringTrack = mono
    ? `<circle cx="512" cy="512" r="300" fill="none" stroke="${WHITE}" stroke-opacity="0.35" stroke-width="56"/>`
    : `<circle cx="512" cy="512" r="300" fill="none" stroke="${WHITE}" stroke-opacity="0.28" stroke-width="56"/>`;
  const ringArc = `<circle cx="512" cy="512" r="300" fill="none"
      stroke="${mono ? WHITE : AMBER}" stroke-width="64" stroke-linecap="round"
      stroke-dasharray="1413.7 1884.9" transform="rotate(-115 512 512)"/>`;
  const moon = `
    <mask id="crescent">
      <rect width="1024" height="1024" fill="black"/>
      <circle cx="512" cy="512" r="168" fill="white"/>
      <circle cx="586" cy="452" r="150" fill="black"/>
    </mask>
    <circle cx="512" cy="512" r="168" fill="${mono ? WHITE : WHITE}" mask="url(#crescent)"/>`;
  const accentDot =
    mono
      ? ''
      : `<circle cx="512" cy="150" r="0" fill="none"/>`;

  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="vignette" cx="0.5" cy="0.35" r="0.9">
      <stop offset="0%" stop-color="${TEAL}"/>
      <stop offset="100%" stop-color="${TEAL_DEEP}"/>
    </radialGradient>
  </defs>
  ${ground}
  ${mode === 'solid' ? '<g transform="translate(0, 8)">' : '<g transform="translate(0, 8) scale(0.66) translate(174, 174)">'}
    ${ringTrack}
    ${ringArc}
    ${moon}
    ${accentDot}
  </g>
</svg>`;
}

const targets = [
  { file: 'icon.png', svg: markSvg({ mode: 'solid' }), size: 1024 },
  { file: 'android-icon-foreground.png', svg: markSvg({ mode: 'transparent' }), size: 1024 },
  { file: 'android-icon-monochrome.png', svg: markSvg({ mode: 'transparent', mono: true }), size: 1024 },
  { file: 'splash-icon.png', svg: markSvg({ mode: 'transparent' }), size: 768 },
  { file: 'favicon.png', svg: markSvg({ mode: 'solid' }), size: 48 },
];

await mkdir(outDir, { recursive: true });
for (const t of targets) {
  await sharp(Buffer.from(t.svg)).resize(t.size, t.size).png().toFile(join(outDir, t.file));
  console.log(`✓ ${t.file} (${t.size}×${t.size})`);
}
console.log('Brand assets generated in assets/images');
