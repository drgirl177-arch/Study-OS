import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@clerk/react";
import {
  useListVideos,
  useSearchYoutubeVideos,
  useImportYoutubeVideo,
  VideoCategory,
  VideoType,
  type Video,
  type YoutubeSearchResult,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Search,
  PlayCircle,
  Clock,
  GraduationCap,
  Sparkles,
  Music2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES: VideoCategory[] = [
  "NEET",
  "JEE",
  "CLAT",
  "UPSC",
  "Languages",
];

type DisplayVideo =
  | { source: "local"; video: Video }
  | { source: "youtube"; result: YoutubeSearchResult };

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LearnPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-primary/90">
            Learn faster with focus and fewer tabs
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Video lessons, motivation, and study soundtracks in one place.
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-3xl">
            Explore curated lessons while signed out, then sign in to unlock
            live YouTube search, import videos, and keep your study progress.
          </p>
        </div>
      </header>

      <Tabs defaultValue="educational" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-xl h-12">
          <TabsTrigger value="educational" className="gap-1.5">
            <GraduationCap className="w-4 h-4" /> Learn
          </TabsTrigger>
          <TabsTrigger value="motivation" className="gap-1.5">
            <Sparkles className="w-4 h-4" /> Motivation
          </TabsTrigger>
          <TabsTrigger value="music" className="gap-1.5">
            <Music2 className="w-4 h-4" /> Study Music
          </TabsTrigger>
        </TabsList>

        <TabsContent value="educational" className="mt-0">
          <VideoSection
            type="educational"
            sectionTitle="Study videos"
            searchPlaceholder="Search any topic, chapter, or exam..."
            emptyLabel="No lectures found. Try a different search."
            showCategoryFilter
          />
        </TabsContent>
        <TabsContent value="motivation" className="mt-0">
          <VideoSection
            type="motivation"
            sectionTitle="Motivation"
            searchPlaceholder="Search motivational talks, success stories..."
            emptyLabel="No motivational content found yet."
          />
        </TabsContent>
        <TabsContent value="music" className="mt-0">
          <VideoSection
            type="music"
            sectionTitle="Study music"
            searchPlaceholder="Search focus music, lofi, ambient..."
            emptyLabel="No study music found yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VideoSection({
  type,
  sectionTitle,
  searchPlaceholder,
  emptyLabel,
  showCategoryFilter,
}: {
  type: VideoType;
  sectionTitle: string;
  searchPlaceholder: string;
  emptyLabel: string;
  showCategoryFilter?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<VideoCategory | undefined>();
  const [, navigate] = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const { toast } = useToast();

  const { data: localVideos, isLoading: localLoading } = useListVideos({
    type,
    search: search || undefined,
    category: showCategoryFilter ? category : undefined,
  });

  const trimmedSearch = search.trim();
  const isGuestSearch = isLoaded && !isSignedIn && trimmedSearch.length > 1;
  const {
    data: youtubeResults,
    isLoading: youtubeLoading,
    isError: youtubeErrored,
  } = useSearchYoutubeVideos(
    { q: trimmedSearch, type },
    {
      query: {
        enabled: isLoaded && isSignedIn && trimmedSearch.length > 1,
        queryKey: ["searchYoutubeVideos", type, trimmedSearch],
      },
    },
  );

  const importMutation = useImportYoutubeVideo();
  const [importingId, setImportingId] = useState<string | null>(null);

  const localIds = new Set((localVideos ?? []).map((v) => v.youtubeId));
  const items: DisplayVideo[] = [
    ...(localVideos ?? []).map((video): DisplayVideo => ({
      source: "local",
      video,
    })),
    ...(youtubeResults ?? [])
      .filter((r) => !localIds.has(r.youtubeId))
      .map((result): DisplayVideo => ({ source: "youtube", result })),
  ];

  const isLoading =
    localLoading || (trimmedSearch.length > 1 && youtubeLoading);

  function handleOpen(item: DisplayVideo) {
    if (item.source === "local") {
      navigate(`/workspace/${item.video.id}`);
      return;
    }

    setImportingId(item.result.youtubeId);
    importMutation.mutate(
      { data: { ...item.result, type } },
      {
        onSuccess: (video) => {
          setImportingId(null);
          navigate(`/workspace/${video.id}`);
        },
        onError: () => {
          setImportingId(null);
          toast({
            title: "Couldn't open that video",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-primary/90">
              {sectionTitle}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              Find the right lesson for your next study session.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-sm px-4 py-1.5">
              Curated library
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-1.5">
              Guest-friendly
            </Badge>
          </div>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            className="pl-10 h-14 text-base rounded-[1.5rem] bg-muted/50 border-transparent focus-visible:bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isGuestSearch && (
          <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-slate-900 dark:text-slate-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  Sign in to unlock YouTube search and save your progress.
                </p>
                <p className="text-muted-foreground">
                  As a guest, you can still browse the curated catalog and open
                  recommended lessons.
                </p>
              </div>
              <Button asChild size="sm" className="rounded-full">
                <Link href="/sign-in">Sign in to search</Link>
              </Button>
            </div>
          </div>
        )}

        {showCategoryFilter && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={!category ? "default" : "secondary"}
              className="cursor-pointer text-sm px-4 py-1.5"
              onClick={() => setCategory(undefined)}
            >
              All
            </Badge>
            {CATEGORIES.map((c) => (
              <Badge
                key={c}
                variant={category === c ? "default" : "secondary"}
                className="cursor-pointer text-sm px-4 py-1.5"
                onClick={() => setCategory(c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        )}

        {trimmedSearch.length > 1 && youtubeErrored && (
          <div className="rounded-2xl border border-border/70 bg-accent/60 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <div>
                Live YouTube search is unavailable right now — showing curated
                matches only.
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <VideoSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, i) => {
            const key =
              item.source === "local"
                ? `local-${item.video.id}`
                : `yt-${item.result.youtubeId}`;
            const title =
              item.source === "local" ? item.video.title : item.result.title;
            const channel =
              item.source === "local"
                ? item.video.channel
                : item.result.channel;
            const thumb =
              item.source === "local"
                ? item.video.thumbnailUrl
                : item.result.thumbnailUrl;
            const duration =
              item.source === "local"
                ? item.video.durationSeconds
                : item.result.durationSeconds;
            const cardCategory =
              item.source === "local" ? item.video.category : undefined;
            const isImporting =
              item.source === "youtube" &&
              importingId === item.result.youtubeId;

            return (
              <div
                key={key}
                onClick={() => !isImporting && handleOpen(item)}
                className="group cursor-pointer animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="aspect-video bg-muted rounded-2xl overflow-hidden relative mb-3 border border-border shadow-sm group-hover:border-primary/30 transition-colors">
                  <img
                    src={thumb}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    {isImporting ? (
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                    ) : (
                      <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-300" />
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(duration)}
                  </div>
                  {item.source === "youtube" && (
                    <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm">
                      YouTube
                    </div>
                  )}
                </div>
                <div className="px-1">
                  {cardCategory && (
                    <Badge
                      variant="outline"
                      className="text-[10px] mb-2 px-1.5 py-0 rounded bg-background uppercase tracking-wider"
                    >
                      {cardCategory}
                    </Badge>
                  )}
                  <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {channel}
                  </p>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="col-span-full">
              <Empty className="py-20">
                <EmptyMedia className="bg-primary/10 text-primary">
                  <Search className="w-8 h-8" />
                </EmptyMedia>
                <EmptyTitle>
                  {trimmedSearch
                    ? "No results found"
                    : "Find your first lesson"}
                </EmptyTitle>
                <EmptyDescription>
                  {trimmedSearch
                    ? emptyLabel
                    : "Browse the curated library above and sign in to unlock live YouTube search, import favorites, and track study progress."}
                </EmptyDescription>
                {!isSignedIn && (
                  <Button asChild size="sm" className="rounded-full">
                    <Link href="/sign-in">Sign in to search YouTube</Link>
                  </Button>
                )}
              </Empty>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VideoSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
