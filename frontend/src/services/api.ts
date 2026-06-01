import type {
  AuthUser,
  ChatResponse,
  ChatChildContext,
  Child,
  ChildInput,
  Consultation,
  ConsultationInput,
  ConsultationStatus,
  DashboardSummary,
  LoginRequest,
  Measurement,
  MeasurementInput,
  ModelInfo,
  PredictionRequest,
  PredictionResponse,
} from "../types";
import { clearCurrentUser, getCurrentUser } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function errorMessageFromDetail(detail: unknown, fallback: string) {
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail) || detail.length === 0) return fallback;

  const first = detail[0] as { loc?: unknown[]; msg?: unknown };
  const field = Array.isArray(first.loc) ? first.loc.slice(1).join(".") : "";
  const message = typeof first.msg === "string" ? first.msg : "Input tidak valid";
  return field ? `Periksa ${field}: ${message}` : message;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const currentUser = getCurrentUser();
  if (currentUser) {
    headers.set("Authorization", `Bearer ${currentUser.token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Server belum dapat dihubungi. Periksa koneksi lalu coba lagi.");
  }

  if (!response.ok) {
    let message =
      response.status >= 500
        ? "Server sedang mengalami kendala. Silakan coba lagi beberapa saat lagi."
        : `Request gagal (${response.status})`;
    if (response.status < 500) {
      try {
        const payload = await response.json();
        message = errorMessageFromDetail(payload.detail, message);
      } catch {
        message = response.statusText || message;
      }
    }
    if (response.status === 401) {
      clearCurrentUser();
      if (window.location.pathname.startsWith("/app")) {
        window.location.replace("/login");
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: () => apiRequest<{ status: string; service: string }>("/health"),
  login: (payload: LoginRequest) =>
    apiRequest<AuthUser>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  getDashboard: () => apiRequest<DashboardSummary>("/dashboard/summary"),
  getChildren: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiRequest<Child[]>(`/children${query}`);
  },
  createChild: (payload: ChildInput) =>
    apiRequest<Child>("/children", { method: "POST", body: JSON.stringify(payload) }),
  updateChild: (id: number, payload: Partial<ChildInput>) =>
    apiRequest<Child>(`/children/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteChild: (id: number) => apiRequest<void>(`/children/${id}`, { method: "DELETE" }),
  getChild: (id: number) => apiRequest<Child>(`/children/${id}`),
  getMeasurements: (childId: number) =>
    apiRequest<Measurement[]>(`/children/${childId}/measurements`),
  getAllMeasurements: () => apiRequest<Measurement[]>("/measurements"),
  createMeasurement: (childId: number, payload: MeasurementInput) =>
    apiRequest<Measurement>(`/children/${childId}/measurements`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteMeasurement: (id: number) =>
    apiRequest<void>(`/measurements/${id}`, { method: "DELETE" }),
  predict: (payload: PredictionRequest) =>
    apiRequest<PredictionResponse>("/predict", { method: "POST", body: JSON.stringify(payload) }),
  chatbot: (message: string, childContext?: ChatChildContext | null, childId?: number | null) =>
    apiRequest<ChatResponse>("/chatbot", {
      method: "POST",
      body: JSON.stringify({ message, child_context: childContext ?? null, child_id: childId ?? null }),
    }),
  getModelInfo: () => apiRequest<ModelInfo>("/model/info"),
  getConsultations: (params?: { status?: ConsultationStatus; childId?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status_filter", params.status);
    if (params?.childId) query.set("child_id", String(params.childId));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<Consultation[]>(`/consultations${suffix}`);
  },
  createConsultation: (payload: ConsultationInput) =>
    apiRequest<Consultation>("/consultations", { method: "POST", body: JSON.stringify(payload) }),
  replyConsultation: (id: number, reply: string, status: ConsultationStatus = "answered") =>
    apiRequest<Consultation>(`/consultations/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply, status }),
    }),
  updateConsultationStatus: (id: number, status: ConsultationStatus) =>
    apiRequest<Consultation>(`/consultations/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
