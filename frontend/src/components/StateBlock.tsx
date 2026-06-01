import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function LoadingBlock({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8 text-sm font-semibold text-slate-500 shadow-card">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-700" />
      {label}
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-card">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SuccessBlock({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-2xl border border-care-200 bg-care-50 p-4 text-sm font-medium text-care-800">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
