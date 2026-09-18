import * as si from "simple-icons";
import * as fs from "node:fs";

const wanted = [
  ["siYoutube", "YouTube"],
  ["siInstagram", "Instagram"],
  ["siTiktok", "TikTok"],
  ["siX", "X"],
  ["siFacebook", "Facebook"],
  ["siReddit", "Reddit"],
  ["siDiscord", "Discord"],
  ["siSnapchat", "Snapchat"],
  ["siPinterest", "Pinterest"],
  ["siSpotify", "Spotify"],
  ["siTwitch", "Twitch"],
];

const LINKEDIN_PATH = "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2.774 22.225 0z";

const normalize = (value) => value.toLowerCase().replace(/\s/g, "");

const pageSource = fs.readFileSync("app/page.tsx", "utf8");
if (/\bsiLinkedin\b/.test(pageSource)) {
  throw new Error("LinkedIn must use the repository local icon exception; do not import siLinkedin from simple-icons.");
}

for (const [key, expectedTitle] of wanted) {
  const icon = si[key];
  if (!icon) {
    throw new Error(`No icon export: ${key} (expected ${expectedTitle})`);
  }
  if (normalize(icon.title) !== normalize(expectedTitle)) {
    throw new Error(`Icon mismatch: ${key} resolved to \"${icon.title}\"; expected \"${expectedTitle}\"`);
  }
  if (!icon.path || icon.path.length < 20) {
    throw new Error(`Invalid path data: ${key} (${icon.title})`);
  }
  console.log(`${key} OK title=\"${icon.title}\" pathLen=${icon.path.length}`);
}

if (!LINKEDIN_PATH) {
  throw new Error("LinkedIn local exception path is missing");
}
console.log(`LinkedIn local exception OK pathLen=${LINKEDIN_PATH.length}`);
console.log(`Validated ${wanted.length} Simple Icons + LinkedIn local exception.`);
