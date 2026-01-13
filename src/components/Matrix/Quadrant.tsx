import { useDroppable } from "@dnd-kit/core";

import { cn } from "../../lib/utils";
import type { QuadrantId, Task } from "../../types";
import { TaskCard } from "../Task/TaskCard";

type QuadrantProps = {
  title: string;
  quadrantId: QuadrantId;
  tasks: Task[];
};

const quadrantStyles: Record<
  QuadrantId,
  { container: string; title: string; over: string }
> = {
  q1: {
    container: "bg-red-50",
    title: "text-red-900",
    over: "bg-red-100",
  },
  q2: {
    container: "bg-blue-50",
    title: "text-blue-900",
    over: "bg-blue-100",
  },
  q3: {
    container: "bg-amber-50",
    title: "text-amber-900",
    over: "bg-amber-100",
  },
  q4: {
    container: "bg-gray-50",
    title: "text-gray-900",
    over: "bg-gray-100",
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
        "rounded-lg p-4 md:p-5 transition-colors",
        "flex flex-col gap-3 min-h-[240px]",
        styles.container,
        isOver && styles.over
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
