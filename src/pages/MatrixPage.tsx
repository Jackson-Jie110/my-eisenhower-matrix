import React from "react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { ChevronLeft, Keyboard, ListEnd, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import confetti from "canvas-confetti";

import useTaskStore from "../hooks/useTaskStore";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import type { QuadrantId, Task } from "../types";
import { MatrixGrid } from "../components/Matrix/MatrixGrid";
import { TaskCard } from "../components/Task/TaskCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmModal } from "../components/ui/ConfirmModal";
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

const parseTasks = (raw: string | null) => {
  if (!raw) {
    return [] as Task[];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as Task[];
    }
  } catch {
    return [] as Task[];
  }
  return [] as Task[];
};

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

function BacklogPanel({
  tasks,
  onRequestDelete,
  onRequestSnooze,
  selectedTaskId,
}: {
  tasks: Task[];
  onRequestDelete: (task: Task) => void;
  onRequestSnooze: (task: Task) => void;
  selectedTaskId?: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: BACKLOG_ID });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "min-h-[120px] rounded-xl border border-glass-border bg-glass-100 p-4 backdrop-blur-md transition-all",
        isOver && "border-white/40 bg-glass-200"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">待办任务池</h2>
        <span className="text-xs text-slate-400">{tasks.length} 项</span>
      </div>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-400">暂无待办任务</p>
          ) : (
            tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                totalInQuadrant={tasks.length}
                containerId={BACKLOG_ID}
                onRequestDelete={onRequestDelete}
                onRequestSnooze={onRequestSnooze}
                isSelected={task.id === selectedTaskId}
              />
            ))
          )}
        </div>
      </SortableContext>
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
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const snoozeTask = useTaskStore((state) => state.snoozeTask);
  const reorderTask = useTaskStore((state) => state.reorderTask);
  const clearAllTasks = useTaskStore((state) => state.clearAllTasks);
  const loadTasksByDate = useTaskStore((state) => state.loadTasksByDate);
  const importTasks = useTaskStore((state) => state.importTasks);
  const migrateIncompleteTasks = useTaskStore(
    (state) => state.migrateIncompleteTasks
  );

  const [title, setTitle] = React.useState("");
  const [context, setContext] = React.useState("");
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [showMigrationModal, setShowMigrationModal] = React.useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = React.useState(false);
  const [yesterdayTasks, setYesterdayTasks] = React.useState<Task[]>([]);
  const [pendingTaskAction, setPendingTaskAction] = React.useState<{
    type: "delete" | "migrate";
    task: Task;
  } | null>(null);

  const prevIncompleteCount = React.useRef(0);
  const migrationCheckedDate = React.useRef<string | null>(null);
  const titleInputRef = React.useRef<HTMLInputElement | null>(null);

  const resolvedDate = React.useMemo(() => {
    const dateParam = params.date;
    if (dateParam && dayjs(dateParam, "YYYY-MM-DD", true).isValid()) {
      return dayjs(dateParam).format("YYYY-MM-DD");
    }
    return dayjs().format("YYYY-MM-DD");
  }, [params.date]);

  console.warn("⚡️ [MatrixPage] Component Rendered. Route Date:", resolvedDate);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const isConfirmSuppressed = React.useCallback((featureKey: string) => {
    if (typeof window === "undefined") {
      return false;
    }
    const raw = localStorage.getItem(`suppress_confirm_${featureKey}`);
    if (!raw) {
      return false;
    }
    try {
      const parsed = JSON.parse(raw) as { date?: string; suppressed?: boolean };
      return (
        parsed?.suppressed === true &&
        parsed?.date === dayjs().format("YYYY-MM-DD")
      );
    } catch {
      return false;
    }
  }, []);

  const handleEscape = React.useCallback(() => {
    setSelectedTaskId(null);
    if (pendingTaskAction) {
      setPendingTaskAction(null);
      return;
    }
    if (showMigrationModal) {
      setShowMigrationModal(false);
      setYesterdayTasks([]);
      return;
    }
    if (showShortcutHelp) {
      setShowShortcutHelp(false);
    }
  }, [pendingTaskAction, showMigrationModal, showShortcutHelp]);

  const backlogTasks = React.useMemo(
    () => tasks.filter((task) => task.quadrantId == null),
    [tasks]
  );

  const activeTask = React.useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [tasks, activeTaskId]
  );

  const handleSelectTask = React.useCallback(
    (index: number) => {
      if (showMigrationModal || pendingTaskAction || showShortcutHelp) {
        return;
      }
      const target = backlogTasks[index - 1];
      if (!target) {
        return;
      }
      setSelectedTaskId(target.id);
    },
    [backlogTasks, pendingTaskAction, showMigrationModal, showShortcutHelp]
  );

  const handleMoveTask = React.useCallback(
    (quadrantId: QuadrantId) => {
      if (showMigrationModal || pendingTaskAction || showShortcutHelp) {
        return;
      }
      if (!selectedTaskId) {
        return;
      }
      updateTaskQuadrant(selectedTaskId, quadrantId);
      setSelectedTaskId(null);
    },
    [
      pendingTaskAction,
      selectedTaskId,
      showMigrationModal,
      showShortcutHelp,
      updateTaskQuadrant,
    ]
  );

  React.useEffect(() => {
    if (!selectedTaskId) {
      return;
    }
    const selectedTask = tasks.find((task) => task.id === selectedTaskId);
    if (!selectedTask || selectedTask.quadrantId !== null) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskId, tasks]);

  React.useEffect(() => {
    loadTasksByDate(resolvedDate);
    setShowMigrationModal(false);
    setYesterdayTasks([]);
    setPendingTaskAction(null);
    setSelectedTaskId(null);
    setShowShortcutHelp(false);
  }, [loadTasksByDate, resolvedDate]);

  React.useEffect(() => {
    const currentFormat = dayjs(resolvedDate).format("YYYY-MM-DD");
    const yesterdayFormat = dayjs(resolvedDate)
      .subtract(1, "day")
      .format("YYYY-MM-DD");

    const currentKey = `tasks_${currentFormat}`;
    const yesterdayKey = `tasks_${yesterdayFormat}`;
    const promptKey = `migration_prompted_${currentFormat}`;

    console.warn(`🔍 [Migration Check] Start. Today: ${currentKey}`);

    if (localStorage.getItem(promptKey) === "true") {
      console.warn("🛑 [Migration] Already handled by user today. Skip.");
      return;
    }

    const yesterdayJson = localStorage.getItem(yesterdayKey);

    if (yesterdayJson) {
      try {
        const prevTasks = JSON.parse(yesterdayJson) as Task[];
        const incomplete = prevTasks.filter((task) => !task.isCompleted);

        console.warn(
          `📊 [Migration] Yesterday incomplete count: ${incomplete.length}`
        );

        if (incomplete.length > 0) {
          console.warn(
            "✅ [Migration] Incomplete tasks found. SHOWING MODAL (Flag will be set on user interaction)."
          );
          setYesterdayTasks(incomplete);
          setShowMigrationModal(true);
        } else {
          console.warn("🛑 [Migration] Yesterday all done. Skip.");
        }
      } catch (error) {
        console.error("❌ [Migration] JSON Parse Error:", error);
      }
    } else {
      console.warn("🛑 [Migration] No data found for yesterday. Skip.");
    }
  }, [resolvedDate]);

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

    const activeContainer =
      (active.data.current?.containerId as string | undefined) ??
      (isQuadrantId(activeId) ? activeId : BACKLOG_ID);
    const overContainer =
      (over.data.current?.containerId as string | undefined) ??
      (overId === BACKLOG_ID || isQuadrantId(overId) ? overId : undefined);

    if (!overContainer) {
      return;
    }

    if (activeContainer === overContainer) {
      const containerTasks =
        activeContainer === BACKLOG_ID
          ? backlogTasks
          : tasks.filter((task) => task.quadrantId === activeContainer);
      const oldIndex = containerTasks.findIndex((task) => task.id === activeId);
      const newIndex = containerTasks.findIndex((task) => task.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderTask(activeId, oldIndex, newIndex);
      }
      return;
    }

    if (overContainer === BACKLOG_ID) {
      updateTaskQuadrant(activeId, null);
      return;
    }

    if (isQuadrantId(overContainer)) {
      updateTaskQuadrant(activeId, overContainer);
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

  const handleMigrationConfirm = () => {
    if (yesterdayTasks.length > 0) {
      importTasks(yesterdayTasks);
    }
    const currentFormat = dayjs(resolvedDate).format("YYYY-MM-DD");
    localStorage.setItem(`migration_prompted_${currentFormat}`, "true");
    setShowMigrationModal(false);
    setYesterdayTasks([]);
  };

  const handleMigrationCancel = () => {
    const currentFormat = dayjs(resolvedDate).format("YYYY-MM-DD");
    localStorage.setItem(`migration_prompted_${currentFormat}`, "true");
    setShowMigrationModal(false);
    setYesterdayTasks([]);
  };

  const handleTaskConfirm = () => {
    if (!pendingTaskAction) {
      return;
    }
    if (pendingTaskAction.type === "delete") {
      deleteTask(pendingTaskAction.task.id);
    } else {
      snoozeTask(pendingTaskAction.task, currentDate);
    }
    setPendingTaskAction(null);
  };

  const handleTaskCancel = () => {
    setPendingTaskAction(null);
  };

  const requestTaskDelete = (task: Task) => {
    if (isConfirmSuppressed("delete_task")) {
      deleteTask(task.id);
      return;
    }
    setPendingTaskAction({ type: "delete", task });
  };

  const requestTaskSnooze = (task: Task) => {
    if (isConfirmSuppressed("migrate_task")) {
      snoozeTask(task, currentDate);
      return;
    }
    setPendingTaskAction({ type: "migrate", task });
  };

  const handleFocusBacklog = React.useCallback(() => {
    if (showMigrationModal || pendingTaskAction || showShortcutHelp) {
      return;
    }
    if (typeof document !== "undefined") {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
    } else {
      titleInputRef.current?.blur();
    }
    const firstTask = backlogTasks[0];
    if (firstTask) {
      setSelectedTaskId(firstTask.id);
    }
  }, [backlogTasks, pendingTaskAction, showMigrationModal, showShortcutHelp]);

  const handleDeleteSelected = React.useCallback(() => {
    if (showMigrationModal || pendingTaskAction || showShortcutHelp) {
      return;
    }
    if (!selectedTaskId) {
      return;
    }
    const target = backlogTasks.find((task) => task.id === selectedTaskId);
    if (!target) {
      return;
    }
    requestTaskDelete(target);
    setSelectedTaskId(null);
  }, [
    backlogTasks,
    pendingTaskAction,
    requestTaskDelete,
    selectedTaskId,
    showMigrationModal,
    showShortcutHelp,
  ]);

  useKeyboardShortcuts({
    inputRef: titleInputRef,
    onEscape: handleEscape,
    onSelectTask: handleSelectTask,
    onMoveTask: handleMoveTask,
    onFocusBacklog: handleFocusBacklog,
    onDelete: handleDeleteSelected,
  });

  const confirmTitle =
    pendingTaskAction?.type === "delete" ? "删除任务" : "推迟任务";
  const confirmMessage = pendingTaskAction
    ? pendingTaskAction.type === "delete"
      ? `确定删除“${pendingTaskAction.task.title}”吗？此操作不可恢复。`
      : `确定将“${pendingTaskAction.task.title}”推迟到明天吗？`
    : "";
  const confirmText =
    pendingTaskAction?.type === "delete" ? "删除" : "迁移";
  const confirmFeatureKey =
    pendingTaskAction?.type === "delete" ? "delete_task" : "migrate_task";

  const handleMigrateAllToTomorrow = () => {
    const confirmed = window.confirm(
      "确定将今日所有未完成任务推迟到明天吗？"
    );
    if (!confirmed) {
      return;
    }

    const tomorrow = dayjs(currentDate).add(1, "day").format("YYYY-MM-DD");
    const movedCount = migrateIncompleteTasks(currentDate, tomorrow);

    if (movedCount > 0) {
      window.alert(`成功将 ${movedCount} 个任务移动到明天`);
      loadTasksByDate(currentDate);
    } else {
      window.alert("今日暂无待办任务");
    }
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
              onClick={() => setShowShortcutHelp(true)}
              className="flex items-center gap-2 border border-glass-border text-slate-200 hover:bg-white/10"
            >
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">快捷键</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleMigrateAllToTomorrow}
              className="flex items-center gap-2 border border-glass-border text-slate-200 hover:bg-white/10"
            >
              <ListEnd className="h-4 w-4" />
              <span className="hidden sm:inline">一键迁移</span>
            </Button>
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
          collisionDetection={pointerWithin}
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
              ref={titleInputRef}
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

          <BacklogPanel
            tasks={backlogTasks}
            onRequestDelete={requestTaskDelete}
            onRequestSnooze={requestTaskSnooze}
            selectedTaskId={selectedTaskId}
          />

          <MatrixGrid
            onRequestDelete={requestTaskDelete}
            onRequestSnooze={requestTaskSnooze}
            selectedTaskId={selectedTaskId}
          />

          <DragOverlay>
            {activeTask ? buildOverlayTask(activeTask) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <ConfirmModal
        isOpen={Boolean(pendingTaskAction)}
        onConfirm={handleTaskConfirm}
        onCancel={handleTaskCancel}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmText}
        isDanger={pendingTaskAction?.type === "delete"}
        featureKey={confirmFeatureKey}
      />

      {showShortcutHelp ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShortcutHelp(false)}
            role="presentation"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-glass-border bg-slate-900/90 p-6 text-white backdrop-blur-xl">
            <h2 className="text-lg font-semibold">快捷键</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <span className="font-semibold text-white">1-9</span>
                {" "}??????
              </li>
              <li>
                <span className="font-semibold text-white">Alt + 1</span>
                {" "}???????? 1 ??
              </li>
              <li>
                <span className="font-semibold text-white">Q/W/E/R</span>
                {" "}??????
              </li>
              <li>
                <span className="font-semibold text-white">Delete/Backspace</span>
                {" "}??????
              </li>
              <li>
                <span className="font-semibold text-white">Enter</span>
                {" "}?????
              </li>
              <li>
                <span className="font-semibold text-white">Esc</span>
                {" "}??/??
              </li>
            </ul>
            <div className="mt-6 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setShowShortcutHelp(false)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showMigrationModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-glass-border bg-slate-900/90 p-6 text-white backdrop-blur-xl">
            <h2 className="text-lg font-semibold">昨日任务未完成</h2>
            <p className="mt-2 text-sm text-slate-300">
              检测到昨天有 {yesterdayTasks.length} 个任务没做完，需要帮你带到今天吗？
            </p>
            <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">
              {yesterdayTasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                >
                  <p className="text-sm text-slate-100">{task.title}</p>
                  {task.context ? (
                    <p className="mt-1 text-xs text-slate-400">
                      {task.context}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="primary"
                onClick={handleMigrationConfirm}
              >
                确认迁移
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleMigrationCancel}
              >
                重新开始
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
