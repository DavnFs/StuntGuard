import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function TopLoadingBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(15);

    const timer1 = setTimeout(() => setProgress(45), 80);
    const timer2 = setTimeout(() => setProgress(75), 180);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setVisible(false), 150);
    }, 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 transition-all duration-300 ease-out shadow-[0_1px_8px_rgba(6,182,212,0.6)]"
      style={{ width: `${progress}%`, opacity: visible ? 1 : 0 }}
    />
  );
}

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md">
      <div className="flex flex-col items-center space-y-4">
        {/* Pulsing logo Container */}
        <div className="relative flex items-center justify-center h-20 w-20 rounded-3xl bg-white shadow-2xl animate-pulse">
          <img src="/logo.png" alt="StuntGuard Logo" className="h-12 w-12 object-contain" />
          <span className="absolute -inset-1 rounded-3xl border border-cyan-500/30 animate-ping opacity-75" />
        </div>
        <div className="flex flex-col items-center space-y-2">
          <h3 className="font-heading text-lg font-bold text-white tracking-wide">StuntGuard</h3>
          <div className="flex items-center space-x-1.5" aria-hidden="true">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-xs font-semibold text-slate-200 tracking-wider">Memuat Halaman...</span>
        </div>
      </div>
    </div>
  );
}
