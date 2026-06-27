import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import { FullScreenLoader, TopLoadingBar } from "./components/Loader";
import { getCurrentUser } from "./services/auth";

const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));
const ChildDetailPage = lazy(() => import("./pages/ChildDetailPage"));
const ChildrenPage = lazy(() => import("./pages/ChildrenPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ParentChatPage = lazy(() => import("./pages/ParentChatPage"));
const ParentDashboardPage = lazy(() => import("./pages/ParentDashboardPage"));

function RequireAuth() {
  return getCurrentUser() ? <Layout /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <TopLoadingBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/app/parent" element={<ParentDashboardPage />} />
          <Route path="/app/children" element={<ChildrenPage />} />
          <Route path="/app/children/:id" element={<ChildDetailPage />} />
          <Route path="/app/chatbot" element={<ParentChatPage />} />
          <Route path="/dashboard" element={<Navigate to="/app/parent" replace />} />
          <Route path="/children" element={<Navigate to="/app/children" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
