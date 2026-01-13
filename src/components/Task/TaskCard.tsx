import { Trash2 } from "lucide-react";

import { cn } from "../../lib/utils";
import type { Task } from "../../types";
import { Card } from "../ui/Card";

type TaskCardProps = {
  task: Task;
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Card
      className={cn(
        "group flex items-start justify-between gap-3",
        task.isCompleted && "opacity-60"
      )}
    >
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
      <button
        type="button"
        className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-gray-500 hover:text-gray-900"
        aria-label="删除任务"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </Card>
  );
}
