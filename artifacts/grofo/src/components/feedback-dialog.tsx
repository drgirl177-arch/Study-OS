import { useState } from "react";
import { useLocation } from "wouter";
import { useSubmitFeedback, FeedbackType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Bug, Lightbulb, MessageSquareHeart, MessageCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES: { value: FeedbackType; label: string; icon: React.ElementType }[] = [
  { value: "bug", label: "Report a bug", icon: Bug },
  { value: "feature", label: "Suggest a feature", icon: Lightbulb },
  { value: "general", label: "General feedback", icon: MessageSquareHeart },
];

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [location] = useLocation();
  const submitFeedback = useSubmitFeedback();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        setSent(false);
        setMessage("");
        setType("general");
      }, 200);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitFeedback.mutate(
      { data: { type, message: message.trim(), page: location } },
      { onSuccess: () => setSent(true) },
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-40 right-4 bottom-24 md:bottom-6 md:right-6 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Send feedback"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          {sent ? (
            <div className="py-8 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold">Thanks — got it!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                We read every beta note. This genuinely helps shape what GROFO becomes.
              </p>
              <Button variant="secondary" className="rounded-xl mt-2" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Help us improve GROFO</DialogTitle>
                <DialogDescription>You're on the beta — tell us what's working and what isn't.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-colors",
                        type === t.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <t.icon className="w-5 h-5" />
                      {t.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  className="rounded-xl min-h-28"
                  maxLength={4000}
                  autoFocus
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full rounded-xl"
                    disabled={!message.trim() || submitFeedback.isPending}
                  >
                    {submitFeedback.isPending ? "Sending..." : "Send feedback"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
