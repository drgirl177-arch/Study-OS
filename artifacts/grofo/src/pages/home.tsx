import { useGetDashboardSummary, useGetWeeklyStudySessions, useUpdateProfile } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Flame, Clock, CheckCircle2, Target, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: weekly } = useGetWeeklyStudySessions();

  if (isLoading) {
    return <HomeSkeleton />;
  }

  if (!summary) return null;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 pb-24 md:pb-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Welcome back, {summary.displayName.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Let's make today count. You have {summary.examDaysLeft !== null ? <span className="font-bold text-primary">{summary.examDaysLeft} days</span> : "some time"} until {summary.examName || 'your exam'}.
        </p>
      </header>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="text-blue-500" />} label="Today's Study" value={`${summary.todayStudyMinutes}m`} bg="bg-blue-500/10" />
        <StatCard icon={<Flame className="text-orange-500" />} label="Current Streak" value={`${summary.currentStreak} Days`} bg="bg-orange-500/10" />
        <StatCard icon={<CheckCircle2 className="text-green-500" />} label="Tasks Done" value={`${summary.todayTasksCompleted}/${summary.todayTasksTotal}`} bg="bg-green-500/10" />
        <StatCard icon={<Target className="text-purple-500" />} label="Weekly Goal" value={`${summary.weeklyProgressPercent}%`} bg="bg-purple-500/10" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-8">
          {/* Continue Learning */}
          {summary.continueLearning && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                Continue Learning
              </h2>
              <Link href={`/workspace/${summary.continueLearning.videoId}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group overflow-hidden border-2">
                  <div className="flex flex-col sm:flex-row h-full">
                    <div className="sm:w-48 aspect-video sm:aspect-auto bg-muted relative overflow-hidden">
                      <img src={summary.continueLearning.video.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                          <PlayCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{summary.continueLearning.video.category}</p>
                        <h3 className="font-bold text-lg line-clamp-2 leading-tight">{summary.continueLearning.video.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{summary.continueLearning.video.channel}</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground font-medium">
                          <span>{Math.floor(summary.continueLearning.progressSeconds / 60)}m watched</span>
                          <span>{Math.floor(summary.continueLearning.video.durationSeconds / 60)}m total</span>
                        </div>
                        <Progress value={(summary.continueLearning.progressSeconds / summary.continueLearning.video.durationSeconds) * 100} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </section>
          )}

          {/* Weekly Progress Chart */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Weekly Consistency</h2>
            <Card className="border-2 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-end justify-between h-40 gap-2">
                  {weekly?.map((day, i) => {
                    const max = Math.max(...weekly.map(d => d.minutes), 120);
                    const height = `${Math.max((day.minutes / max) * 100, 4)}%`;
                    const isToday = i === weekly.length - 1;
                    
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full bg-muted rounded-t-lg relative flex-1 flex items-end">
                          <div 
                            className={`w-full rounded-t-lg transition-all duration-700 ${isToday ? 'bg-primary' : 'bg-primary/40 group-hover:bg-primary/60'}`}
                            style={{ height }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Today's Focus</h2>
              <Link href="/planner">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Plus className="w-4 h-4" /></Button>
              </Link>
            </div>
            
            <Card className="bg-gradient-to-b from-primary/5 to-transparent border-primary/10 border-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-extrabold text-primary">{summary.weeklyProgressPercent}%</span>
                  <span className="text-sm font-medium text-muted-foreground pb-1">Weekly Goal</span>
                </div>
                <Progress value={summary.weeklyProgressPercent} className="h-2.5" />
                <p className="text-sm text-muted-foreground pt-2">
                  {summary.todayTasksCompleted === summary.todayTasksTotal 
                    ? "All tasks completed! Great job." 
                    : `${summary.todayTasksTotal - summary.todayTasksCompleted} tasks remaining today.`}
                </p>
                <Link href="/planner" className="block mt-4">
                  <Button variant="outline" className="w-full bg-background">Open Planner</Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode, label: string, value: string, bg: string }) {
  return (
    <Card className="border-none shadow-sm bg-muted/30">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function HomeSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}