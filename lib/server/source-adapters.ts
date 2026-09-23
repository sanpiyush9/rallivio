export type DiscoverySourceId =
  | "youtube"
  | "instagram"
  | "x"
  | "news"
  | "reddit"
  | "search"
  | "markets"
  | "rss"
  | "web"
  | (string & {});

export type DiscoverySourceKind =
  | "social"
  | "video"
  | "news"
  | "market"
  | "search"
  | "web"
  | "feed";

export type DiscoverySourceMetrics = {
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  reactions?: number | null;
  followers?: number | null;
  engagementRate?: number | null;
  raw: Record<string, unknown>;
};

export type DiscoverySourceItem = {
  source: DiscoverySourceId;
  sourceKind: DiscoverySourceKind;
  externalId: string;
  title: string;
  description: string;
  creatorId: string | null;
  creatorName: string | null;
  publishedAt: string | null;
  observedAt: string;
  url: string;
  thumbnailUrl: string | null;
  topic: string | null;
  region: string | null;
  language: string | null;
  entityKeys: string[];
  metrics: DiscoverySourceMetrics;
  raw: Record<string, unknown>;
};

export type DiscoverySourceAdapter = {
  id: DiscoverySourceId;
  kind: DiscoverySourceKind;
  discover(input: {
    query?: string;
    region?: string;
    limit?: number;
  }): Promise<DiscoverySourceItem[]>;
};

/**
 * Source boundary for World Intelligence.
 *
 * Source adapters are sensors, not ranking engines. Every adapter must emit
 * the same normalized shape so the intelligence layer can correlate signals
 * across YouTube, social networks, news, markets, feeds, and future sources.
 *
 * RSS is intentionally metadata-only and must only be used with feeds that
 * permit automated use. Source availability/permissions are handled by the
 * adapter; the intelligence layer never bypasses source controls.
 */
export function normalizeSourceItem(item: DiscoverySourceItem) {
  return {
    source: item.source,
    source_kind: item.sourceKind,
    external_id: item.externalId,
    title: item.title,
    description: item.description,
    creator_id: item.creatorId,
    creator_name: item.creatorName,
    published_at: item.publishedAt,
    observed_at: item.observedAt,
    url: item.url,
    thumbnail_url: item.thumbnailUrl,
    topic: item.topic,
    region: item.region,
    language: item.language,
    entity_keys: item.entityKeys,
    metrics: item.metrics,
    raw: item.raw,
  };
}
