import { useState, useEffect, useRef } from "react";
import { useListTasks, useCreateTask, useUpdateTask, useDeleteTask, useCreateStudySession, TaskPriority, Task, StudySessionSource } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Square, Timer, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

export default function PlannerPage() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-24 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Planner</h1>
          <p className="text-muted-foreground mt-1">Manage your tasks and focus sessions</p>
        </div>
        <input 
          type="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 bg-muted/50 rounded-xl border-transparent focus:ring-2 ring-primary outline-none"
        />
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <TaskManager date={date} />
        <TimerManager />
      </div>
    </div>
  );
}

function TaskManager({ date }: { date: string }) {
  const { data: tasks, isLoading } = useListTasks({ startDate: date, endDate: date });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTask.mutate({ data: { title: newTaskTitle, date, priority: newTaskPriority } }, {
      onSuccess: () => setNewTaskTitle("")
    });
  };

  const handleToggle = (task: Task) => {
    updateTask.mutate({ id: task.id, data: { completed: !task.completed } }, {
      onSuccess: () => {
        // QueryClient will invalidate automatically if properly setup, or we rely on hook defaults.
        // The API client provided doesn't explicitly return queryClient invalidations, but typical react-query
        // use cases handle invalidation. Assuming the generated hooks manage cache or we just patch locally.
      }
    });
  };

  return (
    <Card className="flex flex-col h-[600px] border-2 shadow-sm">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Daily Tasks
        </CardTitle>
      </CardHeader>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading tasks...</div>
        ) : tasks?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
            <p>No tasks for this day.</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {tasks?.sort((a, b) => {
              const p = { high: 3, medium: 2, low: 1 };
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              return p[b.priority] - p[a.priority];
            }).map(task => (
              <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${task.completed ? 'bg-muted/30 opacity-60' : 'bg-card hover:border-primary/30'}`}>
                <Checkbox 
                  checked={task.completed} 
                  onCheckedChange={() => handleToggle(task)}
                  className="rounded-full w-5 h-5 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteTask.mutate({ id: task.id })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t bg-muted/10">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input 
            placeholder="Add a new task..." 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="rounded-xl"
          />
          <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as TaskPriority)}>
            <SelectTrigger className="w-[110px] rounded-xl shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="icon" className="shrink-0 rounded-xl">
            <Plus className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

function TimerManager() {
  const createSession = useCreateStudySession();
  const [activeTab, setActiveTab] = useState("pomodoro");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [manualMinutes, setManualMinutes] = useState("60");

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            if (!isBreak) {
              // Log pomodoro
              createSession.mutate({ data: { durationMinutes: 25, source: 'pomodoro' } });
              setIsBreak(true);
              return 5 * 60; // 5 min break
            } else {
              setIsBreak(false);
              return 25 * 60; // back to work
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (isRunning) {
      clearInterval(timerRef.current!);
      setIsRunning(false);
    }
  };

  const resetTimer = () => {
    stopTimer();
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(manualMinutes);
    if (!isNaN(mins) && mins > 0) {
      createSession.mutate({ data: { durationMinutes: mins, source: 'manual' } }, {
        onSuccess: () => setManualMinutes("60")
      });
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <Card className="flex flex-col h-[600px] border-2 shadow-sm">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-orange-500" />
          Focus Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-6 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
            <TabsTrigger value="manual">Manual Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pomodoro" className="flex-1 flex flex-col items-center justify-center mt-0">
            <div className={`w-64 h-64 rounded-full border-8 flex flex-col items-center justify-center mb-8 transition-colors ${isBreak ? 'border-green-500 bg-green-500/5' : 'border-primary bg-primary/5'}`}>
              <span className={`text-sm font-bold uppercase tracking-widest mb-2 ${isBreak ? 'text-green-500' : 'text-primary'}`}>
                {isBreak ? 'Break' : 'Focus'}
              </span>
              <span className="text-6xl font-extrabold tabular-nums tracking-tighter">
                {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex gap-4">
              <Button size="lg" className={`w-32 rounded-xl text-lg h-14 ${isRunning ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`} onClick={isRunning ? stopTimer : startTimer}>
                {isRunning ? <Square className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button size="lg" variant="outline" className="w-32 rounded-xl text-lg h-14" onClick={resetTimer}>
                Reset
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="flex-1 flex flex-col justify-center mt-0">
            <div className="bg-muted/30 p-8 rounded-3xl border text-center space-y-6 max-w-sm mx-auto w-full">
              <Timer className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-2">
                <h3 className="font-bold text-xl">Log offline study</h3>
                <p className="text-sm text-muted-foreground">Add minutes you studied without the timer.</p>
              </div>
              <form onSubmit={handleManualLog} className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Input 
                    type="number" 
                    min="1"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                    className="w-24 text-center text-2xl font-bold h-14 rounded-xl"
                  />
                  <span className="text-muted-foreground font-medium">minutes</span>
                </div>
                <Button type="submit" size="lg" className="w-full rounded-xl" disabled={createSession.isPending}>
                  {createSession.isPending ? "Logging..." : "Log Session"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}