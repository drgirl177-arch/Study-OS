import { useState } from "react";
import { useListVideos, VideoCategory } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, PlayCircle, Clock } from "lucide-react";
import { Link } from "wouter";

const CATEGORIES: VideoCategory[] = ['NEET', 'JEE', 'CLAT', 'UPSC', 'Languages'];

export default function LearnPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<VideoCategory | undefined>();
  
  const { data: videos, isLoading } = useListVideos({ search: search || undefined, category });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-24 md:pb-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Catalog</h1>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search lectures..." 
            className="pl-10 h-12 text-base rounded-2xl bg-muted/50 border-transparent focus-visible:bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Badge 
            variant={!category ? "default" : "secondary"}
            className="cursor-pointer text-sm px-4 py-1.5"
            onClick={() => setCategory(undefined)}
          >
            All
          </Badge>
          {CATEGORIES.map(c => (
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
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <VideoSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos?.map((video, i) => (
            <Link key={video.id} href={`/workspace/${video.id}`}>
              <div 
                className="group cursor-pointer animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="aspect-video bg-muted rounded-2xl overflow-hidden relative mb-3 border border-border shadow-sm group-hover:border-primary/30 transition-colors">
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-300" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(video.durationSeconds / 60)}:{(video.durationSeconds % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="px-1">
                  <Badge variant="outline" className="text-[10px] mb-2 px-1.5 py-0 rounded bg-background uppercase tracking-wider">{video.category}</Badge>
                  <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">{video.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{video.channel}</p>
                </div>
              </div>
            </Link>
          ))}
          {videos?.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              No videos found matching your search.
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