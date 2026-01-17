import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

import type { QuadrantId, Task } from "../types";

type TaskStore = {
  currentDate: string;
  tasks: Task[];
  addTask: (title: string, context?: string) => void;
  updateTaskQuadrant: (taskId: string, quadrantId: QuadrantId | null) => void;
  toggleTaskCompletion: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  importTasks: (tasks: Task[]) => void;
  clearAllTasks: () => void;
  loadTasksByDate: (date: string) => void;
  checkYesterdayIncomplete: () => Task[];
  snoozeTask: (task: Task, currentDate: string) => void;
  migrateIncompleteTasks: (fromDate: string, toDate: string) => number;
  reorderTask: (taskId: string, oldIndex: number, newIndex: number) => void;
  softDeleteArchive: (date: string) => void;
  restoreArchive: (date: string) => void;
  permanentlyDeleteArchive: (date: string) => void;
  emptyRecycleBin: () => void;
};

const STORAGE_PREFIX = "tasks_";
const RECYCLE_PREFIX = "recycle_";
const LEGACY_KEY = "tasks";
const PERSIST_KEY = "flat-matrix-storage";

const getStorageKey = (date: string) => `${STORAGE_PREFIX}${date}`;
const getRecycleKey = (date: string) => `${RECYCLE_PREFIX}${date}`;

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

const saveTasks = (date: string, tasks: Task[]) => {
  localStorage.setItem(getStorageKey(date), JSON.stringify(tasks));
};

const migrateLegacyTasks = (today: string) => {
  const todayKey = getStorageKey(today);
  if (localStorage.getItem(todayKey)) {
    return;
  }

  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    localStorage.setItem(todayKey, legacy);
    localStorage.removeItem(LEGACY_KEY);
    return;
  }

  const persisted = localStorage.getItem(PERSIST_KEY);
  if (persisted) {
    const tasks = parseTasks(persisted);
    if (tasks.length > 0) {
      localStorage.setItem(todayKey, JSON.stringify(tasks));
    }
  }
};

const resolveDate = (date?: string) => {
  const target = date ? dayjs(date) : dayjs();
  return target.isValid()
    ? target.format("YYYY-MM-DD")
    : dayjs().format("YYYY-MM-DD");
};

const initializeStore = () => {
  const today = resolveDate();
  if (typeof window !== "undefined") {
    migrateLegacyTasks(today);
    return {
      currentDate: today,
      tasks: parseTasks(localStorage.getItem(getStorageKey(today))),
    };
  }

  return {
    currentDate: today,
    tasks: [] as Task[],
  };
};

const initialState = initializeStore();

