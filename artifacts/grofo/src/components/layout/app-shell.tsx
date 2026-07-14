import { Link, useLocation } from "wouter";
import { Show } from "@clerk/react";
import { Home, BookOpen, Calendar, Bot, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedbackDialog } from "@/components/feedback-dialog";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/community", label: "Community", icon: Users },
    { href: "/planner", label: "Planner", icon: Calendar },
    { href: "/ai", label: "AI", icon: Bot },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 md:pl-64">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-background/80 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 md:hidden pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2 relative group">
              {isActive && (
                <span className="absolute -top-[1px] w-12 h-1 bg-primary rounded-b-full animate-in fade-in slide-in-from-top-1" />
              )}
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-200 ease-out",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground group-hover:text-foreground group-hover:bg-muted"
              )}>
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 left-0 bottom-0 bg-background border-r border-border z-40">
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">GROFO</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <Show when="signed-in">
        <FeedbackDialog />
      </Show>
    </div>
  );
}