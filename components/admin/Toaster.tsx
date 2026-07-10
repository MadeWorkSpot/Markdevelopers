"use client";

import { useState, useEffect } from "react";

type ToastType = "success" | "error";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

let toastId = 0;
let listeners: ((t: Toast) => void)[] = [];

function emit(t: Toast) {
  listeners.forEach((fn) => fn(t));
}

export function toast(message: string, type: ToastType = "success") {
  emit({ id: ++toastId, message, type });
}

toast.success = (message: string) => toast(message, "success");
toast.error = (message: string) => toast(message, "error");

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4000);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div style={{ position: "fixed", right: 16, top: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            borderRadius: 8,
            border: "1px solid",
            padding: "8px 16px",
            fontSize: 14,
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            animation: "toast-in 0.2s ease-out",
            ...(t.type === "success"
              ? { borderColor: "rgba(34,197,94,0.3)", background: "rgba(5,46,22,0.95)", color: "rgb(134,239,172)" }
              : { borderColor: "rgba(239,68,68,0.3)", background: "rgba(69,10,10,0.95)", color: "rgb(252,165,165)" }),
          }}
        >
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toast-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}
