import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Target, Compass, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">GROFO</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="hidden sm:inline-flex rounded-xl font-semibold">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="rounded-xl font-semibold shadow-xl shadow-primary/20">Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
            <Sparkles className="w-4 h-4" />
            <span>The Personal Learning OS for Indian Students</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground mb-8 leading-[1.1] animate-in slide-in-from-bottom-5 fade-in duration-700 delay-100">
            Your focused study desk, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">built just for you.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl animate-in slide-in-from-bottom-6 fade-in duration-700 delay-200">
            Replace five scattered apps with one calm command center. YouTube, notes, PDFs, timers, and AI — all integrated into a single, distraction-free environment for NEET, JEE, CLAT, and UPSC prep.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-7 fade-in duration-700 delay-300">
            <Link href="/sign-up">
              <Button size="lg" className="rounded-2xl text-lg h-14 px-8 w-full sm:w-auto shadow-2xl shadow-primary/30">
                Start Studying Now
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Target className="w-6 h-6 text-primary" />}
                title="Focused Workspace"
                description="Split-screen your video lectures with rich-text notes or PDFs. No more tab switching."
              />
              <FeatureCard 
                icon={<Brain className="w-6 h-6 text-primary" />}
                title="AI Sensei"
                description="Get doubts cleared instantly, summarize long texts, or quiz yourself with your personal AI tutor."
              />
              <FeatureCard 
                icon={<Compass className="w-6 h-6 text-primary" />}
                title="Smart Planner"
                description="Track your Pomodoro sessions, manage daily tasks, and watch your study streaks grow."
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}