import { randomInt, randomUUID } from 'crypto';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TTL_MS = 2 * 60 * 1000;
const captchas = new Map<string, { code: string; expiresAt: number }>();

function renderImage(code: string): string {
  const colors = ['#0f2a4a', '#155e75', '#1d4ed8', '#7c3aed', '#b45309'];
  const texts = code
    .split('')
    .map((character, index) => {
      const x = 17 + index * 26;
      const y = 28 + randomInt(-2, 3);
      const rotate = randomInt(-18, 19);
      const fill = colors[randomInt(0, colors.length)];
      return `<text x="${x}" y="${y}" fill="${fill}" font-size="23" font-weight="700" font-family="monospace" transform="rotate(${rotate} ${x} ${y})">${character}</text>`;
    })
    .join('');

  const lines = Array.from({ length: 3 }, () => {
    const color = colors[randomInt(0, colors.length)];
    return `<line x1="${randomInt(0, 20)}" y1="${randomInt(4, 36)}" x2="${randomInt(100, 120)}" y2="${randomInt(4, 36)}" stroke="${color}" stroke-opacity="0.28" />`;
  }).join('');

  const dots = Array.from({ length: 10 }, () => {
    const color = colors[randomInt(0, colors.length)];
    return `<circle cx="${randomInt(4, 116)}" cy="${randomInt(4, 36)}" r="${randomInt(1, 2)}" fill="${color}" fill-opacity="0.35" />`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><rect width="120" height="40" rx="7" fill="#f3f8ff"/>${lines}${dots}${texts}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

export function createMockCaptcha() {
  const code = Array.from({ length: 4 }, () => CHARS[randomInt(0, CHARS.length)]).join('');
  const captchaId = randomUUID();
  captchas.set(captchaId, { code, expiresAt: Date.now() + TTL_MS });

  return {
    captchaId,
    image: renderImage(code),
    expiresIn: Math.floor(TTL_MS / 1000),
  };
}

export function verifyMockCaptcha(captchaId: string, captchaCode: string): boolean {
  const entry = captchas.get(captchaId);
  if (entry) captchas.delete(captchaId);
  if (!entry || entry.expiresAt < Date.now()) return false;
  return entry.code.toLowerCase() === captchaCode.trim().toLowerCase();
}
