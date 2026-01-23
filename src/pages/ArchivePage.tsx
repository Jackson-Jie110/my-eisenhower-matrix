import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarPlus,
  ChevronDown,
  Download,
  LayoutDashboard,
  Trash2,
  Upload,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";

import useTaskStore from "../hooks/useTaskStore";
import type { Task } from "../types";
import { Button } from "../components/ui/Button";
import { ConfirmModal } from "../components/ui/ConfirmModal";
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

const ArchiveCard = ({
  entry,
  highlight,
  onDelete,
}: {
  entry: DateEntry;
  highlight?: boolean;
  onDelete: (date: string) => void;
}) => {
  const day = dayjs(entry.date).format("D日");
  const weekday = formatWeekday(entry.date);
  const completed = entry.completionRate >= 1 && entry.tasks.length > 0;

  return (
    <Link
      to={`/matrix/${entry.date}`}
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 
      ${
        completed
          ? "bg-slate-900/80 border-[#EAB308] shadow-[0_0_20px_2px_rgba(234,179,8,0.4)] hover:shadow-[0_0_25px_4px_rgba(234,179,8,0.5)]"
          : "bg-slate-900/50 border-white/20 shadow-[0_2px_12px_rgba(255,255,255,0.08)] hover:bg-slate-900/70 hover:border-white/30 hover:shadow-[0_4px_16px_rgba(255,255,255,0.12)]"
      } 
      ${highlight ? "ring-2 ring-blue-500/50" : ""}`}
    >
      <button
        type="button"
        aria-label="删除档案"
        className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full text-red-400 opacity-0 transition-opacity hover:bg-red-500/20 group-hover:opacity-100"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDelete(entry.date);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start justify-between z-10 relative">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
            {weekday}
          </span>
          <span
            className={`text-3xl font-bold mt-1 ${
              completed ? "text-[#EAB308]" : "text-white"
            }`}
          >
            {day}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            完成率
          </span>
          <p
            className={`text-xl font-bold ${
              completed ? "text-[#EAB308]" : "text-slate-200"
            }`}
          >
            {Math.round(entry.completionRate * 100)}%
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 z-10 relative">
        <span className="text-xs text-slate-500 group-hover:text-slate-400">
          {entry.tasks.length} 项任务
        </span>
      </div>
    </Link>
  );
};

export default function ArchivePage() {
  const [entries, setEntries] = React.useState<DateEntry[]>([]);
  const [supportsPicker, setSupportsPicker] = React.useState(false);
  const [pendingDate, setPendingDate] = React.useState("");
  const [pendingDeleteDate, setPendingDeleteDate] = React.useState<
    string | null
  >(null);
  const [expandedMonths, setExpandedMonths] = React.useState<
    Record<string, boolean>
  >({});
  const today = dayjs().format("YYYY-MM-DD");
  const navigate = useNavigate();
  const softDeleteArchive = useTaskStore((state) => state.softDeleteArchive);
  const dateInputRef = React.useRef<HTMLInputElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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
      Object.entries(groupedTasks).sort(
        (a, b) =>
          dayjs(b[0], "YYYY年M月").valueOf() -
          dayjs(a[0], "YYYY年M月").valueOf()
      ),
    [groupedTasks]
  );

  React.useEffect(() => {
    setExpandedMonths((prev) => {
      if (sortedGroups.length === 0) {
        return {};
      }
      if (Object.keys(prev).length === 0) {
        const initial: Record<string, boolean> = {};
        sortedGroups.forEach(([month], index) => {
          initial[month] = index === 0;
        });
        return initial;
      }

      const next: Record<string, boolean> = {};
      sortedGroups.forEach(([month]) => {
        next[month] = prev[month] ?? false;
      });
      return next;
    });
  }, [sortedGroups]);

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
    setPendingDate(value);
  };

  const handleNavigateDate = () => {
    if (!pendingDate) {
      return;
    }
    navigate(`/matrix/${pendingDate}`);
  };

  const isConfirmSuppressed = React.useCallback((featureKey: string) => {
    if (typeof window === "undefined") {
      return false;
    }
    const raw = localStorage.getItem(`suppress_confirm_${featureKey}`);
    if (!raw) {
      return false;
    }
    try {
      const parsed = JSON.parse(raw) as { date?: string; suppressed?: boolean };
      return (
        parsed?.suppressed === true &&
        parsed?.date === dayjs().format("YYYY-MM-DD")
      );
    } catch {
      return false;
    }
  }, []);

  const handleDeleteEntry = (date: string) => {
    if (isConfirmSuppressed("delete_archive")) {
      softDeleteArchive(date);
      setEntries((prev) => prev.filter((entry) => entry.date !== date));
      return;
    }
    setPendingDeleteDate(date);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteDate) {
      return;
    }
    softDeleteArchive(pendingDeleteDate);
    setEntries((prev) => prev.filter((entry) => entry.date !== pendingDeleteDate));
    setPendingDeleteDate(null);
  };

  const handleCancelDelete = () => {
    setPendingDeleteDate(null);
  };

  const deleteConfirmMessage = pendingDeleteDate
    ? `确定将 ${pendingDeleteDate} 的档案移入回收站吗？`
    : "";

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [month]: !prev[month],
    }));
  };

  const handleExport = () => {
    const data: Record<string, Task[]> = {};
    Object.keys(localStorage)
      .filter((key) => key.startsWith("tasks_"))
      .forEach((key) => {
        data[key] = parseTasks(localStorage.getItem(key));
      });

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    saveAs(blob, "flat-matrix-backup.json");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result ? String(reader.result) : "";
        const parsed = JSON.parse(content) as Record<string, Task[]>;
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Invalid JSON");
        }
        Object.entries(parsed).forEach(([key, value]) => {
          if (!key.startsWith("tasks_")) {
            return;
          }
          if (!Array.isArray(value)) {
            return;
          }
          localStorage.setItem(key, JSON.stringify(value));
        });
        window.location.reload();
      } catch {
        window.alert("导入失败：文件格式不正确。请确认 JSON 结构。");
      }
    };
    reader.readAsText(file, "utf-8");
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
          <div className="relative flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              仪表盘
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/recycle-bin")}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              回收站
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              导出
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleImportClick}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              导入
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportFile}
            />
            <div className="relative">
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
            <Button
              type="button"
              variant="ghost"
              onClick={handleNavigateDate}
              disabled={!pendingDate}
              className={
                pendingDate
                  ? "flex items-center gap-2 border border-glass-border"
                  : "flex items-center gap-2 border border-glass-border text-slate-500"
              }
            >
              <ArrowRight className="h-4 w-4" />
              前往
            </Button>
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">
            今日 (Today)
          </h2>
          <ArchiveCard
            entry={todayEntry}
            highlight
            onDelete={handleDeleteEntry}
          />
        </section>

        <section className="space-y-6">
          <h2 className="text-sm font-semibold text-slate-200">全部档案</h2>
          {sortedGroups.map(([month, dates]) => {
            const isExpanded = expandedMonths[month];
            return (
              <div key={month}>
                <button
                  type="button"
                  onClick={() => toggleMonth(month)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-left text-2xl font-bold text-white transition-colors hover:bg-white/10"
                >
                  <span>{month}</span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded ? (
                    <motion.div
                      key={`${month}-grid`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {dates.map((entry) => (
                          <ArchiveCard
                            key={entry.date}
                            entry={entry}
                            onDelete={handleDeleteEntry}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </section>
      </div>
      <ConfirmModal
        isOpen={Boolean(pendingDeleteDate)}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="删除档案"
        message={deleteConfirmMessage}
        confirmText="移入回收站"
        isDanger
        featureKey="delete_archive"
      />
    </motion.div>
  );
}
