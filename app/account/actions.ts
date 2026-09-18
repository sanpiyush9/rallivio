"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
  const profileKind = String(formData.get("profile_kind") ?? "creator") === "brand" ? "brand" : "creator";
  const primaryCategory = String(formData.get("primary_category") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const { error } = await supabase.from("profiles").upsert({
    id:user.id, display_name:displayName||null, username:username||null, bio:bio||null,
    avatar_url:avatarUrl||null, website_url:websiteUrl||null, location:location||null,
    primary_category:primaryCategory||null, profile_kind:profileKind, updated_at:new Date().toISOString(),
    profile_completed_at:displayName && primaryCategory ? new Date().toISOString() : null
  });
  if (error) redirect("/account?error=" + encodeURIComponent(error.message));
  redirect("/account?saved=1");
}
