import { lazy, PropsWithChildren, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import { FullScreenLoader, TopLoadingBar } from "./components/Loader";
import ChatbotPopup from "./components/ChatbotPopup";
import { getCurrentUser } from "./services/auth";
import type { UserRole } from "./types";

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

function RequireRole({ children, role }: PropsWithChildren<{ role: UserRole }>) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/app/admin" : "/app/parent"} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <TopLoadingBar />
      <ChatbotPopup />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/app/parent" element={<ParentDashboardPage />} />
          <Route path="/app/admin" element={<RequireRole role="admin"><DashboardPage /></RequireRole>} />
          <Route path="/app/children" element={<ChildrenPage />} />
          <Route path="/app/children/:id" element={<ChildDetailPage />} />
          <Route path="/app/predict" element={<QuickPredictionPage />} />
          <Route path="/app/measurements" element={<RequireRole role="admin"><MeasurementsPage /></RequireRole>} />
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
