export function decodeEmoji(str: string | undefined | null): string {
  if (!str) return '';
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
}
