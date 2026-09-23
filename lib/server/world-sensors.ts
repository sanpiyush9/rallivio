import type {
  DiscoverySourceAdapter,
  DiscoverySourceItem,
} from "./source-adapters";

export type SensorCollectionError = {
  source: string;
  error: string;
};

export type SensorCollectionResult = DiscoverySourceItem | SensorCollectionError;

const now = () => new Date().toISOString();
const limitOf = (value: number | undefined, fallback = 20) =>
  Math.min(Math.max(value ?? fallback, 1), 50);

const entityKeysFromTitle = (title: string) =>
  Array.from(
    new Set(
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 4)
        .slice(0, 8),
    ),
  );

export const wikipediaAdapter: DiscoverySourceAdapter = {
  id: "wikipedia",
  kind: "search",
  async discover({ limit }) {
    const response = await fetch(
      "https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/" +
        "latest.json",
      { next: { revalidate: 900 } },
    );
    if (!response.ok) throw new Error(`Wikipedia HTTP ${response.status}`);
    const payload = (await response.json()) as {
      items?: Array<{
        articles?: Array<{
          article?: string;
          views?: number;
          rank?: number;
        }>;
      }>;
    };
    const articles = payload.items?.[0]?.articles ?? [];
    const observedAt = now();
    return articles
      .filter((item) => item.article && item.article !== "Main_Page")
      .slice(0, limitOf(limit))
      .map((item) => {
        const title = (item.article ?? "").replace(/_/g, " ");
        const encoded = encodeURIComponent(item.article ?? "");
        return {
          source: "wikipedia",
          sourceKind: "search",
          externalId: item.article ?? title,
          title,
          description: "Wikipedia pageview attention signal",
          creatorId: null,
          creatorName: "Wikipedia",
          publishedAt: null,
          observedAt,
          url: `https://en.wikipedia.org/wiki/${encoded}`,
          thumbnailUrl: null,
          topic: "public attention",
          region: "GLOBAL",
          language: "en",
          entityKeys: entityKeysFromTitle(title),
          metrics: {
            views: item.views ?? 0,
            raw: { rank: item.rank ?? null },
          },
          raw: item,
        } satisfies DiscoverySourceItem;
      });
  },
};

export const hackerNewsAdapter: DiscoverySourceAdapter = {
  id: "hackernews",
  kind: "web",
  async discover({ limit }) {
    const idsResponse = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      { next: { revalidate: 300 } },
    );
    if (!idsResponse.ok) throw new Error(`Hacker News HTTP ${idsResponse.status}`);
    const ids = (await idsResponse.json()) as number[];
    const selected = ids.slice(0, limitOf(limit));
    const stories = await Promise.all(
      selected.map(async (id) => {
        const response = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { next: { revalidate: 300 } },
        );
        if (!response.ok) return null;
        return (await response.json()) as {
          id?: number;
          title?: string;
          url?: string;
          text?: string;
          by?: string;
          time?: number;
          score?: number;
          descendants?: number;
        };
      }),
    );
    const observedAt = now();
    return stories.filter(Boolean).map((story) => {
      const item = story!;
      const title = item.title ?? "Untitled Hacker News story";
      return {
        source: "hackernews",
        sourceKind: "web",
        externalId: String(item.id ?? title),
        title,
        description: item.text ?? "Hacker News attention signal",
        creatorId: item.by ?? null,
        creatorName: item.by ?? "Hacker News",
        publishedAt: item.time ? new Date(item.time * 1000).toISOString() : null,
        observedAt,
        url: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
        thumbnailUrl: null,
        topic: "technology",
        region: "GLOBAL",
        language: "en",
        entityKeys: entityKeysFromTitle(title),
        metrics: {
          likes: item.score ?? 0,
          comments: item.descendants ?? 0,
          raw: { score: item.score ?? 0, descendants: item.descendants ?? 0 },
        },
        raw: item,
      } satisfies DiscoverySourceItem;
    });
  },
};

export const openWebAdapters = [wikipediaAdapter, hackerNewsAdapter] as const;

export async function collectOpenWebSignals(limit = 20): Promise<SensorCollectionResult[]> {
  const results = await Promise.allSettled(
    openWebAdapters.map((adapter) => adapter.discover({ limit })),
  );

  const collected: SensorCollectionResult[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      collected.push(...result.value);
      return;
    }

    const reason = result.reason;
    collected.push({
      source: openWebAdapters[index].id,
      error: reason instanceof Error ? reason.message : String(reason),
    });
  });

  return collected;
}
