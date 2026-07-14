import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Brain,
  Target,
  Compass,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers3,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";

const studyPaths = [
  "SAT",
  "ACT",
  "IB",
  "GCSE",
  "A Levels",
  "JEE",
  "NEET",
  "CUET",
  "CLAT",
  "UPSC",
  "GRE",
  "IELTS",
  "University",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.10),_transparent_28%),linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] flex flex-col">
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Logo showWordmark={false} size={42} />
          <div>
            <div className="text-xl font-semibold tracking-tight text-foreground">
              GROFO
            </div>
            <div className="text-xs text-muted-foreground">
              AI learning OS for students worldwide
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            className="hidden sm:inline-flex rounded-full font-semibold"
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button
            asChild
            className="rounded-full font-semibold shadow-lg shadow-primary/20"
          >
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex flex-col justify-center px-4 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/10">
                <Sparkles className="w-4 h-4" />
                <span>The global AI learning OS for every learner</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05] mb-6">
                One intelligent workspace for learning, planning, and growth.
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-500">
                  Capture lectures, organize notes, and study with AI.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-8 mb-4 max-w-xl">
                GROFO brings video lessons, notes, PDFs, planner tools, and AI
                study help into a calm workspace so you can focus on what
                matters: learning.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary shadow-sm mb-8">
                <Sparkles className="w-4 h-4" />
                Explore GROFO in guest mode with sample lessons, decks, and
                focus tools.
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-8">
                <Button
                  asChild
                  size="lg"
                  className="rounded-2xl text-base h-14 px-7 w-full sm:w-auto shadow-2xl shadow-primary/25"
                >
                  <Link href="/sign-up">
                    Start free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-2xl text-base h-14 px-7 w-full sm:w-auto border-border/80"
                >
                  <Link href="/learn">Explore guest mode</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {studyPaths.map((path) => (
                  <span
                    key={path}
                    className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-sm text-muted-foreground"
                  >
                    {path}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-full max-w-xl mx-auto lg:mx-0">
              <div className="rounded-[2rem] border border-border/70 bg-background/90 p-4 sm:p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Today’s focus
                      </p>
                      <p className="text-sm text-muted-foreground">
                        3 study blocks left
                      </p>
                    </div>
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <Zap className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Layers3 className="h-4 w-4 text-primary" />
                      One calm workspace
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Watch lectures, take notes, and review PDFs together
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Ask AI for explanations, summaries, and quiz practice
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Keep every session flowing with a clear study plan
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 px-4 bg-muted/20 border-t border-border/60">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Target className="w-6 h-6 text-primary" />}
                title="Focused workspace"
                description="Keep videos, notes, and PDFs side by side so your attention stays where it matters most."
              />
              <FeatureCard
                icon={<Brain className="w-6 h-6 text-primary" />}
                title="AI tutor in context"
                description="Get explanations, summaries, doubt support, and practice prompts without leaving your study flow."
              />
              <FeatureCard
                icon={<Compass className="w-6 h-6 text-primary" />}
                title="Clear study planning"
                description="Bring your tasks, sessions, and habits together in one place that feels calm and dependable."
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-background/80 p-7 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-7">{description}</p>
    </div>
  );
}
