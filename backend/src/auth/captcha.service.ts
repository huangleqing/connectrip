import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CAPTCHA_LENGTH = 4;
const CAPTCHA_TTL_MS = 2 * 60 * 1000;
const MAX_CAPTCHA_ENTRIES = 10_000;

interface CaptchaEntry {
  code: string;
  expiresAt: number;
}

export interface CaptchaResponse {
  captchaId: string;
  image: string;
  expiresIn: number;
}

@Injectable()
export class CaptchaService {
  private readonly captchas = new Map<string, CaptchaEntry>();

  create(): CaptchaResponse {
    this.cleanup();
    if (this.captchas.size >= MAX_CAPTCHA_ENTRIES) {
      const oldestKey = this.captchas.keys().next().value;
      if (oldestKey) this.captchas.delete(oldestKey);
    }

    const code = Array.from(
      { length: CAPTCHA_LENGTH },
      () => CAPTCHA_CHARS[randomInt(0, CAPTCHA_CHARS.length)],
    ).join('');
    const captchaId = randomUUID();
    this.captchas.set(captchaId, {
      code,
      expiresAt: Date.now() + CAPTCHA_TTL_MS,
    });

    return {
      captchaId,
      image: this.renderImage(code),
      expiresIn: Math.floor(CAPTCHA_TTL_MS / 1000),
    };
  }

  verify(captchaId: string, captchaCode: string): void {
    this.cleanup();
    const entry = this.captchas.get(captchaId);

    // 验证码只能使用一次，无论校验是否成功
    if (entry) {
      this.captchas.delete(captchaId);
    }

    if (
      !entry ||
      entry.expiresAt < Date.now() ||
      entry.code.toLowerCase() !== captchaCode.trim().toLowerCase()
    ) {
      throw new BadRequestException('验证码错误或已过期，请刷新验证码');
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.captchas) {
      if (entry.expiresAt < now) {
        this.captchas.delete(key);
      }
    }
  }

  private renderImage(code: string): string {
    const colors = ['#0f2a4a', '#155e75', '#1d4ed8', '#7c3aed', '#b45309'];
    const textElements = code
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
      return `<line x1="${randomInt(0, 20)}" y1="${randomInt(4, 36)}" x2="${randomInt(100, 120)}" y2="${randomInt(4, 36)}" stroke="${color}" stroke-opacity="0.28" stroke-width="1" />`;
    }).join('');

    const dots = Array.from({ length: 12 }, () => {
      const color = colors[randomInt(0, colors.length)];
      return `<circle cx="${randomInt(4, 116)}" cy="${randomInt(4, 36)}" r="${randomInt(1, 2)}" fill="${color}" fill-opacity="0.35" />`;
    }).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><rect width="120" height="40" rx="7" fill="#f3f8ff"/>${lines}${dots}${textElements}</svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
  }
}
