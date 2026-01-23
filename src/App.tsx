import React from "react";
import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import ArchivePage from "./pages/ArchivePage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import MatrixPage from "./pages/MatrixPage";
import RecycleBinPage from "./pages/RecycleBinPage";

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/matrix/:date" element={<MatrixPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/recycle-bin" element={<RecycleBinPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
