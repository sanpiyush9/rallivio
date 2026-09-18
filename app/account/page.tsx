import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout, updateProfile } from "./actions";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const { data: profile } = await supabase.from("profiles").select("display_name,username,bio,avatar_url,website_url,location,primary_category,profile_kind,profile_completed_at").eq("id", user.id).maybeSingle();
  const metadata = user.user_metadata ?? {};
  const displayName = profile?.display_name || metadata.full_name || metadata.name || user.email?.split("@")[0] || "RALLIVIO member";
  const avatarUrl = profile?.avatar_url || metadata.avatar_url || metadata.picture || "";
  const kind = profile?.profile_kind || "creator";

  return <main className="account-page"><section className="account-shell">
    <div className="account-top"><Link href="/living" className="back-link">← Back to Discover</Link><div className="account-actions"><span className="eyebrow">YOUR RALLIVIO PROFILE</span><form action={logout}><button className="logout-button" type="submit">Log out</button></form></div></div>
    <div className="profile-hero">
      {avatarUrl ? <img className="avatar" src={avatarUrl} alt="" /> : <div className="avatar placeholder">{displayName.charAt(0).toUpperCase()}</div>}
      <div><h1>{displayName}</h1><p>{profile?.username ? "@" + profile.username : "Complete your profile to build your RALLIVIO identity."}</p><span className="badge">{kind === "brand" ? "Brand" : "Creator"}</span></div>
    </div>
    <form action={updateProfile} className="profile-form">
      <div className="section-heading"><span>01</span><div><h2>Profile information</h2><p>This is the identity other RALLIVIO members can see.</p></div></div>
      <div className="grid">
        <label>Display name<input name="display_name" defaultValue={profile?.display_name ?? displayName} placeholder="Your name" /></label>
        <label>Username<input name="username" defaultValue={profile?.username ?? ""} placeholder="yourhandle" /></label>
        <label>Profile type<select name="profile_kind" defaultValue={kind}><option value="creator">Creator</option><option value="brand">Brand</option></select></label>
        <label>Primary category<input name="primary_category" defaultValue={profile?.primary_category ?? ""} placeholder="Technology, Travel, Food..." /></label>
        <label>Location<input name="location" defaultValue={profile?.location ?? ""} placeholder="City, Country" /></label>
        <label>Website<input name="website_url" type="url" defaultValue={profile?.website_url ?? ""} placeholder="https://..." /></label>
      </div>
      <label>Bio<textarea name="bio" defaultValue={profile?.bio ?? ""} rows={4} placeholder="Tell RALLIVIO who you are, what you create, or what your brand does." /></label>
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      <div className="form-footer"><span>Changes are saved to your RALLIVIO profile.</span><button type="submit">Save profile</button></div>
      <div className="section-heading second"><span>02</span><div><h2>Account & connections</h2><p>Authentication and social connections will live here.</p></div></div>
      <div className="connection-card"><div><strong>Google</strong><small>Connected for sign-in</small></div><span className="connected">Connected</span></div>
      <div className="connection-card muted"><div><strong>Social platforms</strong><small>YouTube, Instagram, TikTok, X and other integrations will appear here as they are connected.</small></div><span>Coming next</span></div>
      <div className="section-heading second"><span>03</span><div><h2>RALLIVIO activity</h2><p>These areas will grow with your account.</p></div></div>
      <div className="activity-grid"><div><strong>Saved creators</strong><span>0</span></div><div><strong>Saved content</strong><span>0</span></div><div><strong>Opportunities</strong><span>0</span></div><div><strong>Profile status</strong><span>{profile?.profile_completed_at ? "Complete" : "In progress"}</span></div></div>
    </form>
  </section>
  <style>{\`
    .account-page{min-height:100vh;padding:110px 24px 80px;background:radial-gradient(circle at 50% 4%,#8d4dff30,transparent 30%),#060817;color:#fff}.account-shell{width:min(920px,100%);margin:auto}.account-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.account-actions{display:flex;align-items:center;gap:12px}.back-link{color:#aaa9bf;text-decoration:none;font-size:12px}.eyebrow{font-size:9px;letter-spacing:1.8px;color:#a96cff;font-weight:800}.logout-button{border:1px solid #ffffff22;border-radius:999px;background:#ffffff08;color:#fff;padding:8px 13px;font-size:11px;font-weight:800;cursor:pointer}.logout-button:hover{background:#ffffff14;border-color:#a96cff66}.profile-hero{display:flex;gap:18px;align-items:center;padding:28px;border:1px solid #ffffff14;border-radius:22px;background:#0b0e1e;margin-bottom:16px}.avatar{width:76px;height:76px;border-radius:50%;object-fit:cover;border:2px solid #a96cff}.avatar.placeholder{display:grid;place-items:center;background:#8d4dff;font-size:30px;font-weight:900}.profile-hero h1{margin:0;font-size:30px}.profile-hero p{margin:5px 0 9px;color:#9290a5;font-size:12px}.badge,.connected{display:inline-flex;padding:5px 9px;border-radius:999px;background:#8d4dff20;color:#c59cff;font-size:10px;font-weight:800}.profile-form{padding:30px;border:1px solid #ffffff14;border-radius:22px;background:#0b0e1e}.section-heading{display:flex;gap:13px;align-items:flex-start;margin-bottom:18px}.section-heading>span{color:#a96cff;font-size:10px;font-weight:900}.section-heading h2{margin:0;font-size:18px}.section-heading p{margin:4px 0 0;color:#77758b;font-size:11px}.section-heading.second{margin-top:36px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}label{display:grid;gap:7px;color:#b7b4c7;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.5px}input,textarea,select{width:100%;box-sizing:border-box;border:1px solid #ffffff14;border-radius:11px;background:#080a16;color:#fff;padding:12px;font:inherit;font-size:12px;text-transform:none;letter-spacing:0;outline:none}input:focus,textarea:focus,select:focus{border-color:#8d4dff}textarea{resize:vertical}.form-footer{display:flex;justify-content:space-between;align-items:center;margin-top:16px;gap:12px;color:#77758b;font-size:10px}.form-footer button{border:0;border-radius:999px;background:#8d4dff;color:#fff;padding:11px 18px;font-weight:800;cursor:pointer}.connection-card{display:flex;justify-content:space-between;align-items:center;padding:15px 16px;border:1px solid #ffffff12;border-radius:13px;background:#080a16;margin-bottom:10px}.connection-card div{display:grid;gap:4px}.connection-card strong{font-size:12px}.connection-card small{color:#77758b;font-size:10px}.connection-card.muted{opacity:.7}.connection-card.muted>span{font-size:9px;color:#77758b}.activity-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.activity-grid div{padding:15px;border:1px solid #ffffff12;border-radius:13px;background:#080a16;display:grid;gap:8px}.activity-grid strong{font-size:10px;color:#9996aa}.activity-grid span{font-size:18px;font-weight:850}.connected{color:#8ee5bd;background:#65d9a015}@media(max-width:700px){.grid,.activity-grid{grid-template-columns:1fr}.account-top{align-items:flex-start;gap:12px;flex-direction:column}.account-actions{width:100%;justify-content:space-between}.profile-form{padding:20px}.form-footer{align-items:flex-start;flex-direction:column}}
  \`}</style></main>;
}
