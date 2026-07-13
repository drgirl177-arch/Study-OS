import { useListNotes, useCreateNote, useListNoteFolders, useCreateNoteFolder } from "@workspace/api-client-react";
import { useState } from "react";
import { Folder, FileText, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function NotesPage() {
  const [search, setSearch] = useState("");
  const [activeFolderId, setActiveFolderId] = useState<number | undefined>();
  
  const { data: folders } = useListNoteFolders();
  const { data: notes, isLoading } = useListNotes({ search: search || undefined, folderId: activeFolderId });
  const createNote = useCreateNote();
  const createFolder = useCreateNoteFolder();

  return (
    <div className="flex h-[100dvh] pb-20 md:pb-0">
      {/* Sidebar - Folders */}
      <div className="w-64 border-r bg-muted/10 hidden md:flex flex-col">
        <div className="p-4 border-b">
          <Button 
            className="w-full rounded-xl bg-background border text-foreground hover:bg-muted" 
            variant="outline"
            onClick={() => {
              const name = prompt("Folder Name:");
              if (name) createFolder.mutate({ data: { name } });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            <button
              onClick={() => setActiveFolderId(undefined)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!activeFolderId ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <Folder className="w-4 h-4" />
              All Notes
            </button>
            {folders?.map(folder => (
              <button
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolderId === folder.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <Folder className="w-4 h-4" />
                {folder.name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Area - Notes List */}
      <div className="flex-1 flex flex-col bg-background">
        <header className="p-6 md:p-8 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Notes</h1>
            <Button 
              className="rounded-xl shadow-md"
              onClick={() => {
                createNote.mutate({ data: { title: "Untitled Note", folderId: activeFolderId } });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search your notes..." 
              className="pl-10 h-12 rounded-2xl bg-muted/50 border-transparent focus-visible:bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <ScrollArea className="flex-1 px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8 pt-4">
            {notes?.map(note => (
              <div key={note.id} className="group p-5 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{note.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {note.content.replace(/<[^>]*>?/gm, '') || "No content yet..."}
                </p>
              </div>
            ))}
            {notes?.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center text-muted-foreground flex flex-col items-center">
                <FileText className="w-12 h-12 text-muted mb-4" />
                <p>No notes found. Start writing!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}