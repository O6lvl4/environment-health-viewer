/**
 * 絵文字を Twemoji の SVG <img> に変換するヘルパー。
 * 外部CDN: jdecked/twemoji@15.1.0 (旧 Twitter Twemoji の保守fork)
 */
const TWEMOJI_BASE = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg";

const toCodepointSlug = (emoji: string): string => {
  const codes = [...emoji].map((c) => c.codePointAt(0)!);
  return codes
    .filter((cp, i) => cp !== 0xfe0f || codes[i - 1] === 0x200d)
    .map((cp) => cp.toString(16))
    .join("-");
};

export const twemojiImg = (emoji: string, classes = ""): string => {
  const slug = toCodepointSlug(emoji);
  const alt = emoji
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
  const cls = `inline-block w-[1em] h-[1em] align-[-0.125em] ${classes}`.trim();
  return `<img src="${TWEMOJI_BASE}/${slug}.svg" alt="${alt}" draggable="false" class="${cls}" />`;
};
