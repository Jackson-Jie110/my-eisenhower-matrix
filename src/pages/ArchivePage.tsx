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

type MonthGroup = {
  label: string;
  entries: DateEntry[];
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

const ArchiveCard = ({ entry, highlight }: { entry: DateEntry; highlight?: boolean }) => {
  const day = dayjs(entry.date).format("D日");
  const weekday = formatWeekday(entry.date);
  const completed = entry.completionRate >= 1 && entry.tasks.length > 0;

  return (
    <Link
      to={`/matrix/${entry.date}`}
      className={`rounded-2xl border p-4 text-slate-100 backdrop-blur-md transition-all hover:brightness-110 ${
        completed
          ? "border-yellow-400/50 bg-glass-100/60 shadow-[0_0_24px_rgba(250,204,21,0.25)]"
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
  const today = dayjs().format("YYYY-MM-DD");
  const navigate = useNavigate();
  const dateInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("tasks_")
    );
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

  const grouped = React.useMemo(() => {
    const groups: Record<string, MonthGroup> = {};

    entries
      .filter((entry) => entry.date !== today)
      .forEach((entry) => {
        const monthKey = dayjs(entry.date).format("YYYY-MM");
        const label = dayjs(entry.date).format("YYYY年MM月");
        if (!groups[monthKey]) {
          groups[monthKey] = { label, entries: [] };
        }
        groups[monthKey].entries.push(entry);
      });

    Object.keys(groups).forEach((key) => {
      groups[key].entries = groups[key].entries.sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
    });

    return groups;
  }, [entries, today]);

  const groupKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  const handleOpenPicker = () => {
    const input = dateInputRef.current;
    if (!input) {
      return;
    }
    const picker = input as HTMLInputElement & { showPicker?: () => void };
    if (picker.showPicker) {
      picker.showPicker();
    } else {
      input.click();
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      navigate(`/matrix/${value}`);
    }
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
          <div className="flex items-center gap-3">
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
              className="absolute -left-[9999px] opacity-0"
              onChange={handleDateChange}
            />
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">今日</h2>
          <ArchiveCard entry={todayEntry} highlight />
        </section>

        <section className="space-y-6">
          <h2 className="text-sm font-semibold text-slate-200">历史档案</h2>
          {groupKeys.length === 0 ? (
            <p className="text-sm text-slate-400">
              暂无历史记录，从今天开始记录你的时间矩阵。
            </p>
          ) : (
            groupKeys.map((key) => (
              <div key={key} className="space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-semibold text-slate-200">
                    {grouped[key].label}
                  </h3>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {grouped[key].entries.map((entry) => (
                    <ArchiveCard key={entry.date} entry={entry} />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </motion.div>
  );
}
