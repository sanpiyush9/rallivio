import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/living";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/login?error=The%20confirmation%20link%20is%20invalid%20or%20expired.",
        url.origin,
      ),
    );
  }

  const { url: supabaseUrl, publishableKey } = getSupabaseConfig();
  const response = NextResponse.redirect(new URL(next, url.origin));
  response.headers.set("Cache-Control", "private, no-store");

  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.headers.get("cookie")
          ? request.headers.get("cookie")!.split(";").map((part) => {
              const index = part.indexOf("=");
              return {
                name: part.slice(0, index).trim(),
                value: decodeURIComponent(part.slice(index + 1).trim()),
              };
            })
          : [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        "/login?error=This%20confirmation%20link%20is%20invalid%20or%20expired.",
        url.origin,
      ),
    );
  }

  return response;
}
