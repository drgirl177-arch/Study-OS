import { useState } from "react";
import { useListMaterials, VideoCategory } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, File, BookOpen } from "lucide-react";
import { Link } from "wouter";

const CATEGORIES: VideoCategory[] = ['NEET', 'JEE', 'CLAT', 'UPSC', 'Languages'];

export default function MaterialsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<VideoCategory | undefined>();
  
  const { data: materials, isLoading } = useListMaterials({ search: search || undefined, category });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-24 md:pb-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Study Materials</h1>
        <p className="text-muted-foreground">PDF notes, formulas, and past papers.</p>
        
        <div className="relative max-w-md mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search materials..." 
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <MaterialSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials?.map((mat, i) => (
            <Link key={mat.id} href={`/workspace`}>
              <div 
                className="group cursor-pointer p-5 rounded-3xl bg-card border-2 hover:border-primary/50 hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <File className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-[10px] mb-2 px-1.5 py-0 rounded bg-background uppercase tracking-wider">{mat.category}</Badge>
                    <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">{mat.title}</h3>
                    <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground font-medium">
                      {mat.pageCount && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {mat.pageCount} pages</span>}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {materials?.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              No materials found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MaterialSkeleton() {
  return (
    <div className="p-5 rounded-3xl bg-card border-2 flex items-start gap-4">
      <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-24 mt-2" />
      </div>
    </div>
  );
}