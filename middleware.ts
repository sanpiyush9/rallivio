import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./lib/supabase/config";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await supabase.auth.getClaims();

  if (request.nextUrl.pathname === "/") {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/living";
    return NextResponse.rewrite(rewriteUrl, response);
  }
  return response;
}

export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };
