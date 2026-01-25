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
  isDragDisabled?: boolean;
  className?: string;
};

type TaskCardBaseProps = TaskCardProps & {
  cardRef?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  listeners?: React.HTMLAttributes<HTMLDivElement>;
  attributes?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  isEditing?: boolean;
  draftTitle?: string;
  draftContext?: string;
  onStartEdit?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onDraftTitleChange?: (value: string) => void;
  onDraftContextChange?: (value: string) => void;
  onEditKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

const TaskCardBase = ({
  task,
  index,
  totalInQuadrant,
  onRequestDelete,
  onRequestSnooze,
  isSelected = false,
  isOverlay = false,
  isDragDisabled = false,
  className,
  cardRef,
  style,
  listeners,
  attributes,
  isDragging = false,
  isEditing = false,
  draftTitle = "",
  draftContext = "",
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDraftTitleChange,
  onDraftContextChange,
  onEditKeyDown,
}: TaskCardBaseProps) => {
  const toggleTaskCompletion = useTaskStore(
    (state) => state.toggleTaskCompletion
  );
  const reorderTask = useTaskStore((state) => state.reorderTask);

  const canMoveUp = index > 0;
  const canMoveDown = index < totalInQuadrant - 1;
  const showActions = !(isOverlay || isDragging || isEditing);
  const showReorder = showActions && !isDragDisabled;
  const cursorClass = isOverlay
    ? "cursor-grabbing"
    : isDragDisabled
      ? "cursor-default"
      : "cursor-grab active:cursor-grabbing";

  return (
    <Card
      id={isOverlay ? undefined : task.id}
      ref={cardRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-glass-border bg-glass-100 text-white backdrop-blur-sm transition-all",
        cursorClass,
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
              ? "标记未完成"
              : "标记完成"
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
      <div
        className={cn("min-w-0 flex-1", isEditing && "w-full")}
        onDoubleClick={() => {
          if (!isOverlay && !isDragging) {
            onStartEdit?.();
          }
        }}
      >
        {isEditing ? (
          <div className="flex w-full flex-col gap-2">
            <input
              className="w-full rounded-lg border border-glass-border bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
              value={draftTitle}
              placeholder="任务标题"
              onChange={(event) => onDraftTitleChange?.(event.target.value)}
              onKeyDown={onEditKeyDown}
              onPointerDown={(event) => event.stopPropagation()}
            />
            <input
              className="w-full rounded-lg border border-glass-border bg-black/20 px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500"
              value={draftContext}
              placeholder="备注（可选）"
              onChange={(event) => onDraftContextChange?.(event.target.value)}
              onKeyDown={onEditKeyDown}
              onPointerDown={(event) => event.stopPropagation()}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-glass-border bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                onClick={(event) => {
                  event.stopPropagation();
                  onSaveEdit?.();
                }}
              >
                {"保存"}
              </button>
              <button
                type="button"
                className="rounded-md border border-glass-border px-2 py-1 text-xs text-slate-400 hover:text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  onCancelEdit?.();
                }}
              >
                {"取消"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p
              className={cn(
                "text-sm font-semibold",
                task.isCompleted
                  ? "text-slate-500 line-through"
                  : "text-slate-100"
              )}
            >
              {task.title}
            </p>
            {task.context ? (
              <p
                className={cn(
                  "mt-1 text-xs",
                  task.isCompleted
                    ? "text-slate-500 line-through"
                    : "text-slate-300"
                )}
              >
                {task.context}
              </p>
            ) : null}
          </>
        )}
      </div>
      {showActions ? (
        <div className="flex items-center gap-2">
          {showReorder && canMoveUp ? (
            <button
              type="button"
              aria-label="上移任务"
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
          {showReorder && canMoveDown ? (
            <button
              type="button"
              aria-label="下移任务"
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
              title="推迟到明天"
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
            aria-label="删除任务"
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

const SortableTaskCard = (
  props: TaskCardProps & {
    isEditing: boolean;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    draftTitle: string;
    draftContext: string;
    onDraftTitleChange: (value: string) => void;
    onDraftContextChange: (value: string) => void;
    onEditKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  }
) => {
  const {
    task,
    containerId,
    isEditing,
    isDragDisabled = false,
  } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: { containerId },
      disabled: isEditing || isDragDisabled,
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
  const { task, isOverlay = false } = props;
  const updateTaskDetails = useTaskStore((state) => state.updateTaskDetails);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState(task.title);
  const [draftContext, setDraftContext] = React.useState(task.context ?? "");

  React.useEffect(() => {
    if (!isEditing) {
      setDraftTitle(task.title);
      setDraftContext(task.context ?? "");
    }
  }, [isEditing, task.context, task.title]);

  const startEdit = React.useCallback(() => {
    if (isOverlay) {
      return;
    }
    setIsEditing(true);
  }, [isOverlay]);

  const cancelEdit = React.useCallback(() => {
    setIsEditing(false);
    setDraftTitle(task.title);
    setDraftContext(task.context ?? "");
  }, [task.context, task.title]);

  const saveEdit = React.useCallback(() => {
    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle) {
      cancelEdit();
      return;
    }
    const trimmedContext = draftContext.trim();
    const nextContext = trimmedContext ? trimmedContext : undefined;

    if (
      trimmedTitle !== task.title ||
      nextContext !== (task.context ?? undefined)
    ) {
      updateTaskDetails(task.id, {
        title: trimmedTitle,
        context: nextContext,
      });
    }
    setIsEditing(false);
  }, [cancelEdit, draftContext, draftTitle, task.context, task.id, task.title, updateTaskDetails]);

  const handleEditKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveEdit();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEdit();
      }
    },
    [cancelEdit, saveEdit]
  );

  if (isOverlay) {
    return <TaskCardBase {...props} isEditing={false} />;
  }

  return (
    <SortableTaskCard
      {...props}
      isEditing={isEditing}
      onStartEdit={startEdit}
      onSaveEdit={saveEdit}
      onCancelEdit={cancelEdit}
      draftTitle={draftTitle}
      draftContext={draftContext}
      onDraftTitleChange={setDraftTitle}
      onDraftContextChange={setDraftContext}
      onEditKeyDown={handleEditKeyDown}
    />
  );
}
