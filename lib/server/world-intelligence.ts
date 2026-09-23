import type { DiscoverySourceItem } from "./source-adapters";

export type WorldEvent = {
  id: string;
  title: string;
  topic: string;
  region: string;
  stage: "Breaking Out" | "Now Moving" | "On the Rise" | "Under Radar";
  score: number;
  signalCount: number;
  sourceCount: number;
  sources: string[];
  formats: string[];
  latestObservedAt: string;
  firstObservedAt: string;
  why: string[];
  dna: { attention: number; freshness: number; crossSource: number; momentum: number };
  items: DiscoverySourceItem[];
};

const STOP = new Set(["this", "that", "with", "from", "your", "have", "will", "what", "when", "where", "about", "into", "more", "than", "they", "their", "there", "just", "over", "after", "also", "very", "some", "news", "video", "official"]);

function tokens(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((x) => x.length >= 4 && !STOP.has(x)).slice(0, 10);
}

function keyFor(item: DiscoverySourceItem) {
  const keys = item.entityKeys?.filter(Boolean).slice(0, 4);
  if (keys?.length) return keys.sort().join("|");
  return tokens(item.title).slice(0, 4).sort().join("|") || item.externalId;
}

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function attention(item: DiscoverySourceItem) {
  const m = item.metrics;
  const raw = Object.values(m.raw ?? {}).map(num).filter((x) => x > 0);
  const base = Math.max(num(m.views), num(m.likes) * 40, num(m.comments) * 80, num(m.shares) * 100, num(m.reactions) * 60, ...raw, 1);
  return Math.min(1, Math.log10(base + 1) / 8);
}

function freshness(item: DiscoverySourceItem) {
  const ageHours = Math.max(0, (Date.now() - Date.parse(item.observedAt)) / 36e5);
  return Math.max(0, Math.min(1, 1 - ageHours / 168));
}

function eventScore(items: DiscoverySourceItem[]) {
  const attentionScore = items.reduce((sum, item) => sum + attention(item), 0) / Math.max(items.length, 1);
  const fresh = items.reduce((sum, item) => sum + freshness(item), 0) / Math.max(items.length, 1);
  const sourceCount = new Set(items.map((x) => x.source)).size;
  const cross = Math.min(1, sourceCount / 4);
  return Math.round((attentionScore * 0.45 + fresh * 0.35 + cross * 0.2) * 1000) / 10;
}

function stage(score: number, sourceCount: number) {
  if (sourceCount >= 3 || score >= 82) return "Breaking Out" as const;
  if (score >= 65) return "Now Moving" as const;
  if (score >= 42) return "On the Rise" as const;
  return "Under Radar" as const;
}

function whyFor(items: DiscoverySourceItem[], sourceCount: number) {
  const reasons: string[] = [];
  const fresh = items.filter((x) => freshness(x) > 0.7).length;
  if (fresh) reasons.push(`${fresh} fresh observation${fresh === 1 ? "" : "s"} in the active window`);
  if (sourceCount > 1) reasons.push(`confirmed across ${sourceCount} source families`);
  const highAttention = items.filter((x) => attention(x) >= 0.65).length;
  if (highAttention) reasons.push(`${highAttention} observation${highAttention === 1 ? "" : "s"} with strong attention evidence`);
  const regions = new Set(items.map((x) => x.region).filter(Boolean));
  if (regions.size > 1) reasons.push(`appearing across ${regions.size} regions`);
  return reasons.slice(0, 4);
}

export function toDiscoveryItem(item: DiscoverySourceItem): DiscoverySourceItem {
  return { ...item, entityKeys: item.entityKeys?.length ? item.entityKeys : tokens(item.title) };
}

export function buildWorldEvents(input: DiscoverySourceItem[], limit = 12): WorldEvent[] {
  const groups = new Map<string, DiscoverySourceItem[]>();
  for (const raw of input) {
    const item = toDiscoveryItem(raw);
    const key = keyFor(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return [...groups.entries()]
    .map(([key, rawItems]) => {
      const items = rawItems.sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
      const sources = [...new Set(items.map((x) => x.source))];
      const formats = [...new Set(items.map((x) => x.sourceKind))];
      const score = eventScore(items);
      const first = items.at(-1)?.observedAt ?? new Date().toISOString();
      const latest = items[0]?.observedAt ?? first;
      const topic = items.find((x) => x.topic)?.topic ?? "World";
      const region = items.find((x) => x.region)?.region ?? "GLOBAL";
      const sourceCount = sources.length;
      const a = items.reduce((s, x) => s + attention(x), 0) / items.length;
      const f = items.reduce((s, x) => s + freshness(x), 0) / items.length;
      const c = Math.min(1, sourceCount / 4);
      return {
        id: `world-${Buffer.from(key).toString("base64url").slice(0, 24)}`,
        title: items[0]?.title ?? "Emerging world event",
        topic,
        region,
        stage: stage(score, sourceCount),
        score,
        signalCount: items.length,
        sourceCount,
        sources,
        formats,
        latestObservedAt: latest,
        firstObservedAt: first,
        why: whyFor(items, sourceCount),
        dna: { attention: Math.round(a * 100), freshness: Math.round(f * 100), crossSource: Math.round(c * 100), momentum: Math.round(score) },
        items: items.slice(0, 8),
      } satisfies WorldEvent;
    })
    .sort((a, b) => b.score - a.score || Date.parse(b.latestObservedAt) - Date.parse(a.latestObservedAt))
    .slice(0, limit);
}
