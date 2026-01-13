import React from "react";
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
import { Loader2, Sparkles } from "lucide-react";

import { analyzeTasks } from "./lib/ai-client";
import useTaskStore from "./hooks/useTaskStore";
import type { QuadrantId, Task } from "./types";
import { MatrixGrid } from "./components/Matrix/MatrixGrid";
import { TaskCard } from "./components/Task/TaskCard";
import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";
import { Input } from "./components/ui/Input";
import { cn } from "./lib/utils";

const BACKLOG_ID = "backlog";
const quadrantIds: QuadrantId[] = ["q1", "q2", "q3", "q4"];

const isQuadrantId = (value: string): value is QuadrantId =>
  quadrantIds.includes(value as QuadrantId);

const buildOverlayTask = (task: Task) => (
  <Card className="w-64">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-medium text-gray-900",
            task.isCompleted && "line-through"
          )}
        >
          {task.title}
        </p>
        {task.context ? (
          <p
            className={cn(
              "mt-1 text-xs text-gray-500",
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
        "rounded-lg border-2 border-transparent bg-gray-50 p-4 transition-colors",
        isOver && "border-blue-500 bg-gray-100"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">待办池 Backlog</h2>
        <span className="text-xs text-gray-500">{tasks.length} 项</span>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="text-xs text-gray-400">暂无待办任务</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </section>
  );
}

export default function App() {
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTaskQuadrant = useTaskStore((state) => state.updateTaskQuadrant);

  const [title, setTitle] = React.useState("");
  const [context, setContext] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const backlogTasks = React.useMemo(
    () => tasks.filter((task) => task.quadrantId === null),
    [tasks]
  );

  const activeTask = React.useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [tasks, activeTaskId]
  );

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
      useTaskStore.getState().updateTaskQuadrant(activeId, null);
      return;
    }

    if (isQuadrantId(overId)) {
      useTaskStore.getState().updateTaskQuadrant(activeId, overId);
    }
  };

  const handleMagicSort = async () => {
    if (isLoading || backlogTasks.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const { results } = await analyzeTasks(backlogTasks);
      results.forEach((result) => {
        if (isQuadrantId(result.quadrantId)) {
          updateTaskQuadrant(result.id, result.quadrantId);
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Flat Matrix</h1>
          <p className="text-sm text-gray-600">
            拖拽任务到象限，或使用 Magic Sort 让 AI 智能分类。
          </p>
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
              placeholder="输入任务标题"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Input
              placeholder="补充备注（可选）"
              value={context}
              onChange={(event) => setContext(event.target.value)}
            />
            <div className="flex flex-col gap-3 md:flex-row">
              <Button type="submit" variant="primary">
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleMagicSort}
                disabled={isLoading || backlogTasks.length === 0}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>{isLoading ? "AI Thinking..." : "Magic Sort"}</span>
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
    </div>
  );
}
