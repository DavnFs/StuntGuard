import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";

const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));
const ChildDetailPage = lazy(() => import("./pages/ChildDetailPage"));
const ChildrenPage = lazy(() => import("./pages/ChildrenPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ModelInfoPage = lazy(() => import("./pages/ModelInfoPage"));
const QuickPredictionPage = lazy(() => import("./pages/QuickPredictionPage"));

export default function App() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Memuat halaman...</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/children" element={<ChildrenPage />} />
          <Route path="/children/:id" element={<ChildDetailPage />} />
          <Route path="/predict" element={<QuickPredictionPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/model" element={<ModelInfoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
