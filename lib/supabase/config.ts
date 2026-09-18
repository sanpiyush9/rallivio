const SUPABASE_URL = "https://dzcnmatbszerparrcgem.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fux7NAwp5DEAdYgxehDVmA_jxV7WzxL";

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY,
  };
}