const useTaskStore = create<TaskStore>((set, get) => ({
  currentDate: initialState.currentDate,
  tasks: initialState.tasks,
  addTask: (title, context) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const trimmedContext = context?.trim();
    const newTask: Task = {
      id: uuidv4(),
      title: trimmedTitle,
      context: trimmedContext ? trimmedContext : undefined,
      quadrantId: null,
      isCompleted: false,
      createdAt: Date.now(),
    };

    set((state) => {
      const updated = [newTask, ...state.tasks];
      if (typeof window !== "undefined") {
        saveTasks(state.currentDate, updated);
      }
      return { tasks: updated };
    });
  },
  updateTaskQuadrant: (taskId, quadrantId) => {
    set((state) => {
      const updated = state.tasks.map((task) =>
        task.id === taskId ? { ...task, quadrantId } : task
      );
      if (typeof window !== "undefined") {
        saveTasks(state.currentDate, updated);
      }
      return { tasks: updated };
    });
  },
  toggleTaskCompletion: (taskId) => {
    set((state) => {
      const updated = state.tasks.map((task) =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      );
      if (typeof window !== "undefined") {
        saveTasks(state.currentDate, updated);
      }
      return { tasks: updated };
    });
  },
  deleteTask: (taskId) => {
    set((state) => {
      const updated = state.tasks.filter((task) => task.id !== taskId);
      if (typeof window !== "undefined") {
        saveTasks(state.currentDate, updated);
      }
      return { tasks: updated };
    });
  },
  importTasks: (tasks) => {
    set((state) => {
      const updated = [...tasks, ...state.tasks];
      if (typeof window !== "undefined") {
        saveTasks(state.currentDate, updated);
      }
      return { tasks: updated };
    });
  },
  clearAllTasks: () => {
    set((state) => {
      if (typeof window !== "undefined") {
        saveTasks(state.currentDate, []);
      }
      return { tasks: [] };
    });
  },
  loadTasksByDate: (date) => {
    const nextDate = resolveDate(date);
    if (typeof window !== "undefined") {
      const { currentDate, tasks } = get();
      saveTasks(currentDate, tasks);
      const nextTasks = parseTasks(localStorage.getItem(getStorageKey(nextDate)));
      set({ currentDate: nextDate, tasks: nextTasks });
      return;
    }
    set({ currentDate: nextDate, tasks: [] });
  },
  checkYesterdayIncomplete: () => {
    if (typeof window === "undefined") {
      return [];
    }
    const currentDate = get().currentDate;
    const yesterday = dayjs(currentDate).subtract(1, "day").format("YYYY-MM-DD");
    const tasks = parseTasks(localStorage.getItem(getStorageKey(yesterday)));
    return tasks.filter((task) => !task.isCompleted);
  },
  snoozeTask: (task, currentDate) => {
    if (typeof window === "undefined") {
      return;
    }
    const todayKey = resolveDate(currentDate);
    const tomorrow = dayjs(todayKey).add(1, "day").format("YYYY-MM-DD");

    set((state) => {
      const updatedToday = state.tasks.filter((item) => item.id !== task.id);
      const tomorrowTasks = parseTasks(localStorage.getItem(getStorageKey(tomorrow)));
      const updatedTomorrow = [...tomorrowTasks, { ...task }];

      saveTasks(todayKey, updatedToday);
      saveTasks(tomorrow, updatedTomorrow);

      return { tasks: updatedToday };
    });
  },
  migrateIncompleteTasks: (fromDate, toDate) => {
    if (typeof window === "undefined") {
      return 0;
    }
    const sourceDate = resolveDate(fromDate);
    const targetDate = resolveDate(toDate);

    const sourceTasks = parseTasks(
      localStorage.getItem(getStorageKey(sourceDate))
    );
    const incomplete = sourceTasks.filter((task) => !task.isCompleted);
    if (incomplete.length === 0) {
      return 0;
    }

    const remaining = sourceTasks.filter((task) => task.isCompleted);
    const targetTasks = parseTasks(
      localStorage.getItem(getStorageKey(targetDate))
    );
    const updatedTarget = [...targetTasks, ...incomplete];

    saveTasks(sourceDate, remaining);
    saveTasks(targetDate, updatedTarget);

    const { currentDate } = get();
    if (currentDate === sourceDate) {
      set({ tasks: remaining });
    } else if (currentDate === targetDate) {
      set({ tasks: updatedTarget });
    }

    return incomplete.length;
  },
  reorderTask: (taskId, oldIndex, newIndex) => {
    set((state) => {
      const target = state.tasks.find((task) => task.id === taskId);
      if (!target) {
        return state;
      }

      const targetQuadrant = target.quadrantId ?? null;
      const quadrantTasks = state.tasks.filter(
        (task) => task.quadrantId === targetQuadrant
      );

      if (
        oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= quadrantTasks.length ||
        newIndex >= quadrantTasks.length ||
        oldIndex === newIndex
      ) {
        return state;
      }

      const reordered = [...quadrantTasks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      let cursor = 0;
      const updated = state.tasks.map((task) => {
        if (task.quadrantId === targetQuadrant) {
          const nextTask = reordered[cursor];
          cursor += 1;
          return nextTask;
        }
        return task;
      });

      if (typeof window !== "undefined") {
        saveTasks(state.currentDate, updated);
      }

      return { tasks: updated };
    });
  },
  softDeleteArchive: (date) => {
    if (typeof window === "undefined") {
      return;
    }
    const targetDate = resolveDate(date);
    const sourceKey = getStorageKey(targetDate);
    const recycleKey = getRecycleKey(targetDate);
    const payload = localStorage.getItem(sourceKey);
    if (!payload) {
      return;
    }
    localStorage.setItem(recycleKey, payload);
    localStorage.removeItem(sourceKey);

    if (get().currentDate === targetDate) {
      set({ tasks: [] });
    }
  },
  restoreArchive: (date) => {
    if (typeof window === "undefined") {
      return;
    }
    const targetDate = resolveDate(date);
    const recycleKey = getRecycleKey(targetDate);
    const payload = localStorage.getItem(recycleKey);
    if (!payload) {
      return;
    }
    localStorage.setItem(getStorageKey(targetDate), payload);
    localStorage.removeItem(recycleKey);
  },
  permanentlyDeleteArchive: (date) => {
    if (typeof window === "undefined") {
      return;
    }
    const targetDate = resolveDate(date);
    localStorage.removeItem(getRecycleKey(targetDate));
  },
  emptyRecycleBin: () => {
    if (typeof window === "undefined") {
      return;
    }
    Object.keys(localStorage)
      .filter((key) => key.startsWith(RECYCLE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  },
}));

export default useTaskStore;
