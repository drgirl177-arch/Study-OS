import { useState, useEffect } from "react";
import { useGetProfile, useUpdateProfile, useListBookmarks, useListAchievements } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import { useClerk } from "@clerk/react";
import { LogOut, Moon, Sun, Monitor, User, Trophy, Bookmark, Settings, Download } from "lucide-react";
import { Link } from "wouter";

export default function ProfilePage() {
  const { data: profile } = useGetProfile();
  const { data: bookmarks } = useListBookmarks();
  const { data: achievements } = useListAchievements();
  
  const [activeTab, setActiveTab] = useState("settings");

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 pb-24 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-center gap-6">
        <div 
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl text-white font-bold shadow-lg"
          style={{ backgroundColor: profile?.avatarColor || '#2563EB' }}
        >
          {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{profile?.displayName || 'Student'}</h1>
          <p className="text-muted-foreground text-lg mt-1">
            Target: <span className="font-semibold text-foreground">{profile?.examName || 'Not set'}</span>
            {profile?.examDate && ` (${new Date(profile.examDate).toLocaleDateString()})`}
          </p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted/50 p-1 rounded-2xl h-14">
          <TabsTrigger value="settings" className="rounded-xl"><Settings className="w-4 h-4 mr-2 hidden sm:inline" /> Settings</TabsTrigger>
          <TabsTrigger value="bookmarks" className="rounded-xl"><Bookmark className="w-4 h-4 mr-2 hidden sm:inline" /> Bookmarks</TabsTrigger>
          <TabsTrigger value="achievements" className="rounded-xl"><Trophy className="w-4 h-4 mr-2 hidden sm:inline" /> Awards</TabsTrigger>
          <TabsTrigger value="downloads" className="rounded-xl"><Download className="w-4 h-4 mr-2 hidden sm:inline" /> Offline</TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="settings" className="m-0">
            <div className="grid md:grid-cols-2 gap-8">
              <ProfileSettingsForm />
              <PreferencesForm />
            </div>
          </TabsContent>

          <TabsContent value="bookmarks" className="m-0 space-y-4">
            {bookmarks?.length === 0 ? (
              <EmptyState icon={Bookmark} text="No bookmarked videos yet" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks?.map(b => (
                  <Card key={b.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                    <div className="aspect-video relative bg-muted">
                      <img src={b.thumbnailUrl} alt={b.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold line-clamp-1">{b.title}</h3>
                      <Link href={`/workspace/${b.id}`}>
                        <Button variant="link" className="px-0 mt-2 text-primary">Watch again</Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="m-0 space-y-4">
            {achievements?.length === 0 ? (
              <EmptyState icon={Trophy} text="Start studying to earn achievements!" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements?.map(a => (
                  <div key={a.id} className={`p-5 rounded-2xl border ${a.achieved ? 'bg-primary/5 border-primary/20' : 'bg-muted/20 grayscale opacity-60'}`}>
                    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${a.achieved ? 'bg-primary text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                      <Trophy className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                    {a.achieved && a.achievedAt && (
                      <p className="text-xs text-primary font-medium mt-3">Earned {new Date(a.achievedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="downloads" className="m-0">
            <EmptyState icon={Download} text="Offline downloads coming soon." />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ProfileSettingsForm() {
  const { data: profile } = useGetProfile();
  const updateProfile = useUpdateProfile();
  
  const [displayName, setDisplayName] = useState("");
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setExamName(profile.examName || "");
      setExamDate(profile.examDate ? profile.examDate.split('T')[0] : "");
    }
  }, [profile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      data: {
        displayName,
        examName: examName || null,
        examDate: examDate || null
      }
    });
  };

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="border-b bg-muted/10 pb-4">
        <CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Profile Details</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-muted/30" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Exam (Optional)</label>
            <Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. NEET 2025" className="bg-muted/30" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Exam Date (Optional)</label>
            <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="bg-muted/30" />
          </div>
          <Button type="submit" className="w-full mt-4" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PreferencesForm() {
  const { theme, setTheme } = useTheme();
  const { signOut } = useClerk();

  return (
    <div className="space-y-8">
      <Card className="border-2 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Preferences</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              <ThemeButton icon={Sun} label="Light" active={theme === 'light'} onClick={() => setTheme('light')} />
              <ThemeButton icon={Moon} label="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} />
              <ThemeButton icon={Monitor} label="System" active={theme === 'system'} onClick={() => setTheme('system')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-destructive/20 shadow-sm overflow-hidden bg-destructive/5">
        <CardContent className="p-6">
          <Button variant="destructive" className="w-full" onClick={() => signOut({ redirectUrl: '/' })}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ThemeButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 border-2 border-dashed rounded-3xl">
      <div className="w-16 h-16 rounded-2xl bg-background border flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground opacity-50" />
      </div>
      <p className="text-lg text-muted-foreground font-medium">{text}</p>
    </div>
  );
}