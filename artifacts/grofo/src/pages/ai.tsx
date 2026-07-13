import { useState, useRef, useEffect } from "react";
import { useListAiSessions, useCreateAiSession, useListAiMessages, useSendAiMessage, AiSessionMode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, User, Plus, MessageSquare, BookOpen, BrainCircuit, Target, ArrowUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const MODES: { value: AiSessionMode, label: string, icon: any, color: string }[] = [
  { value: 'explain', label: 'Explain Concept', icon: BookOpen, color: 'text-blue-500 bg-blue-500/10' },
  { value: 'doubt', label: 'Clear Doubt', icon: MessageSquare, color: 'text-orange-500 bg-orange-500/10' },
  { value: 'summarize', label: 'Summarize', icon: Target, color: 'text-purple-500 bg-purple-500/10' },
  { value: 'quiz', label: 'Quiz Me', icon: BrainCircuit, color: 'text-green-500 bg-green-500/10' },
];

export default function AiPage() {
  const { data: sessions } = useListAiSessions();
  const [activeSessionId, setActiveSessionId] = useState<number | undefined>();
  const [mode, setMode] = useState<AiSessionMode>('explain');
  
  const createSession = useCreateAiSession();

  const handleCreate = () => {
    createSession.mutate({ data: { title: `New ${mode} session`, mode } }, {
      onSuccess: (res) => setActiveSessionId(res.id)
    });
  };

  useEffect(() => {
    if (!activeSessionId && sessions && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  return (
    <div className="flex h-[100dvh] pb-20 md:pb-0 bg-background">
      {/* Sidebar */}
      <div className="w-72 border-r bg-muted/5 hidden md:flex flex-col">
        <div className="p-4 border-b space-y-4">
          <Select value={mode} onValueChange={(v) => setMode(v as AiSessionMode)}>
            <SelectTrigger className="w-full rounded-xl bg-background h-12">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              {MODES.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  <div className="flex items-center gap-2">
                    <m.icon className="w-4 h-4 text-muted-foreground" />
                    <span>{m.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-full rounded-xl shadow-sm" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions?.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full flex flex-col text-left px-4 py-3 rounded-xl transition-colors ${activeSessionId === s.id ? 'bg-background border shadow-sm' : 'hover:bg-muted/50 border border-transparent'}`}
              >
                <span className={`font-semibold text-sm truncate ${activeSessionId === s.id ? 'text-foreground' : 'text-foreground/80'}`}>{s.title}</span>
                <span className="text-xs text-muted-foreground capitalize mt-1 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> {s.mode}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {activeSessionId ? (
          <ChatInterface sessionId={activeSessionId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to AI Sensei</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Your personal tutor is ready. Ask questions, clarify doubts, get summaries, or test your knowledge.
            </p>
            <Button size="lg" className="rounded-xl px-8" onClick={handleCreate}>
              Start a Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatInterface({ sessionId }: { sessionId: number }) {
  const { data: messages, isLoading } = useListAiMessages(sessionId, { query: { enabled: !!sessionId, queryKey: ['getMessages', sessionId] } });
  const sendMessage = useSendAiMessage();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendMessage.mutate({ id: sessionId, data: { content: input } }, {
      onSuccess: () => setInput("")
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth" ref={scrollRef}>
        {messages?.map(msg => (
          <div key={msg.id} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <Avatar className={`w-8 h-8 md:w-10 md:h-10 shrink-0 ${msg.role === 'assistant' ? 'bg-primary' : 'bg-muted'}`}>
              <AvatarFallback className={msg.role === 'assistant' ? 'bg-primary text-primary-foreground' : ''}>
                {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <div className={`rounded-2xl px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm
              ${msg.role === 'user' ? 'bg-muted/50 rounded-tr-sm' : 'bg-card border rounded-tl-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {sendMessage.isPending && (
          <div className="flex gap-4 max-w-3xl animate-in fade-in duration-300">
            <Avatar className="w-8 h-8 md:w-10 md:h-10 shrink-0 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="w-5 h-5" /></AvatarFallback>
            </Avatar>
            <div className="rounded-2xl px-5 py-3.5 bg-card border rounded-tl-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        {sendMessage.error && (
          <div className="flex gap-4 max-w-3xl animate-in fade-in duration-300">
            <Avatar className="w-8 h-8 md:w-10 md:h-10 shrink-0 bg-destructive/10">
              <AvatarFallback className="bg-destructive/10 text-destructive"><Bot className="w-5 h-5" /></AvatarFallback>
            </Avatar>
            <div className="rounded-2xl px-5 py-3.5 bg-destructive/5 border border-destructive/20 rounded-tl-sm text-sm md:text-base text-destructive space-y-2">
              <p>{getErrorMessage(sendMessage.error)}</p>
              {input.trim() && (
                <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg" onClick={() => handleSend()}>
                  Try again
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-background border-t">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-end gap-2 bg-muted/30 p-2 rounded-3xl border focus-within:border-primary/50 focus-within:bg-background transition-colors shadow-sm">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Sensei..." 
            disabled={sendMessage.isPending}
            className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 h-auto py-3 px-4"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-10 w-10 rounded-full shrink-0"
            disabled={!input.trim() || sendMessage.isPending}
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return message || "AI Sensei couldn't respond right now. Please try again in a moment.";
}