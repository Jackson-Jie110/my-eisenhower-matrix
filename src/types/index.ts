export type QuadrantId = "q1" | "q2" | "q3" | "q4";

export interface Task {
  id: string;
  title: string;
  context?: string;
  quadrantId: QuadrantId | null;
  isCompleted: boolean;
  createdAt: number;
}

export interface AppState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (
    taskId: string,
    updates: Partial<Omit<Task, "id" | "createdAt">>
  ) => void;
  removeTask: (taskId: string) => void;
  moveTask: (taskId: string, quadrantId: QuadrantId | null) => void;
  toggleTask: (taskId: string) => void;
}
