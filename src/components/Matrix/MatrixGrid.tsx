import React from "react";
import useTaskStore from "../../hooks/useTaskStore";
import type { QuadrantId, Task } from "../../types";
import { Quadrant } from "./Quadrant";

const quadrantTitles: Record<QuadrantId, string> = {
  q1: "重要且紧急",
  q2: "重要不紧急",
  q3: "紧急不重要",
  q4: "不重要不紧急",
};

const quadrantOrder: QuadrantId[] = ["q1", "q2", "q3", "q4"];

const filterTasksByQuadrant = (tasks: Task[], quadrantId: QuadrantId) =>
  tasks.filter((task) => task.quadrantId === quadrantId);

type MatrixGridProps = {
  onRequestDelete: (task: Task) => void;
  onRequestSnooze: (task: Task) => void;
  selectedTaskId?: string | null;
};

export function MatrixGrid({
  onRequestDelete,
  onRequestSnooze,
  selectedTaskId,
}: MatrixGridProps) {
  const tasks = useTaskStore((state) => state.tasks);

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {quadrantOrder.map((quadrantId) => (
        <Quadrant
          key={quadrantId}
          quadrantId={quadrantId}
          title={quadrantTitles[quadrantId]}
          tasks={filterTasksByQuadrant(tasks, quadrantId)}
          onRequestDelete={onRequestDelete}
          onRequestSnooze={onRequestSnooze}
          selectedTaskId={selectedTaskId}
        />
      ))}
    </section>
  );
}

