import React from "react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import confetti from "canvas-confetti";

import useTaskStore from "../hooks/useTaskStore";
import type { QuadrantId, Task } from "../types";
import { MatrixGrid } from "../components/Matrix/MatrixGrid";
import { TaskCard } from "../components/Task/TaskCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { ParticlesBackground } from "../components/ui/ParticlesBackground";
import { cn } from "../lib/utils";

const pageMotion = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 1.1, transition: { duration: 0.3 } },
};

const BACKLOG_ID = "backlog";
const quadrantIds: QuadrantId[] = ["q1", "q2", "q3", "q4"];

const isQuadrantId = (value: string): value is QuadrantId =>
  quadrantIds.includes(value as QuadrantId);

const buildOverlayTask = (task: Task) => (
  <Card className="w-64 border border-glass-border bg-glass-100 text-white backdrop-blur-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-semibold text-slate-100",
            task.isCompleted && "line-through"
          )}
        >
          {task.title}
        </p>
        {task.context ? (
          <p
            className={cn(
              "mt-1 text-xs text-slate-300",
              task.isCompleted && "line-through"
            )}
          >
            {task.context}
          </p>
        ) : null}
      </div>
    </div>
  </Card>
);

function BacklogPanel({ tasks }: { tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: BACKLOG_ID });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-glass-border bg-glass-100 p-4 backdrop-blur-md transition-all",
        isOver && "border-white/40 bg-glass-200"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">待办任务池</h2>
        <span className="text-xs text-slate-400">{tasks.length} 项</span>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="text-xs text-slate-400">暂无待办任务</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </section>
  );
}

const getGreeting = () => {
  const hour = dayjs().hour();
  if (hour >= 5 && hour <= 11) {
    return "早安，元气满满的一天 ☀️";
  }
  if (hour >= 12 && hour <= 18) {
    return "下午好，保持专注 ☕";
  }
  return "晚上好，把烦恼留给明天 🌙";
};

export default function MatrixPage() {
  const params = useParams();
  const navigate = useNavigate();

  const tasks = useTaskStore((state) => state.tasks);
  const currentDate = useTaskStore((state) => state.currentDate);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTaskQuadrant = useTaskStore((state) => state.updateTaskQuadrant);
  const clearAllTasks = useTaskStore((state) => state.clearAllTasks);
  const loadTasksByDate = useTaskStore((state) => state.loadTasksByDate);
  const checkYesterdayIncomplete = useTaskStore(
    (state) => state.checkYesterdayIncomplete
  );
  const importTasks = useTaskStore((state) => state.importTasks);

  const [title, setTitle] = React.useState("");
  const [context, setContext] = React.useState("");
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);
  const [carryOverTasks, setCarryOverTasks] = React.useState<Task[]>([]);
  const [showCarryOver, setShowCarryOver] = React.useState(false);
  const [hasPrompted, setHasPrompted] = React.useState(false);

  const prevIncompleteCount = React.useRef(0);

  const resolvedDate = React.useMemo(() => {
    const dateParam = params.date;
    if (dateParam && dayjs(dateParam, "YYYY-MM-DD", true).isValid()) {
      return dayjs(dateParam).format("YYYY-MM-DD");
    }
    return dayjs().format("YYYY-MM-DD");
  }, [params.date]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const backlogTasks = React.useMemo(
    () => tasks.filter((task) => task.quadrantId == null),
    [tasks]
  );

  const activeTask = React.useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [tasks, activeTaskId]
  );

  React.useEffect(() => {
    loadTasksByDate(resolvedDate);
    setHasPrompted(false);
    setShowCarryOver(false);
    setCarryOverTasks([]);
  }, [loadTasksByDate, resolvedDate]);

  const isToday = resolvedDate === dayjs().format("YYYY-MM-DD");

  React.useEffect(() => {
    if (!isToday || hasPrompted) {
      return;
    }
    if (tasks.length > 0) {
      setHasPrompted(true);
      return;
    }
    const pending = checkYesterdayIncomplete();
    if (pending.length > 0) {
      setCarryOverTasks(pending);
      setShowCarryOver(true);
    }
    setHasPrompted(true);
  }, [checkYesterdayIncomplete, hasPrompted, isToday, tasks.length]);

  React.useEffect(() => {
    const incompleteCount = tasks.filter((task) => !task.isCompleted).length;
    if (
      prevIncompleteCount.current > 0 &&
      incompleteCount === 0 &&
      tasks.length > 0
    ) {
      confetti({ particleCount: 150, spread: 60, origin: { y: 0.6 } });
    }
    prevIncompleteCount.current = incompleteCount;
  }, [tasks]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addTask(title, context);
    setTitle("");
    setContext("");
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTaskId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTaskId(null);
    if (!over) {
      return;
    }

    const overId = String(over.id);
    const activeId = String(active.id);

    if (overId === BACKLOG_ID) {
      updateTaskQuadrant(activeId, null);
      return;
    }

    if (isQuadrantId(overId)) {
      updateTaskQuadrant(activeId, overId);
    }
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      "确定要清空所有任务吗？此操作不可恢复。"
    );
    if (!confirmed) {
      return;
    }
    clearAllTasks();
  };

  const handleCarryOverConfirm = () => {
    importTasks(carryOverTasks);
    setShowCarryOver(false);
  };

  return (
    <motion.div
      variants={pageMotion}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative min-h-screen overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <ParticlesBackground />
      </div>
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => navigate("/archive")}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              返回
            </button>
            <h1 className="text-2xl font-semibold text-white">
              {getGreeting()}
            </h1>
            <p className="text-sm text-slate-400">{currentDate}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearAll}
              className="flex items-center gap-2 border border-glass-border text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              清空
            </Button>
          </div>
        </header>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveTaskId(null)}
        >
          <form
            onSubmit={handleSubmit}
            className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <Input
              placeholder="输入任务标题..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Input
              placeholder="补充备注（可选）..."
              value={context}
              onChange={(event) => setContext(event.target.value)}
            />
            <div className="flex flex-col gap-3 md:flex-row">
              <Button type="submit" variant="primary">
                添加任务
              </Button>
            </div>
          </form>

          <BacklogPanel tasks={backlogTasks} />

          <MatrixGrid />

          <DragOverlay>
            {activeTask ? buildOverlayTask(activeTask) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showCarryOver ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-glass-border bg-slate-900/90 p-6 text-white backdrop-blur-xl">
            <h2 className="text-lg font-semibold">昨日任务未完成</h2>
            <p className="mt-2 text-sm text-slate-300">
              昨天还有 {carryOverTasks.length} 个任务未完成，要带到今天吗？
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="primary"
                onClick={handleCarryOverConfirm}
              >
                导入任务
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCarryOver(false)}
              >
                以后再说
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}