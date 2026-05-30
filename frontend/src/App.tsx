import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import { getCurrentUser } from "./services/auth";

const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));
const ChildDetailPage = lazy(() => import("./pages/ChildDetailPage"));
const ChildrenPage = lazy(() => import("./pages/ChildrenPage"));
const ConsultationsPage = lazy(() => import("./pages/ConsultationsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const MeasurementsPage = lazy(() => import("./pages/MeasurementsPage"));
const ModelInfoPage = lazy(() => import("./pages/ModelInfoPage"));
const ParentDashboardPage = lazy(() => import("./pages/ParentDashboardPage"));
const QuickPredictionPage = lazy(() => import("./pages/QuickPredictionPage"));

function RequireAuth() {
  return getCurrentUser() ? <Layout /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Memuat halaman...</div>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/app/parent" element={<ParentDashboardPage />} />
          <Route path="/app/admin" element={<DashboardPage />} />
          <Route path="/app/children" element={<ChildrenPage />} />
          <Route path="/app/children/:id" element={<ChildDetailPage />} />
          <Route path="/app/predict" element={<QuickPredictionPage />} />
          <Route path="/app/measurements" element={<MeasurementsPage />} />
          <Route path="/app/consultations" element={<ConsultationsPage />} />
          <Route path="/app/model" element={<ModelInfoPage />} />
          <Route path="/dashboard" element={<Navigate to="/app/admin" replace />} />
          <Route path="/children" element={<Navigate to="/app/children" replace />} />
          <Route path="/predict" element={<Navigate to="/app/predict" replace />} />
          <Route path="/model" element={<Navigate to="/app/model" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
