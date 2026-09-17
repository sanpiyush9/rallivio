import * as si from "simple-icons";

const wanted = [
  ["siYoutube", "YouTube"],
  ["siInstagram", "Instagram"],
  ["siTiktok", "TikTok"],
  ["siX", "X"],
  ["siLinkedin", "LinkedIn"],
  ["siFacebook", "Facebook"],
  ["siReddit", "Reddit"],
  ["siDiscord", "Discord"],
  ["siSnapchat", "Snapchat"],
  ["siPinterest", "Pinterest"],
  ["siSpotify", "Spotify"],
  ["siTwitch", "Twitch"],
];

const normalize = (value) => value.toLowerCase().replace(/\s/g, "");

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

console.log(`Validated ${wanted.length} RALLIVIO platform icons.`);
