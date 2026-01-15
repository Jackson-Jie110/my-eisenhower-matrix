import React from "react";
import { useDroppable } from "@dnd-kit/core";

import { cn } from "../../lib/utils";
import type { QuadrantId, Task } from "../../types";
import { TaskCard } from "../Task/TaskCard";

type QuadrantProps = {
  title: string;
  quadrantId: QuadrantId;
  tasks: Task[];
};

const quadrantStyles: Record<QuadrantId, { title: string }> = {
  q1: {
    title: "text-neon-red",
  },
  q2: {
    title: "text-neon-blue",
  },
  q3: {
    title: "text-neon-yellow",
  },
  q4: {
    title: "text-neon-gray",
  },
};

export function Quadrant({ title, quadrantId, tasks }: QuadrantProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: quadrantId,
  });
  const styles = quadrantStyles[quadrantId];

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border border-white/5 bg-glass-100/5 p-4 backdrop-blur-md transition-all md:p-5",
        "flex flex-col gap-3 min-h-[240px]",
        isOver && "border-white/20 bg-glass-200/40"
      )}
    >
      <h3 className={cn("text-sm font-bold tracking-tight", styles.title)}>
        {title}
      </h3>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}
