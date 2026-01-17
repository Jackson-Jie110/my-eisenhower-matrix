import React from "react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { ChevronLeft, RotateCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import useTaskStore from "../hooks/useTaskStore";
import type { Task } from "../types";
import { Button } from "../components/ui/Button";
import { ParticlesBackground } from "../components/ui/ParticlesBackground";

const pageMotion = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 1.1, transition: { duration: 0.3 } },
};

type RecycleEntry = {
  date: string;
  tasks: Task[];
};

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

const loadRecycleEntries = () => {
  const keys = Object.keys(localStorage).filter((key) =>
    key.startsWith("recycle_")
  );

  return keys
    .map((key) => key.replace("recycle_", ""))
    .filter((date) => dayjs(date, "YYYY-MM-DD", true).isValid())
    .map((date) => ({
      date,
      tasks: parseTasks(localStorage.getItem(`recycle_${date}`)),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
};

export default function RecycleBinPage() {
  const [entries, setEntries] = React.useState<RecycleEntry[]>([]);
  const navigate = useNavigate();
  const restoreArchive = useTaskStore((state) => state.restoreArchive);
  const permanentlyDeleteArchive = useTaskStore(
    (state) => state.permanentlyDeleteArchive
  );
  const emptyRecycleBin = useTaskStore((state) => state.emptyRecycleBin);

  const refreshEntries = React.useCallback(() => {
    setEntries(loadRecycleEntries());
  }, []);

  React.useEffect(() => {
    refreshEntries();
  }, [refreshEntries]);

  const handleRestore = (date: string) => {
    restoreArchive(date);
    refreshEntries();
  };

  const handleDeleteForever = (date: string) => {
    const confirmed = window.confirm("确定要彻底删除这一天的档案吗？");
    if (!confirmed) {
      return;
    }
    permanentlyDeleteArchive(date);
    refreshEntries();
  };

  const handleEmptyRecycleBin = () => {
    const confirmed = window.confirm("确定要清空回收站吗？此操作不可恢复。");
    if (!confirmed) {
      return;
    }
    emptyRecycleBin();
    refreshEntries();
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
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate("/archive")}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              返回
            </button>
            <h1 className="text-3xl font-semibold text-white">回收站</h1>
            <p className="text-sm text-slate-400">
              共 {entries.length} 份档案
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleEmptyRecycleBin}
            className="flex items-center gap-2 border border-red-500/40 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            清空回收站
          </Button>
        </header>

        {entries.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-center text-slate-300">
            暂无回收档案
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.date}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur-md md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-white">
                    {entry.date}
                  </p>
                  <p className="text-xs text-slate-400">
                    {entry.tasks.length} 项任务
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRestore(entry.date)}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    恢复
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleDeleteForever(entry.date)}
                    className="flex items-center gap-2 border border-red-500/40 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    彻底删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
