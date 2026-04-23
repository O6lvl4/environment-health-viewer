/**
 * 絵文字を Twemoji の SVG <img> に変換する。
 * CDN: jsdelivr 経由で jdecked/twemoji（Twitter Twemoji の保守fork）を参照。
 */

const TWEMOJI_BASE = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg";

function toCodepointSlug(emoji: string): string {
  const codes = [...emoji].map((c) => c.codePointAt(0)!);
  // variation selector U+FE0F は単一絵文字のファイル名からは除外（ZWJ直後は残す）。
  return codes
    .filter((cp, i) => cp !== 0xfe0f || codes[i - 1] === 0x200d)
    .map((cp) => cp.toString(16))
    .join("-");
}

export function twemojiImg(emoji: string, classes = ""): string {
  const slug = toCodepointSlug(emoji);
  const alt = emoji.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const cls = `inline-block w-[1em] h-[1em] align-[-0.125em] ${classes}`.trim();
  return `<img src="${TWEMOJI_BASE}/${slug}.svg" alt="${alt}" draggable="false" class="${cls}" />`;
}
