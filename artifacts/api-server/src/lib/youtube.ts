import { logger } from "./logger";

export class YoutubeError extends Error {
  status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.status = status;
  }
}

export function isYoutubeSearchConfigured(): boolean {
  return !!process.env.YOUTUBE_API_KEY;
}

export interface YoutubeSearchResult {
  youtubeId: string;
  title: string;
  channel: string;
  durationSeconds: number;
  thumbnailUrl: string;
}

// Biases the raw user query toward the kind of content each GROFO section wants,
// and picks a YouTube video category to keep results on-topic.
const TYPE_QUERY_HINTS: Record<string, { suffix: string; videoCategoryId?: string }> = {
  educational: { suffix: "lecture full class", videoCategoryId: "27" },
  motivation: { suffix: "motivational speech for students" },
  music: { suffix: "study music focus lofi playlist", videoCategoryId: "10" },
};

function parseIsoDuration(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (parseInt(h ?? "0", 10) * 3600) + (parseInt(m ?? "0", 10) * 60) + parseInt(s ?? "0", 10);
}

export async function searchYoutube(query: string, type: string): Promise<YoutubeSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new YoutubeError("YouTube search is not configured", 503);
  }

  const hint = TYPE_QUERY_HINTS[type] ?? TYPE_QUERY_HINTS.educational;
  const searchParams = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    type: "video",
    maxResults: "16",
    safeSearch: "strict",
    q: `${query} ${hint.suffix}`,
  });
  if (hint.videoCategoryId) searchParams.set("videoCategoryId", hint.videoCategoryId);

  let searchJson: any;
  try {
    const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`);
    searchJson = await searchRes.json();
    if (!searchRes.ok) {
      logger.error({ status: searchRes.status, body: searchJson }, "YouTube search API error");
      throw new YoutubeError("YouTube search failed", searchRes.status === 403 ? 503 : 502);
    }
  } catch (err) {
    if (err instanceof YoutubeError) throw err;
    logger.error({ err }, "YouTube search request failed");
    throw new YoutubeError("Could not reach YouTube", 503);
  }

  const videoIds: string[] = (searchJson.items ?? [])
    .map((item: any) => item.id?.videoId)
    .filter((id: unknown): id is string => typeof id === "string");

  if (videoIds.length === 0) return [];

  const detailsParams = new URLSearchParams({
    key: apiKey,
    part: "snippet,contentDetails",
    id: videoIds.join(","),
  });

  let detailsJson: any;
  try {
    const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailsParams.toString()}`);
    detailsJson = await detailsRes.json();
    if (!detailsRes.ok) {
      logger.error({ status: detailsRes.status, body: detailsJson }, "YouTube videos API error");
      throw new YoutubeError("YouTube search failed", 502);
    }
  } catch (err) {
    if (err instanceof YoutubeError) throw err;
    logger.error({ err }, "YouTube videos request failed");
    throw new YoutubeError("Could not reach YouTube", 503);
  }

  return (detailsJson.items ?? [])
    .map((item: any): YoutubeSearchResult => ({
      youtubeId: item.id,
      title: item.snippet?.title ?? "Untitled",
      channel: item.snippet?.channelTitle ?? "Unknown",
      durationSeconds: parseIsoDuration(item.contentDetails?.duration ?? "PT0S"),
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.default?.url ??
        `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
    }))
    // Educational lectures/music are long-form; drop very short clips/shorts.
    .filter((v: YoutubeSearchResult) => (type === "motivation" ? v.durationSeconds >= 30 : v.durationSeconds >= 120));
}
