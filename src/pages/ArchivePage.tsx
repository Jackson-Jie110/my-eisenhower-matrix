import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { motion } from "framer-motion";
import { CalendarPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import type { Task } from "../types";
import { Button } from "../components/ui/Button";
import { ParticlesBackground } from "../components/ui/ParticlesBackground";

const pageMotion = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 1.1, transition: { duration: 0.3 } },
};

type DateEntry = {
  date: string;
  tasks: Task[];
  completionRate: number;
};

dayjs.locale("zh-cn");

const parseTasks = (raw: string | null) => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as Task[];
    }
  } catch {
    return [];
  }
  return [];
};

const getCompletionRate = (tasks: Task[]) => {
  if (tasks.length === 0) {
    return 0;
  }
  const completed = tasks.filter((task) => task.isCompleted).length;
  return completed / tasks.length;
};

const formatWeekday = (date: string) => dayjs(date).format("ddd");

const buildEntry = (date: string): DateEntry => {
  const raw = localStorage.getItem(`tasks_${date}`);
  const tasks = parseTasks(raw);
  return {
    date,
    tasks,
    completionRate: getCompletionRate(tasks),
  };
};

const seedMockData = () => {
  const mockDates = [
    dayjs().subtract(1, "day"),
    dayjs().subtract(1, "month"),
    dayjs().subtract(1, "year"),
  ];

  mockDates.forEach((date) => {
    const formatted = date.format("YYYY-MM-DD");
    const tasks: Task[] = [
      {
        id: `mock-${formatted}-1`,
        title: "示例任务",
        context: "来自开发环境的演示数据",
        quadrantId: null,
        isCompleted: false,
        createdAt: date.valueOf(),
      },
      {
        id: `mock-${formatted}-2`,
        title: "已完成的示例任务",
        quadrantId: "q2",
        isCompleted: true,
        createdAt: date.valueOf(),
      },
    ];
    localStorage.setItem(`tasks_${formatted}`, JSON.stringify(tasks));
  });
};

const ArchiveCard = ({
  entry,
  highlight,
}: {
  entry: DateEntry;
  highlight?: boolean;
}) => {
  const day = dayjs(entry.date).format("D日");
  const weekday = formatWeekday(entry.date);
  const completed = entry.completionRate >= 1 && entry.tasks.length > 0;

  return (
    <Link
      to={`/matrix/${entry.date}`}
      className={`rounded-2xl border p-4 text-slate-100 backdrop-blur-md transition-all hover:brightness-110 ${
        completed
          ? "border-yellow-500 bg-glass-100/60 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
          : "border-glass-border bg-glass-100/40"
      } ${highlight ? "ring-1 ring-white/30" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300">{weekday}</p>
          <p className="text-2xl font-semibold text-white">{day}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">完成率</p>
          <p className="text-lg font-semibold text-white">
            {Math.round(entry.completionRate * 100)}%
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{entry.tasks.length} 项任务</p>
    </Link>
  );
};

export default function ArchivePage() {
  const [entries, setEntries] = React.useState<DateEntry[]>([]);
  const [supportsPicker, setSupportsPicker] = React.useState(false);
  const today = dayjs().format("YYYY-MM-DD");
  const navigate = useNavigate();
  const dateInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setSupportsPicker(
      typeof HTMLInputElement !== "undefined" &&
        "showPicker" in HTMLInputElement.prototype
    );
  }, []);

  React.useEffect(() => {
    let keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("tasks_")
    );

    if (keys.length === 0 && import.meta.env.DEV) {
      seedMockData();
      keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("tasks_")
      );
    }

    const parsed = keys
      .map((key) => key.replace("tasks_", ""))
      .filter((date) => dayjs(date, "YYYY-MM-DD", true).isValid())
      .map((date) => buildEntry(date))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    setEntries(parsed);
  }, []);

  const todayEntry = React.useMemo(() => {
    const existing = entries.find((entry) => entry.date === today);
    return existing ?? buildEntry(today);
  }, [entries, today]);

  const groupedTasks = React.useMemo(() => {
    const groups: Record<string, DateEntry[]> = {};
    entries
      .filter((entry) => entry.date !== today)
      .forEach((entry) => {
        const label = dayjs(entry.date).format("YYYY年M月");
        if (!groups[label]) {
          groups[label] = [];
        }
        groups[label].push(entry);
      });

    Object.keys(groups).forEach((label) => {
      groups[label] = groups[label].sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
    });

    return groups;
  }, [entries, today]);

  const sortedGroups = React.useMemo(
    () =>
      Object.entries(groupedTasks).sort((a, b) =>
        dayjs(b[0], "YYYY年M月").valueOf() -
        dayjs(a[0], "YYYY年M月").valueOf()
      ),
    [groupedTasks]
  );

  const handleOpenPicker = () => {
    const input = dateInputRef.current;
    if (!input) {
      return;
    }
    input.showPicker?.();
    if (!supportsPicker) {
      input.click();
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) {
      return;
    }
    navigate(`/matrix/${value}`);
  };

  return (
    <motion.div
      variants={pageMotion}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative min-h-screen overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <ParticlesBackground />
      </div>
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Archive
            </p>
            <h1 className="text-3xl font-semibold text-white">档案室</h1>
          </div>
          <div className="relative flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenPicker}
              className="flex items-center gap-2"
            >
              <CalendarPlus className="h-4 w-4" />
              新建 / 穿梭
            </Button>
            <input
              ref={dateInputRef}
              type="date"
              className={
                supportsPicker
                  ? "invisible absolute inset-0 pointer-events-none"
                  : "absolute inset-0 opacity-0"
              }
              onChange={handleDateChange}
            />
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">
            今日 (Today)
          </h2>
          <ArchiveCard entry={todayEntry} highlight />
        </section>

        <section className="space-y-6">
          <h2 className="text-sm font-semibold text-slate-200">全部档案</h2>
          {sortedGroups.map(([month, dates]) => (
            <div key={month}>
              <h3 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">
                {month}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dates.map((entry) => (
                  <ArchiveCard key={entry.date} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </motion.div>
  );
}