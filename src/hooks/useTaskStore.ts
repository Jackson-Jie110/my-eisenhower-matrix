import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { QuadrantId, Task } from "../types";

type TaskStore = {
  tasks: Task[];
  addTask: (title: string, context?: string) => void;
  updateTaskQuadrant: (taskId: string, quadrantId: QuadrantId | null) => void;
  toggleTaskCompletion: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  importTasks: (tasks: Task[]) => void;
};

const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
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

        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }));
      },
      updateTaskQuadrant: (taskId, quadrantId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, quadrantId } : task
          ),
        }));
      },
      toggleTaskCompletion: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, isCompleted: !task.isCompleted }
              : task
          ),
        }));
      },
      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
        }));
      },
      importTasks: (tasks) => {
        set({ tasks });
      },
    }),
    {
      name: "flat-matrix-storage",
    }
  )
);

export default useTaskStore;
