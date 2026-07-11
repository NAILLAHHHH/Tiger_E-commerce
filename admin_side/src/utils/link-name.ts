/** Build a URL-safe link_name from a display name. */
export function slugifyLinkName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Ensure hidden link_name is set when staff only fills in the name. */
export function ensureLinkName(data?: Record<string, unknown>) {
  if (!data) return;

  const existing = data.link_name;
  if (existing != null && String(existing).trim()) return;

  const name = data.name;
  if (typeof name === 'string' && name.trim()) {
    data.link_name = slugifyLinkName(name);
  }
}
