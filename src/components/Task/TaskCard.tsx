import React from "react";
import {
  ArrowDown,
  ArrowRightCircle,
  ArrowUp,
  Check,
  Trash2,
} from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

import useTaskStore from "../../hooks/useTaskStore";
import { cn } from "../../lib/utils";
import type { Task } from "../../types";
import { Card } from "../ui/Card";

type TaskCardProps = {
  task: Task;
  index: number;
  totalInQuadrant: number;
  containerId: string;
  onRequestDelete: (task: Task) => void;
  onRequestSnooze: (task: Task) => void;
  isSelected?: boolean;
  isOverlay?: boolean;
  className?: string;
};

type TaskCardBaseProps = TaskCardProps & {
  cardRef?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  listeners?: React.HTMLAttributes<HTMLDivElement>;
  attributes?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
};

const TaskCardBase = ({
  task,
  index,
  totalInQuadrant,
  onRequestDelete,
  onRequestSnooze,
  isSelected = false,
  isOverlay = false,
  className,
  cardRef,
  style,
  listeners,
  attributes,
  isDragging = false,
}: TaskCardBaseProps) => {
  const toggleTaskCompletion = useTaskStore(
    (state) => state.toggleTaskCompletion
  );
  const reorderTask = useTaskStore((state) => state.reorderTask);

  const canMoveUp = index > 0;
  const canMoveDown = index < totalInQuadrant - 1;
  const showActions = !(isOverlay || isDragging);

  return (
    <Card
      ref={cardRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-glass-border bg-glass-100 text-white backdrop-blur-sm transition-all",
        isOverlay ? "cursor-grabbing" : "cursor-grab active:cursor-grabbing",
        "hover:brightness-110",
        task.isCompleted && "opacity-70",
        isSelected && "ring-2 ring-blue-500/80 ring-offset-2 ring-offset-slate-900/40",
        isDragging && "opacity-50 z-50",
        className
      )}
    >
      {showActions ? (
        <button
          type="button"
          aria-label={
            task.isCompleted
              ? "\u6807\u8bb0\u672a\u5b8c\u6210"
              : "\u6807\u8bb0\u5b8c\u6210"
          }
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
      ) : null}
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
      {showActions ? (
        <div className="flex items-center gap-2">
          {canMoveUp ? (
            <button
              type="button"
              aria-label="\u4e0a\u79fb\u4efb\u52a1"
              className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-slate-300 hover:text-white"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                reorderTask(task.id, index, index - 1);
              }}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          ) : null}
          {canMoveDown ? (
            <button
              type="button"
              aria-label="\u4e0b\u79fb\u4efb\u52a1"
              className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-slate-300 hover:text-white"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                reorderTask(task.id, index, index + 1);
              }}
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          ) : null}
          {!task.isCompleted ? (
            <button
              type="button"
              title="\u63a8\u8fdf\u5230\u660e\u5929"
              className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-slate-300 hover:text-white"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onRequestSnooze(task);
              }}
            >
              <ArrowRightCircle className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-slate-300 hover:text-white"
            aria-label="\u5220\u9664\u4efb\u52a1"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onRequestDelete(task);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </Card>
  );
};

const SortableTaskCard = (props: TaskCardProps) => {
  const { task, containerId } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: { containerId },
    });

  const translate = transform ? CSS.Transform.toString(transform) : "";
  const style = {
    transform: translate
      ? `${translate}${isDragging ? " scale(1.05)" : ""}`
      : isDragging
        ? "scale(1.05)"
        : undefined,
    transition,
  };

  return (
    <TaskCardBase
      {...props}
      cardRef={setNodeRef}
      style={style}
      listeners={listeners}
      attributes={attributes}
      isDragging={isDragging}
    />
  );
};

export function TaskCard(props: TaskCardProps) {
  if (props.isOverlay) {
    return <TaskCardBase {...props} />;
  }
  return <SortableTaskCard {...props} />;
}
