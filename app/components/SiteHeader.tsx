"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("rallivio-theme") as "dark" | "light" | null;
    const next = saved || "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("rallivio-theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = search.trim();
    if (q) router.push(`/creators?q=${encodeURIComponent(q)}&platform=youtube`);
  };

  const active = (path: string) => path === "/" ? pathname === "/" || pathname === "/living" : pathname?.startsWith(path);

  return <header className="site-header">
    <button className="site-brand" type="button" onClick={() => router.push("/")}><span>RALLIVIO</span><small>Discover. Watch. Grow.</small></button>
    <nav className="site-nav" aria-label="Primary navigation">
      <button className={active("/") ? "active" : ""} type="button" onClick={() => router.push("/living")}>Discover</button>
      <button className={active("/creators") ? "active" : ""} type="button" onClick={() => router.push("/creators")}>Creators</button>
      <button className={active("/opportunities") ? "active" : ""} type="button" onClick={() => router.push("/opportunities")}>Brands &amp; Opportunities</button>
      <button className={active("/community") ? "active" : ""} type="button" onClick={() => router.push("/community")}>Community</button>
      <button className={active("/about") ? "active" : ""} type="button" onClick={() => router.push("/about")}>About</button>
    </nav>
    <form className="site-search" onSubmit={submitSearch}><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" aria-label="Search" /></form>
    <button className="site-tool plans" type="button" onClick={() => router.push("/plans")}>Plans</button>
    <button className="site-tool theme" type="button" onClick={toggleTheme} aria-label="Toggle theme">{theme === "dark" ? "☼" : "◐"}</button>
    <button className="site-login" type="button" onClick={() => router.push("/login")}>Login</button>
    <style jsx>{`.site-header{position:sticky;top:0;z-index:100;min-height:68px;display:flex;align-items:center;gap:18px;padding:10px 28px;border-bottom:1px solid #ffffff18;background:#07091af2;backdrop-filter:blur(18px)}.site-brand{border:0;background:transparent;color:#fff;text-align:left;padding:0;min-width:132px;cursor:pointer}.site-brand span{display:block;font-size:23px;font-weight:950;letter-spacing:-1.5px}.site-brand span::first-letter{color:#a96aff}.site-brand small{display:block;margin-top:4px;color:#aaa9bf;font-size:7px;letter-spacing:1px;text-transform:uppercase}.site-nav{display:flex;align-items:center;gap:2px;flex:1}.site-nav button,.site-tool,.site-login{border:0;background:transparent;color:#d9d7e8;padding:9px 11px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap;cursor:pointer}.site-nav button:hover,.site-nav button.active{background:#8d4dff;color:#fff}.site-search{width:min(210px,18vw);height:38px;display:flex;align-items:center;gap:7px;border:1px solid #ffffff18;border-radius:20px;background:#ffffff08;padding:0 11px}.site-search span{color:#8e8ba4}.site-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-size:12px}.site-search input::placeholder{color:#88869a}.site-tool{padding:9px 10px}.site-tool:hover,.site-login:hover{background:#ffffff10}.site-login{border:1px solid #ffffff22;padding:9px 15px;color:#fff}@media(max-width:1050px){.site-nav button{padding:8px 7px;font-size:11px}.site-search{width:150px}.site-brand{min-width:108px}.site-brand span{font-size:20px}}@media(max-width:760px){.site-header{gap:8px;padding:9px 12px;overflow-x:auto}.site-brand{min-width:100px}.site-nav{flex:none}.site-nav button:nth-child(n+4){display:none}.site-search{width:120px}.plans{display:none}}`}</style>
  </header>;
}
