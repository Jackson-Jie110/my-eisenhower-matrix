import React from "react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { ChevronLeft, Keyboard, ListEnd, RotateCcw, Trash2 } from "lucide-react";
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
const MIGRATION_PREFERENCE_KEY = "migration_preference";
const DELETED_TASKS_KEY = "deleted_tasks_v1";
const MAX_DELETED_TASKS = 200;
const quadrantIds: QuadrantId[] = ["q1", "q2", "q3", "q4"];

type MigrationPreference = "import" | "skip";
type DeletedTaskEntry = {
  task: Task;
  sourceDate: string;
  deletedAt: number;
};

const isQuadrantId = (value: string): value is QuadrantId =>
  quadrantIds.includes(value as QuadrantId);

const parseTasks = (raw: string | null): Task[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as Task[];
    }
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as { state?: { tasks?: Task[] } }).state?.tasks)
    ) {
      return (parsed as { state: { tasks: Task[] } }).state.tasks;
    }
  } catch {
    return [];
  }
  return [];
};

const parseDeletedTaskEntries = (raw: string | null): DeletedTaskEntry[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as DeletedTaskEntry[];
    }
  } catch {
    return [];
  }
  return [];
};

function BacklogPanel({
  tasks,
  onRequestDelete,
  onRequestSnooze,
  selectedTaskId,
  isFiltering,
}: {
  tasks: Task[];
  onRequestDelete: (task: Task) => void;
  onRequestSnooze: (task: Task) => void;
  selectedTaskId?: string | null;
  isFiltering?: boolean;
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
            <p className="text-xs text-slate-400">{isFiltering ? "\u672a\u627e\u5230\u5339\u914d\u4efb\u52a1" : "\u6682\u65e0\u5f85\u529e\u4efb\u52a1"}</p>
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
                isDragDisabled={Boolean(isFiltering)}
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
  const [activeTaskWidth, setActiveTaskWidth] = React.useState<number | null>(
    null
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "completed"
  >("all");
  const [quadrantFilter, setQuadrantFilter] = React.useState<
    "all" | "backlog" | QuadrantId
  >("all");
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [showMigrationModal, setShowMigrationModal] = React.useState(false);
  const [rememberMigrationChoice, setRememberMigrationChoice] =
    React.useState(false);
  const [migrationPreference, setMigrationPreference] =
    React.useState<MigrationPreference | null>(null);
  const [showShortcutHelp, setShowShortcutHelp] = React.useState(false);
  const [yesterdayTasks, setYesterdayTasks] = React.useState<Task[]>([]);
  const [pendingTaskAction, setPendingTaskAction] = React.useState<{
    type: "delete" | "migrate";
    task: Task;
  } | null>(null);
  const [deletedTaskEntries, setDeletedTaskEntries] = React.useState<
    DeletedTaskEntry[]
  >([]);
  const [showDeletedTasksModal, setShowDeletedTasksModal] = React.useState(false);
  const [showAllDeletedTasks, setShowAllDeletedTasks] = React.useState(false);
  const [undoDeleteEntry, setUndoDeleteEntry] = React.useState<
    DeletedTaskEntry | null
  >(null);

  const prevIncompleteCount = React.useRef(0);
  const migrationCheckedDate = React.useRef<string | null>(null);
  const titleInputRef = React.useRef<HTMLInputElement | null>(null);
  const undoTimerRef = React.useRef<number | null>(null);

  const handleResetFilters = React.useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setQuadrantFilter("all");
  }, []);

  const readMigrationPreference = React.useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const raw = localStorage.getItem(MIGRATION_PREFERENCE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as { action?: MigrationPreference };
      if (parsed?.action === "import" || parsed?.action === "skip") {
        return parsed.action;
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  const saveMigrationPreference = React.useCallback(
    (action: MigrationPreference) => {
      if (typeof window === "undefined") {
        return;
      }
      localStorage.setItem(
        MIGRATION_PREFERENCE_KEY,
        JSON.stringify({ action })
      );
      setMigrationPreference(action);
    },
    []
  );

  const clearMigrationPreference = React.useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.removeItem(MIGRATION_PREFERENCE_KEY);
    setMigrationPreference(null);
  }, []);

  React.useEffect(() => {
    setMigrationPreference(readMigrationPreference());
  }, [readMigrationPreference]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setDeletedTaskEntries(
      parseDeletedTaskEntries(localStorage.getItem(DELETED_TASKS_KEY))
    );
  }, []);

  React.useEffect(() => {
    return () => {
      if (typeof window === "undefined") {
        return;
      }
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

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

  const persistDeletedTaskEntries = React.useCallback(
    (updater: (prev: DeletedTaskEntry[]) => DeletedTaskEntry[]) => {
      setDeletedTaskEntries((prev) => {
        const next = updater(prev);
        if (typeof window !== "undefined") {
          localStorage.setItem(DELETED_TASKS_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    []
  );

  const removeDeletedTaskEntry = React.useCallback(
    (entry: DeletedTaskEntry) => {
      persistDeletedTaskEntries((prev) =>
        prev.filter(
          (item) =>
            !(item.task.id === entry.task.id && item.deletedAt === entry.deletedAt)
        )
      );
    },
    [persistDeletedTaskEntries]
  );

  const restoreDeletedTaskEntry = React.useCallback(
    (entry: DeletedTaskEntry) => {
      if (typeof window === "undefined") {
        return;
      }

      removeDeletedTaskEntry(entry);

      if (entry.sourceDate === currentDate) {
        if (!tasks.some((task) => task.id === entry.task.id)) {
          importTasks([entry.task]);
        }
        return;
      }

      const storageKey = `tasks_${entry.sourceDate}`;
      const existingTasks = parseTasks(localStorage.getItem(storageKey));
      if (existingTasks.some((task) => task.id === entry.task.id)) {
        return;
      }
      localStorage.setItem(
        storageKey,
        JSON.stringify([entry.task, ...existingTasks])
      );
    },
    [currentDate, importTasks, removeDeletedTaskEntry, tasks]
  );

  const performTaskDelete = React.useCallback(
    (task: Task) => {
      const entry: DeletedTaskEntry = {
        task,
        sourceDate: currentDate,
        deletedAt: Date.now(),
      };

      persistDeletedTaskEntries((prev) =>
        [entry, ...prev].slice(0, MAX_DELETED_TASKS)
      );

      setUndoDeleteEntry(entry);
      if (typeof window !== "undefined") {
        if (undoTimerRef.current) {
          window.clearTimeout(undoTimerRef.current);
        }
        undoTimerRef.current = window.setTimeout(() => {
          setUndoDeleteEntry(null);
        }, 8000);
      }

      deleteTask(task.id);
    },
    [currentDate, deleteTask, persistDeletedTaskEntries]
  );

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
    if (showDeletedTasksModal) {
      setShowDeletedTasksModal(false);
      return;
    }
    if (showShortcutHelp) {
      setShowShortcutHelp(false);
    }
  }, [pendingTaskAction, showDeletedTasksModal, showMigrationModal, showShortcutHelp]);

  const normalizedQuery = React.useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  );
  const isFiltering =
    normalizedQuery.length > 0 ||
    statusFilter !== "all" ||
    quadrantFilter !== "all";

  const visibleTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      if (normalizedQuery) {
        const haystack = `${task.title} ${task.context ?? ""}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      if (statusFilter === "active" && task.isCompleted) {
        return false;
      }
      if (statusFilter === "completed" && !task.isCompleted) {
        return false;
      }
      if (quadrantFilter === "backlog") {
        return task.quadrantId == null;
      }
      if (quadrantFilter !== "all") {
        return task.quadrantId === quadrantFilter;
      }
      return true;
    });
  }, [normalizedQuery, quadrantFilter, statusFilter, tasks]);

  const backlogTasks = React.useMemo(
    () => visibleTasks.filter((task) => task.quadrantId == null),
    [visibleTasks]
  );

  const activeTask = React.useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [tasks, activeTaskId]
  );

  const handleSelectTask = React.useCallback(
    (index: number) => {
      if (showMigrationModal || pendingTaskAction || showShortcutHelp || showDeletedTasksModal) {
        return;
      }
      const target = backlogTasks[index - 1];
      if (!target) {
        return;
      }
      setSelectedTaskId(target.id);
    },
    [
      backlogTasks,
      pendingTaskAction,
      showDeletedTasksModal,
      showMigrationModal,
      showShortcutHelp,
    ]
  );

  const handleMoveTask = React.useCallback(
    (quadrantId: QuadrantId) => {
      if (showMigrationModal || pendingTaskAction || showShortcutHelp || showDeletedTasksModal) {
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
      showDeletedTasksModal,
      showMigrationModal,
      showShortcutHelp,
      updateTaskQuadrant,
    ]
  );

  React.useEffect(() => {
    if (!selectedTaskId) {
      return;
    }
    const selectedTask = visibleTasks.find((task) => task.id === selectedTaskId);
    if (!selectedTask || selectedTask.quadrantId !== null) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskId, visibleTasks]);

  React.useEffect(() => {
    loadTasksByDate(resolvedDate);
    setShowMigrationModal(false);
    setYesterdayTasks([]);
    setPendingTaskAction(null);
    setSelectedTaskId(null);
    setShowShortcutHelp(false);
    setShowDeletedTasksModal(false);
    setShowAllDeletedTasks(false);
    setUndoDeleteEntry(null);
    if (typeof window !== "undefined" && undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
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

    const preference = readMigrationPreference();
    if (preference === "skip") {
      localStorage.setItem(promptKey, "true");
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
          if (preference === "import") {
            importTasks(incomplete);
            localStorage.setItem(promptKey, "true");
            return;
          }
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
  }, [importTasks, readMigrationPreference, resolvedDate]);

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
    const activeId = String(active.id);
    setActiveTaskId(activeId);
    if (typeof document !== "undefined") {
      const element = document.getElementById(activeId);
      setActiveTaskWidth(element ? element.offsetWidth : null);
    } else {
      setActiveTaskWidth(null);
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTaskId(null);
    setActiveTaskWidth(null);
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
    if (rememberMigrationChoice) {
      saveMigrationPreference("import");
    }
    const currentFormat = dayjs(resolvedDate).format("YYYY-MM-DD");
    localStorage.setItem(`migration_prompted_${currentFormat}`, "true");
    setShowMigrationModal(false);
    setYesterdayTasks([]);
  };

  const handleMigrationCancel = () => {
    if (rememberMigrationChoice) {
      saveMigrationPreference("skip");
    }
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
      performTaskDelete(pendingTaskAction.task);
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
      performTaskDelete(task);
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

  const deletedTasksForCurrentDate = React.useMemo(
    () => deletedTaskEntries.filter((entry) => entry.sourceDate === currentDate),
    [currentDate, deletedTaskEntries]
  );

  const visibleDeletedTaskEntries = React.useMemo(() => {
    return showAllDeletedTasks ? deletedTaskEntries : deletedTasksForCurrentDate;
  }, [deletedTaskEntries, deletedTasksForCurrentDate, showAllDeletedTasks]);

  const handleUndoDelete = React.useCallback(() => {
    if (!undoDeleteEntry) {
      return;
    }
    if (typeof window !== "undefined" && undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    restoreDeletedTaskEntry(undoDeleteEntry);
    setUndoDeleteEntry(null);
  }, [restoreDeletedTaskEntry, undoDeleteEntry]);

  const handleRestoreDeletedEntry = React.useCallback(
    (entry: DeletedTaskEntry) => {
      restoreDeletedTaskEntry(entry);
      setUndoDeleteEntry((prev) =>
        prev && prev.task.id === entry.task.id && prev.deletedAt === entry.deletedAt
          ? null
          : prev
      );
    },
    [restoreDeletedTaskEntry]
  );

  const handlePermanentlyDeleteEntry = React.useCallback(
    (entry: DeletedTaskEntry) => {
      if (typeof window !== "undefined") {
        const confirmed = window.confirm(
          "确定要彻底删除该任务吗？此操作不可恢复。"
        );
        if (!confirmed) {
          return;
        }
      }
      removeDeletedTaskEntry(entry);
      setUndoDeleteEntry((prev) =>
        prev && prev.task.id === entry.task.id && prev.deletedAt === entry.deletedAt
          ? null
          : prev
      );
    },
    [removeDeletedTaskEntry]
  );

  const handleEmptyDeletedTasks = React.useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    const confirmed = window.confirm(
      "确定要清空任务回收站吗？此操作不可恢复。"
    );
    if (!confirmed) {
      return;
    }
    persistDeletedTaskEntries(() => []);
    setUndoDeleteEntry(null);
  }, [persistDeletedTaskEntries]);

  const handleFocusBacklog = React.useCallback(() => {
    if (showMigrationModal || pendingTaskAction || showShortcutHelp || showDeletedTasksModal) {
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
  }, [
    backlogTasks,
    pendingTaskAction,
    showDeletedTasksModal,
    showMigrationModal,
    showShortcutHelp,
  ]);

  const handleDeleteSelected = React.useCallback(() => {
    if (showMigrationModal || pendingTaskAction || showShortcutHelp || showDeletedTasksModal) {
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
    showDeletedTasksModal,
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

  React.useEffect(() => {
    if (!showMigrationModal) {
      setRememberMigrationChoice(false);
    }
  }, [showMigrationModal]);

  const confirmTitle =
    pendingTaskAction?.type === "delete" ? "删除任务" : "推迟任务";
  const confirmMessage: React.ReactNode = pendingTaskAction
    ? pendingTaskAction.type === "delete"
      ? (
          <>
            <p>确定删除“{pendingTaskAction.task.title}”吗？</p>
            <p className="mt-2 text-xs text-slate-400">
              删除后可在“任务回收站”找回，也可以在 8 秒内撤销。
            </p>
          </>
        )
      : `确定将“${pendingTaskAction.task.title}”推迟到明天吗？`
    : null;
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
              variant="ghost"
              onClick={() => setShowDeletedTasksModal(true)}
              className="flex items-center gap-2 border border-glass-border text-slate-200 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">
                任务回收站
                {deletedTasksForCurrentDate.length > 0
                  ? ` (${deletedTasksForCurrentDate.length})`
                  : ""}
              </span>
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
            {migrationPreference ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearMigrationPreference}
                className="flex items-center gap-2 border border-glass-border text-slate-300 hover:bg-white/10"
              >
                {"\u6e05\u9664\u8fc1\u79fb\u504f\u597d"}
              </Button>
            ) : null}
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
          onDragCancel={() => {
            setActiveTaskId(null);
            setActiveTaskWidth(null);
          }}
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

          <section className="flex flex-col gap-3 rounded-xl border border-glass-border bg-glass-100/40 p-3 backdrop-blur-md md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
              <Input
                placeholder={"\u641c\u7d22\u4efb\u52a1/\u5907\u6ce8..."}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="md:max-w-sm border border-white/10 bg-slate-900/80 text-slate-100 placeholder:text-slate-500 backdrop-blur-md"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === "all" ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter("all")}
                  className="border border-glass-border"
                >
                  {"\u5168\u90e8"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === "active" ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter("active")}
                  className="border border-glass-border"
                >
                  {"\u672a\u5b8c\u6210"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === "completed" ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter("completed")}
                  className="border border-glass-border"
                >
                  {"\u5df2\u5b8c\u6210"}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={quadrantFilter}
                onChange={(event) =>
                  setQuadrantFilter(event.target.value as "all" | "backlog" | QuadrantId)
                }
                className="rounded-xl border border-glass-border bg-black/20 px-3 py-2 text-xs text-slate-200 outline-none"
              >
                <option value="all">{"\u6240\u6709\u8c61\u9650"}</option>
                <option value="backlog">{"\u5f85\u529e\u6c60"}</option>
                <option value="q1">Q1</option>
                <option value="q2">Q2</option>
                <option value="q3">Q3</option>
                <option value="q4">Q4</option>
              </select>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleResetFilters}
                className="border border-glass-border"
              >
                {"\u91cd\u7f6e"}
              </Button>
            </div>
          </section>
          {isFiltering ? (
            <p className="text-xs text-slate-400">
              {"\u8fc7\u6ee4\u6a21\u5f0f\u4e0b\u5df2\u7981\u7528\u62d6\u62fd\u6392\u5e8f"}
            </p>
          ) : null}

          <BacklogPanel
            tasks={backlogTasks}
            onRequestDelete={requestTaskDelete}
            onRequestSnooze={requestTaskSnooze}
            selectedTaskId={selectedTaskId}
            isFiltering={isFiltering}
          />

          <MatrixGrid
            tasks={visibleTasks}
            onRequestDelete={requestTaskDelete}
            onRequestSnooze={requestTaskSnooze}
            selectedTaskId={selectedTaskId}
            isDragDisabled={isFiltering}
          />

          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div
                className="opacity-80 cursor-grabbing"
                style={{
                  width: activeTaskWidth ? `${activeTaskWidth}px` : "auto",
                }}
              >
                <TaskCard
                  task={activeTask}
                  index={0}
                  totalInQuadrant={1}
                  containerId={activeTask.quadrantId ?? BACKLOG_ID}
                  onRequestDelete={requestTaskDelete}
                  onRequestSnooze={requestTaskSnooze}
                  isOverlay
                  className="w-full"
                />
              </div>
            ) : null}
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

      {showDeletedTasksModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeletedTasksModal(false)}
            role="presentation"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-glass-border bg-slate-900/90 p-6 text-white backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">任务回收站</h2>
                <p className="mt-1 text-xs text-slate-400">
                  已删除的任务会保存在本地，可随时恢复或彻底删除。
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeletedTasksModal(false)}
              >
                关闭
              </Button>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-white/20 bg-transparent"
                  checked={showAllDeletedTasks}
                  onChange={(event) => setShowAllDeletedTasks(event.target.checked)}
                />
                显示全部日期
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEmptyDeletedTasks}
                className="border border-red-500/30 text-red-200 hover:bg-red-500/10"
              >
                清空回收站
              </Button>
            </div>

            <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {visibleDeletedTaskEntries.length === 0 ? (
                <p className="text-sm text-slate-400">暂无已删除任务</p>
              ) : (
                visibleDeletedTaskEntries.map((entry) => (
                  <div
                    key={`${entry.task.id}_${entry.deletedAt}`}
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-100">
                          {entry.task.title}
                        </p>
                        {entry.task.context ? (
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {entry.task.context}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {entry.sourceDate} ·{" "}
                          {dayjs(entry.deletedAt).format("HH:mm")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreDeletedEntry(entry)}
                        >
                          恢复
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePermanentlyDeleteEntry(entry)}
                          className="border border-red-500/30 text-red-200 hover:bg-red-500/10"
                        >
                          彻底删除
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showShortcutHelp ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShortcutHelp(false)}
            role="presentation"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-glass-border bg-slate-900/90 p-6 text-white backdrop-blur-xl">
            <h2 className="text-lg font-semibold">{"快捷键"}</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <span className="font-semibold text-white">1-9</span>
                {" 选中待办任务"}
              </li>
              <li>
                <span className="font-semibold text-white">Alt + 1</span>
                {" 退出输入并选中第 1 任务"}
              </li>
              <li>
                <span className="font-semibold text-white">Q/W/E/R</span>
                {" 移动至四象限"}
              </li>
              <li>
                <span className="font-semibold text-white">Delete/Backspace</span>
                {" 删除选中任务"}
              </li>
              <li>
                <span className="font-semibold text-white">Enter</span>
                {" 聚焦输入框"}
              </li>
              <li>
                <span className="font-semibold text-white">Esc</span>
                {" 取消/关闭"}
              </li>
            </ul>
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowShortcutHelp(false)}
              >
                {"关闭"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {undoDeleteEntry &&
      !pendingTaskAction &&
      !showShortcutHelp &&
      !showMigrationModal &&
      !showDeletedTasksModal ? (
        <div className="fixed bottom-6 left-1/2 z-50 w-[min(520px,calc(100%-2rem))] -translate-x-1/2 px-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-glass-border bg-slate-900/90 px-4 py-3 text-white backdrop-blur-xl">
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-100">
                已删除：{undoDeleteEntry.task.title}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                可撤销，或在任务回收站找回
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeletedTasksModal(true)}
              >
                回收站
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleUndoDelete}>
                撤销
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
            <label className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-white/20 bg-transparent"
                checked={rememberMigrationChoice}
                onChange={(event) => setRememberMigrationChoice(event.target.checked)}
              />
              {"\u8bb0\u4f4f\u6211\u7684\u9009\u62e9"}
            </label>
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
