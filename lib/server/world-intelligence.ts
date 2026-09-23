import type { DiscoverySourceId, DiscoverySourceItem } from "./source-adapters";

export type TrendObservation = {
  source: DiscoverySourceId;
  entityKey: string;
  observedAt: string;
  value: number;
  region?: string | null;
};

export type TrendEvidence = {
  sourceCount: number;
  regionCount: number;
  observationCount: number;
  velocity: number;
  acceleration: number;
  persistence: number;
  novelty: number;
};

export type TrendScore = {
  score: number;
  state: "emerging" | "accelerating" | "viral" | "persistent";
  evidence: TrendEvidence;
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function percentageChange(previous: number, current: number) {
  const baseline = Math.max(Math.abs(previous), 1);
  return ((current - previous) / baseline) * 100;
}

export function accelerationFromSeries(values: number[]) {
  if (values.length < 3) return 0;
  const changes: number[] = [];
  for (let index = 1; index < values.length; index += 1) changes.push(percentageChange(values[index - 1], values[index]));
  const previous = changes[changes.length - 2] ?? 0;
  const current = changes[changes.length - 1] ?? 0;
  return clamp(current - previous);
}

export function scoreTrend(observations: TrendObservation[]): TrendScore {
  if (!observations.length) return { score: 0, state: "emerging", evidence: { sourceCount: 0, regionCount: 0, observationCount: 0, velocity: 0, acceleration: 0, persistence: 0, novelty: 0 } };
  const ordered = [...observations].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  const values = ordered.map((observation) => Math.max(observation.value, 0));
  const latest = values.at(-1) ?? 0;
  const previous = values.at(-2) ?? latest;
  const velocity = clamp(percentageChange(previous, latest));
  const acceleration = accelerationFromSeries(values);
  const sourceCount = new Set(ordered.map((observation) => observation.source)).size;
  const regions = new Set(ordered.map((observation) => observation.region).filter((region): region is string => Boolean(region)));
  const persistence = clamp(Math.min(100, ordered.length * 12.5));
  const novelty = ordered.length <= 2 ? 100 : clamp(100 - ordered.length * 4);
  const diversity = clamp(sourceCount * 20);
  const geographicSpread = clamp(regions.size * 12.5);
  const score = Math.round(clamp(velocity * 0.35 + acceleration * 0.25 + diversity * 0.15 + geographicSpread * 0.1 + persistence * 0.1 + novelty * 0.05));
  let state: TrendScore["state"] = "emerging";
  if (score >= 80 && sourceCount >= 3) state = "viral";
  else if (acceleration >= 45 || score >= 60) state = "accelerating";
  else if (persistence >= 50) state = "persistent";
  return { score, state, evidence: { sourceCount, regionCount: regions.size, observationCount: ordered.length, velocity: Math.round(velocity), acceleration: Math.round(acceleration), persistence: Math.round(persistence), novelty: Math.round(novelty) } };
}

export function groupTrendObservations(observations: TrendObservation[]) {
  const groups = new Map<string, TrendObservation[]>();
  for (const observation of observations) groups.set(observation.entityKey, [...(groups.get(observation.entityKey) ?? []), observation]);
  return groups;
}

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
const tokens = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((x) => x.length >= 4 && !STOP.has(x)).slice(0, 10);
const keyFor = (item: DiscoverySourceItem) => { const keys = item.entityKeys?.filter(Boolean).slice(0, 4); if (keys?.length) return keys.sort().join("|"); return tokens(item.title).slice(0, 4).sort().join("|") || item.externalId; };
const num = (value: unknown) => { const n = Number(value); return Number.isFinite(n) ? n : 0; };
const attention = (item: DiscoverySourceItem) => { const m = item.metrics; const raw = Object.values(m.raw ?? {}).map(num).filter((x) => x > 0); const base = Math.max(num(m.views), num(m.likes) * 40, num(m.comments) * 80, num(m.shares) * 100, num(m.reactions) * 60, ...raw, 1); return Math.min(1, Math.log10(base + 1) / 8); };
const freshness = (item: DiscoverySourceItem) => Math.max(0, Math.min(1, 1 - Math.max(0, (Date.now() - Date.parse(item.observedAt)) / 36e5) / 168));
const stableId = (value: string) => { let hash = 2166136261; for (let i = 0; i < value.length; i += 1) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619); return `world-${(hash >>> 0).toString(36)}`; };

function eventScore(items: DiscoverySourceItem[]) {
  const attentionScore = items.reduce((sum, item) => sum + attention(item), 0) / Math.max(items.length, 1);
  const fresh = items.reduce((sum, item) => sum + freshness(item), 0) / Math.max(items.length, 1);
  const sourceCount = new Set(items.map((x) => x.source)).size;
  return Math.round((attentionScore * 0.45 + fresh * 0.35 + Math.min(1, sourceCount / 4) * 0.2) * 1000) / 10;
}

function stage(score: number, sourceCount: number): WorldEvent["stage"] {
  if (sourceCount >= 3 || score >= 82) return "Breaking Out";
  if (score >= 65) return "Now Moving";
  if (score >= 42) return "On the Rise";
  return "Under Radar";
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

export function toDiscoveryItem(item: DiscoverySourceItem): DiscoverySourceItem { return { ...item, entityKeys: item.entityKeys?.length ? item.entityKeys : tokens(item.title) }; }

export function buildWorldEvents(input: DiscoverySourceItem[], limit = 12): WorldEvent[] {
  const groups = new Map<string, DiscoverySourceItem[]>();
  for (const raw of input) { const item = toDiscoveryItem(raw); const key = keyFor(item); groups.set(key, [...(groups.get(key) ?? []), item]); }
  return [...groups.entries()].map(([key, rawItems]) => {
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
    return { id: stableId(key), title: items[0]?.title ?? "Emerging world event", topic, region, stage: stage(score, sourceCount), score, signalCount: items.length, sourceCount, sources, formats, latestObservedAt: latest, firstObservedAt: first, why: whyFor(items, sourceCount), dna: { attention: Math.round(a * 100), freshness: Math.round(f * 100), crossSource: Math.round(c * 100), momentum: Math.round(score) }, items: items.slice(0, 8) } satisfies WorldEvent;
  }).sort((a, b) => b.score - a.score || Date.parse(b.latestObservedAt) - Date.parse(a.latestObservedAt)).slice(0, limit);
}
