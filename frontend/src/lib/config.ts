export function getStrapiUrl(): string {
  return process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project"),
  );
}

export function isStrapiConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_STRAPI_URL;
  if (url?.includes("your-strapi")) return false;
  if (url) return true;
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false" &&
    !isSupabaseConfigured()
  );
}

export function shouldUseMockData(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") return true;
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") return false;
  if (isStrapiConfigured()) return false;
  if (isSupabaseConfigured()) return false;
  return true;
}

export function shouldUseStrapi(): boolean {
  return !shouldUseMockData() && isStrapiConfigured();
}
