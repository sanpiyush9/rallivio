"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DiscoverNavigationBridge() {
  const router = useRouter();
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest<HTMLElement>(".rv .signalCard, .rv .discoverySurface .card");
      if (!card) return;
      const title = card.querySelector("strong, h3")?.textContent?.trim();
      if (!title) return;
      event.preventDefault();
      event.stopPropagation();
      router.push(`/creators?platform=youtube&q=${encodeURIComponent(title)}`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);
  return null;
}
