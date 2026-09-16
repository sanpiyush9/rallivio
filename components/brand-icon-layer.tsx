"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { SimpleIcon } from "simple-icons";
import {
  siYoutube,
  siInstagram,
  siTiktok,
  siX,
  siLinkedin,
  siFacebook,
  siReddit,
  siDiscord,
  siSnapchat,
  siPinterest,
  siSpotify,
  siTwitch,
} from "simple-icons";

type BrandDefinition = {
  icon: SimpleIcon;
  disc: string;
  glyph: string;
  gradient?: string;
};

const BRANDS: Record<string, BrandDefinition> = {
  youtube: { icon: siYoutube, disc: "#FF0000", glyph: "#FFFFFF" },
  instagram: {
    icon: siInstagram,
    disc: "#833AB4",
    glyph: "#FFFFFF",
    gradient: "linear-gradient(135deg, #833AB4 0%, #FD1D1D 58%, #FCB045 100%)",
  },
  tiktok: { icon: siTiktok, disc: "#000000", glyph: "#FFFFFF" },
  x: { icon: siX, disc: "#000000", glyph: "#FFFFFF" },
  linkedin: { icon: siLinkedin, disc: "#0A66C2", glyph: "#FFFFFF" },
  facebook: { icon: siFacebook, disc: "#1877F2", glyph: "#FFFFFF" },
  reddit: { icon: siReddit, disc: "#FF4500", glyph: "#FFFFFF" },
  discord: { icon: siDiscord, disc: "#5865F2", glyph: "#FFFFFF" },
  snapchat: { icon: siSnapchat, disc: "#FFFC00", glyph: "#000000" },
  pinterest: { icon: siPinterest, disc: "#E60023", glyph: "#FFFFFF" },
  spotify: { icon: siSpotify, disc: "#1DB954", glyph: "#000000" },
  twitch: { icon: siTwitch, disc: "#9146FF", glyph: "#FFFFFF" },
};

function BrandIcon({ icon, color }: { icon: SimpleIcon; color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={color} aria-hidden="true" focusable="false">
      <path d={icon.path} />
    </svg>
  );
}

function BrandDisc({ kind }: { kind: string }) {
  const brand = BRANDS[kind];
  if (!brand) return null;

  const style = {
    "--brand-disc": brand.disc,
    "--brand-gradient": brand.gradient ?? brand.disc,
  } as CSSProperties;

  return (
    <span className="brandDisc" style={style} data-brand={kind}>
      <BrandIcon icon={brand.icon} color={brand.glyph} />
    </span>
  );
}

export default function BrandIconLayer() {
  const [targets, setTargets] = useState<HTMLElement[]>([]);

  useEffect(() => {
    let frame = 0;
    const collect = () => {
      const next = Array.from(
        document.querySelectorAll<HTMLElement>(".field .platformMark")
      );
      if (next.length === 12) {
        setTargets(next);
        return;
      }
      frame = window.requestAnimationFrame(collect);
    };
    collect();
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      {targets.map((target) => {
        const kind = Array.from(target.classList).find((name) => name !== "platformMark");
        return kind && BRANDS[kind]
          ? createPortal(<BrandDisc kind={kind} />, target, `brand-${kind}`)
          : null;
      })}
    </>
  );
}
