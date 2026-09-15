export type YouTubeSearchItem = {
  id: { videoId?: string };
  snippet: { channelId: string; channelTitle: string; title: string; description: string; publishedAt: string; thumbnails?: { high?: { url: string }; medium?: { url: string } } };
};

export type YouTubeVideo = {
  id: string;
  snippet?: { channelId: string; channelTitle: string; title: string; description: string; publishedAt: string; categoryId?: string; liveBroadcastContent?: string; thumbnails?: { high?: { url: string }; medium?: { url: string } } };
  contentDetails?: { duration?: string; dimension?: string; definition?: string; caption?: string };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  status?: { embeddable?: boolean };
};

export type YouTubeChannel = {
  id: string;
  snippet?: { title?: string; description?: string; publishedAt?: string; country?: string; thumbnails?: { high?: { url: string } } };
  statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string; hiddenSubscriberCount?: boolean };
};

const API = "https://www.googleapis.com/youtube/v3";

function apiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not configured");
  return key;
}

async function request<T>(resource: string, params: Record<string, string | number | undefined>, attempt = 0): Promise<T> {
  const query = new URLSearchParams({ key: apiKey() });
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  const response = await fetch(`${API}/${resource}?${query.toString()}`, { cache: "no-store" });
  if (response.ok) return response.json() as Promise<T>;
  if (response.status >= 500 && attempt < 3) {
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    return request<T>(resource, params, attempt + 1);
  }
  throw new Error(`YouTube ${resource} failed: ${response.status} ${await response.text()}`);
}

export async function searchRecentTechnologyIndia(publishedAfter: string) {
  return request<{ items: YouTubeSearchItem[]; nextPageToken?: string }>("search", {
    part: "snippet",
    q: "technology",
    type: "video",
    order: "date",
    regionCode: "IN",
    relevanceLanguage: "en",
    maxResults: 50,
    publishedAfter,
  });
}

export async function getVideos(ids: string[]) {
  if (!ids.length) return [] as YouTubeVideo[];
  const result = await request<{ items: YouTubeVideo[] }>("videos", {
    part: "snippet,contentDetails,statistics,status",
    id: ids.join(","),
  });
  return result.items;
}

export async function getChannels(ids: string[]) {
  if (!ids.length) return [] as YouTubeChannel[];
  const result = await request<{ items: YouTubeChannel[] }>("channels", {
    part: "snippet,statistics",
    id: ids.join(","),
  });
  return result.items;
}
