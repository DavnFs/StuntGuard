import { AlertCircle, Loader2 } from "lucide-react";

export function LoadingBlock({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-slate-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
