import {
  siYoutube,
  siInstagram,
  siTiktok,
  siX,
  siLinkedin,
  siSnapchat,
  siPinterest,
  siSpotify,
  siTwitch,
  siFacebook,
  siReddit,
  siDiscord,
} from "simple-icons";
import type { SimpleIcon } from "simple-icons";

export const platformSlugs = [
  "youtube",
  "instagram",
  "tiktok",
  "x",
  "linkedin",
  "snapchat",
  "pinterest",
  "spotify",
  "twitch",
  "facebook",
  "reddit",
  "discord",
] as const;

export type PlatformSlug = typeof platformSlugs[number];

export const platformIcons = {
  youtube: siYoutube,
  instagram: siInstagram,
  tiktok: siTiktok,
  x: siX,
  linkedin: siLinkedin,
  snapchat: siSnapchat,
  pinterest: siPinterest,
  spotify: siSpotify,
  twitch: siTwitch,
  facebook: siFacebook,
  reddit: siReddit,
  discord: siDiscord,
} satisfies Record<PlatformSlug, SimpleIcon>;

if (
  Object.keys(platformIcons).length !== platformSlugs.length ||
  platformSlugs.some((slug) => !platformIcons[slug]?.path)
) {
  throw new Error(
    "RALLIVIO platform icon assertion failed: every configured platform must resolve to a bundled Simple Icons path.",
  );
}
