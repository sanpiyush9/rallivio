const DEFAULT_SUPABASE_URL = "https://dzcnmatbszerparrcgem.supabase.co";
const DEFAULT_PUBLIC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Y25tYXRic3plcnBhcnJjZ2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTE0ODgsImV4cCI6MjEwNDYyNzQ4OH0.aOWP8DwteA5uYlOV3-w3-BX-gJ8VNbrD6p5qY_2sY18";

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, "");
}

function publicKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_PUBLIC_KEY;
}

function serviceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return key;
}

export async function supabasePublic<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl()}/rest/v1/${path}`, {
    headers: { apikey: publicKey(), Authorization: `Bearer ${publicKey()}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status} ${await response.text()}`);
  return response.json() as Promise<T>;
}

export async function supabaseService<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = serviceKey();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${baseUrl()}/rest/v1/${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase write failed: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function supabaseUrl() {
  return baseUrl();
}
