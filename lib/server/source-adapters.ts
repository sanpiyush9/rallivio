export type DiscoverySourceId = "youtube" | "rss";

export type DiscoverySourceItem = {
  source: DiscoverySourceId;
  externalId: string;
  title: string;
  description: string;
  creatorId: string | null;
  creatorName: string | null;
  publishedAt: string | null;
  url: string;
  thumbnailUrl: string | null;
  topic: string | null;
  region: string | null;
  raw: Record<string, unknown>;
};

export type DiscoverySourceAdapter = {
  id: DiscoverySourceId;
  discover(input: {
    query?: string;
    region?: string;
    limit?: number;
  }): Promise<DiscoverySourceItem[]>;
};

/**
 * Source boundary for Phase 6.
 *
 * YouTube is the primary official source and remains implemented in
 * youtube-discovery.ts. This adapter contract prevents source-specific
 * response shapes from leaking into ranking/storage. RSS is intentionally
 * metadata-only and must only be used with feeds that permit automated use.
 */
export function normalizeSourceItem(item: DiscoverySourceItem) {
  return {
    source: item.source,
    external_id: item.externalId,
    title: item.title,
    description: item.description,
    creator_id: item.creatorId,
    creator_name: item.creatorName,
    published_at: item.publishedAt,
    url: item.url,
    thumbnail_url: item.thumbnailUrl,
    topic: item.topic,
    region: item.region,
    raw: item.raw,
  };
}
