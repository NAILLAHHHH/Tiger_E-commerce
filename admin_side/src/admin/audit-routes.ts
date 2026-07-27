export function auditViewPath(type: string, documentId: string) {
  const params = new URLSearchParams({ type, documentId });
  return `/audit-record?${params.toString()}`;
}

export const EXPORT_ONLY_CONTENT_TYPES = new Set([
  "inventory-movements",
  "price-histories",
]);

export function isExportOnlyContentType(contentType: string) {
  return EXPORT_ONLY_CONTENT_TYPES.has(contentType);
}
