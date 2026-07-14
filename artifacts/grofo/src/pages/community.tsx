import { useState } from "react";
import {
  useListCommunityPosts,
  useCreateCommunityPost,
  useUpvoteCommunityPost,
  useListCommunityComments,
  useCreateCommunityComment,
  useUpvoteCommunityComment,
  getListCommunityCommentsQueryKey,
  CommunityCategory,
  type CommunityPost,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowBigUp,
  MessageCircle,
  Plus,
  Users,
  GraduationCap,
  Sparkles,
  Target,
  HelpCircle,
  MessagesSquare,
} from "lucide-react";

const CATEGORY_META: Record<
  CommunityCategory,
  { label: string; icon: React.ElementType; color: string }
> = {
  exam: { label: "Exam Talk", icon: GraduationCap, color: "text-blue-500 bg-blue-500/10" },
  motivation: { label: "Motivation", icon: Sparkles, color: "text-orange-500 bg-orange-500/10" },
  productivity: { label: "Productivity", icon: Target, color: "text-purple-500 bg-purple-500/10" },
  doubts: { label: "Doubts", icon: HelpCircle, color: "text-green-500 bg-green-500/10" },
  general: { label: "General", icon: MessagesSquare, color: "text-slate-500 bg-slate-500/10" },
};

const CATEGORIES = Object.keys(CATEGORY_META) as CommunityCategory[];

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CommunityPage() {
  const [category, setCategory] = useState<CommunityCategory | undefined>();
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const { data: posts, isLoading } = useListCommunityPosts(category ? { category } : undefined);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6 pb-24 md:pb-8 animate-in fade-in duration-500">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Community
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Real talk from students grinding for the same exams. Ask, vent, celebrate wins.
          </p>
        </div>
        <NewPostDialog />
      </header>

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
            className="cursor-pointer text-sm px-4 py-1.5 gap-1"
            onClick={() => setCategory(c)}
          >
            {CATEGORY_META[c].label}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl border space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onOpen={() => setActivePostId(post.id)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 border-2 border-dashed rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-background border flex items-center justify-center mb-4">
            <MessagesSquare className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <p className="text-lg text-muted-foreground font-medium">
            No posts here yet — be the first to start the conversation.
          </p>
        </div>
      )}

      <PostThreadDialog postId={activePostId} onClose={() => setActivePostId(null)} />
    </div>
  );
}

function PostCard({ post, onOpen }: { post: CommunityPost; onOpen: () => void }) {
  const upvote = useUpvoteCommunityPost();
  const meta = CATEGORY_META[post.category];
  const Icon = meta.icon;

  return (
    <div className="p-5 rounded-2xl border bg-card hover:border-primary/30 transition-colors shadow-sm">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => upvote.mutate({ id: post.id })}
          disabled={upvote.isPending}
          className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-xl transition-colors shrink-0 ${
            post.hasUpvoted ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <ArrowBigUp className={`w-6 h-6 ${post.hasUpvoted ? "fill-primary" : ""}`} />
          <span className="text-xs font-bold">{post.upvoteCount}</span>
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpen}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className={`gap-1 border-0 ${meta.color}`}>
              <Icon className="w-3 h-3" /> {meta.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {post.authorName} · {timeAgo(post.createdAt)}
            </span>
          </div>
          <h3 className="font-bold text-lg leading-snug mb-1">{post.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
          <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
          </div>
        </div>
      </div>
    </div>
  );
}

function NewPostDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<CommunityCategory>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const createPost = useCreateCommunityPost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    createPost.mutate(
      { data: { category, title: title.trim(), body: body.trim() } },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle("");
          setBody("");
          setCategory("general");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shrink-0 shadow-sm">
          <Plus className="w-4 h-4 mr-1" /> Post
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a discussion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select value={category} onValueChange={(v) => setCategory(v as CommunityCategory)}>
            <SelectTrigger className="rounded-xl h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_META[c].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl h-11"
            maxLength={200}
          />
          <Textarea
            placeholder="What's on your mind?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="rounded-xl min-h-32"
            maxLength={5000}
          />
          <DialogFooter>
            <Button
              type="submit"
              className="rounded-xl w-full"
              disabled={!title.trim() || !body.trim() || createPost.isPending}
            >
              {createPost.isPending ? "Posting..." : "Post to Community"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PostThreadDialog({ postId, onClose }: { postId: number | null; onClose: () => void }) {
  const { data: posts } = useListCommunityPosts();
  const post = posts?.find((p) => p.id === postId);
  const { data: comments, isLoading } = useListCommunityComments(postId ?? 0, {
    query: { enabled: !!postId, queryKey: getListCommunityCommentsQueryKey(postId ?? 0) },
  });
  const createComment = useCreateCommunityComment();
  const upvoteComment = useUpvoteCommunityComment();
  const upvotePost = useUpvoteCommunityPost();
  const [reply, setReply] = useState("");

  if (!postId || !post) return null;
  const meta = CATEGORY_META[post.category];
  const Icon = meta.icon;

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    createComment.mutate(
      { id: postId, data: { body: reply.trim() } },
      { onSuccess: () => setReply("") },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-xl max-h-[85vh] flex flex-col p-0 gap-0">
        <div className="p-6 pb-4 border-b overflow-y-auto">
          <Badge variant="outline" className={`gap-1 border-0 mb-3 ${meta.color}`}>
            <Icon className="w-3 h-3" /> {meta.label}
          </Badge>
          <h2 className="text-xl font-bold leading-snug mb-2">{post.title}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.body}</p>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span>{post.authorName} · {timeAgo(post.createdAt)}</span>
            <button
              type="button"
              onClick={() => upvotePost.mutate({ id: post.id })}
              className={`flex items-center gap-1 font-semibold ${post.hasUpvoted ? "text-primary" : ""}`}
            >
              <ArrowBigUp className={`w-4 h-4 ${post.hasUpvoted ? "fill-primary" : ""}`} /> {post.upvoteCount}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </>
          ) : comments && comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0" style={{ backgroundColor: c.authorAvatarColor }}>
                  <AvatarFallback style={{ backgroundColor: c.authorAvatarColor }} className="text-white text-xs">
                    {c.authorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <p className="text-xs font-semibold mb-0.5">{c.authorName}</p>
                    <p className="text-sm">{c.body}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 pl-1 text-xs text-muted-foreground">
                    <span>{timeAgo(c.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => upvoteComment.mutate({ id: c.id })}
                      className={`flex items-center gap-1 font-medium ${c.hasUpvoted ? "text-primary" : ""}`}
                    >
                      <ArrowBigUp className={`w-3.5 h-3.5 ${c.hasUpvoted ? "fill-primary" : ""}`} /> {c.upvoteCount}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No comments yet — start the thread.</p>
          )}
        </div>

        <form onSubmit={handleReply} className="p-4 border-t flex gap-2">
          <Input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Add a comment..."
            className="rounded-xl"
          />
          <Button type="submit" disabled={!reply.trim() || createComment.isPending} className="rounded-xl shrink-0">
            Reply
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
