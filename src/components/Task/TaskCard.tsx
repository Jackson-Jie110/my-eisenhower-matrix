import React from "react";
import { Check, Trash2 } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";

import useTaskStore from "../../hooks/useTaskStore";
import { cn } from "../../lib/utils";
import type { Task } from "../../types";
import { Card } from "../ui/Card";

type TaskCardProps = {
  task: Task;
};

export function TaskCard({ task }: TaskCardProps) {
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const toggleTaskCompletion = useTaskStore((state) => state.toggleTaskCompletion);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const translate = transform ? CSS.Translate.toString(transform) : "";
  const style = {
    transform: translate
      ? `${translate}${isDragging ? " scale(1.05)" : ""}`
      : isDragging
        ? "scale(1.05)"
        : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-glass-border bg-glass-100 text-white backdrop-blur-sm transition-all",
        "cursor-grab active:cursor-grabbing",
        "hover:brightness-110",
        task.isCompleted && "opacity-70",
        isDragging && "opacity-50 z-50"
      )}
    >
      <button
        type="button"
        aria-label={task.isCompleted ? "标记未完成" : "标记完成"}
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-500 transition-colors",
          "hover:border-neon-blue",
          task.isCompleted &&
            "border-green-400 bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]"
        )}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          toggleTaskCompletion(task.id);
        }}
      >
        {task.isCompleted ? (
          <Check className="h-3 w-3 text-slate-900" />
        ) : null}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold",
            task.isCompleted ? "text-slate-500 line-through" : "text-slate-100"
          )}
        >
          {task.title}
        </p>
        {task.context ? (
          <p
            className={cn(
              "mt-1 text-xs",
              task.isCompleted ? "text-slate-500 line-through" : "text-slate-300"
            )}
          >
            {task.context}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-slate-300 hover:text-white"
        aria-label="删除任务"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          deleteTask(task.id);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </Card>
  );
}