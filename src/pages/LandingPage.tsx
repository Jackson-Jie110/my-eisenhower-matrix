import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { ParticlesBackground } from "../components/ui/ParticlesBackground";

const pageMotion = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 1.1, transition: { duration: 0.3 } },
};

export default function LandingPage() {
  const navigate = useNavigate();

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
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-900/50 p-10 text-center text-white shadow-2xl shadow-blue-500/10 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-300">
            Flat Matrix
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            时间管理四象限
          </h1>
          <p className="mt-4 text-base text-slate-400 md:text-lg">
            理清思绪，掌控当下
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/archive")}
              className="px-8"
            >
              开启旅程
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}