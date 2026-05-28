import type {
  ChatResponse,
  Child,
  ChildInput,
  DashboardSummary,
  Measurement,
  MeasurementInput,
  ModelInfo,
  PredictionRequest,
  PredictionResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request gagal (${response.status})`;
    try {
      const payload = await response.json();
      message = payload.detail ?? message;
    } catch {
      message = response.statusText || message;
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
  createMeasurement: (childId: number, payload: MeasurementInput) =>
    apiRequest<Measurement>(`/children/${childId}/measurements`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteMeasurement: (id: number) =>
    apiRequest<void>(`/measurements/${id}`, { method: "DELETE" }),
  predict: (payload: PredictionRequest) =>
    apiRequest<PredictionResponse>("/predict", { method: "POST", body: JSON.stringify(payload) }),
  chatbot: (message: string) =>
    apiRequest<ChatResponse>("/chatbot", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  getModelInfo: () => apiRequest<ModelInfo>("/model/info"),
};
