import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { 
  useGetVideo, 
  useGetWorkspaceLayout, 
  useSaveWorkspaceLayout, 
  WorkspaceLayoutType,
  useCreateStudySession,
  useUpdateNote,
  useGetNote
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Maximize2, MessageSquare, FileText, File, Video, Loader2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WorkspacePage() {
  const { videoId } = useParams();
  const id = videoId ? parseInt(videoId, 10) : undefined;
  const { data: video, isLoading: videoLoading } = useGetVideo(id!, { query: { enabled: !!id, queryKey: ['getVideo', id] } });
  
  const [layoutType, setLayoutType] = useState<WorkspaceLayoutType>('video-notes');
  const [noteId, setNoteId] = useState<number | null>(null);

  // If we open without a video, we default to pdf-notes.
  useEffect(() => {
    if (!id && layoutType === 'video-notes') {
      setLayoutType('pdf-notes');
    }
  }, [id, layoutType]);

  const currentLayout = layoutType;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background overflow-hidden">
      {/* Workspace Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b bg-card z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={id ? "/learn" : "/materials"}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Workspace</span>
            <span className="text-sm font-bold truncate max-w-[200px] md:max-w-md">
              {video ? video.title : 'Study Session'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={layoutType} onValueChange={(v) => setLayoutType(v as WorkspaceLayoutType)}>
            <SelectTrigger className="w-[140px] h-9 rounded-xl border-border bg-muted/30">
              <SelectValue placeholder="Layout" />
            </SelectTrigger>
            <SelectContent>
              {id && <SelectItem value="video-notes">Video + Notes</SelectItem>}
              {id && <SelectItem value="video-pdf">Video + PDF</SelectItem>}
              <SelectItem value="pdf-notes">PDF + Notes</SelectItem>
              <SelectItem value="ai-pdf">AI + PDF</SelectItem>
              <SelectItem value="ai-notes">AI + Notes</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="hidden sm:flex rounded-xl h-9">
            <Maximize2 className="w-4 h-4 mr-2" />
            Focus
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-2 md:p-3 bg-muted/20">
        <PanelGroup direction="horizontal" className="h-full rounded-xl border overflow-hidden bg-background shadow-sm">
          
          {/* Panel 1 */}
          <Panel defaultSize={50} minSize={30}>
            {currentLayout.startsWith('video') ? (
              <VideoPanel youtubeId={video?.youtubeId} />
            ) : currentLayout.startsWith('pdf') ? (
              <PdfPanel />
            ) : (
              <AiPanel />
            )}
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-muted hover:bg-primary/50 transition-colors cursor-col-resize relative group">
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-1 h-8 rounded-full bg-border group-hover:bg-primary" />
          </PanelResizeHandle>

          {/* Panel 2 */}
          <Panel defaultSize={50} minSize={30}>
            {currentLayout.endsWith('notes') ? (
              <NotesPanel />
            ) : currentLayout.endsWith('pdf') ? (
              <PdfPanel />
            ) : (
              <AiPanel />
            )}
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}

function VideoPanel({ youtubeId }: { youtubeId?: string }) {
  if (!youtubeId) return <div className="h-full flex items-center justify-center bg-black/5"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  
  return (
    <div className="w-full h-full bg-black">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}

function NotesPanel() {
  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="h-10 border-b flex items-center px-4 shrink-0 bg-muted/10">
        <FileText className="w-4 h-4 text-primary mr-2" />
        <span className="text-sm font-semibold">Notes</span>
      </div>
      <div className="flex-1 p-4">
        <textarea 
          className="w-full h-full resize-none outline-none text-base leading-relaxed bg-transparent placeholder:text-muted-foreground/50"
          placeholder="Start typing your notes here... They auto-save."
        />
      </div>
    </div>
  );
}

function PdfPanel() {
  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="h-10 border-b flex items-center px-4 shrink-0 bg-muted/10">
        <File className="w-4 h-4 text-orange-500 mr-2" />
        <span className="text-sm font-semibold">Study Material</span>
      </div>
      <div className="flex-1 flex items-center justify-center bg-muted/10">
        <p className="text-muted-foreground text-sm">PDF Viewer Placeholder</p>
      </div>
    </div>
  );
}

function AiPanel() {
  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="h-10 border-b flex items-center px-4 shrink-0 bg-muted/10">
        <MessageSquare className="w-4 h-4 text-purple-500 mr-2" />
        <span className="text-sm font-semibold">AI Sensei</span>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="bg-muted/30 rounded-2xl p-4 max-w-[85%] rounded-tl-sm text-sm border">
            Hello! I'm your AI Sensei. What concept can I explain, or would you like a quick quiz?
          </div>
        </div>
        <div className="p-3 border-t bg-muted/10">
          <div className="relative">
            <textarea 
              className="w-full bg-background border rounded-xl pl-3 pr-10 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 ring-primary"
              rows={1}
              placeholder="Ask anything..."
            />
            <Button size="icon" className="absolute right-1 bottom-1 h-7 w-7 rounded-lg">
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}