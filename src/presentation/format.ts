export const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const pad2 = (n: number): string => String(n).padStart(2, "0");

export const formatHm = (d: Date): string => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

export const formatHms = (d: Date): string =>
  `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

export const formatJmaTime = (d: Date): string =>
  `${d.getMonth() + 1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
