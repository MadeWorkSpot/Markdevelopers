"use client";

import { useState, useCallback, createContext, useContext } from "react";

type ConfirmContextType = (message: string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextType>(() => Promise.resolve(false));

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              width: "100%", maxWidth: 384,
              borderRadius: 12, border: "1px solid #3f3f46",
              background: "#18181b", padding: 24,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <p style={{ marginBottom: 24, fontSize: 14, color: "#d4d4d8" }}>{state.message}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                onClick={handleCancel}
                style={{
                  borderRadius: 8, border: "1px solid #3f3f46",
                  padding: "8px 16px", fontSize: 14, color: "#a1a1aa",
                  background: "transparent", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  borderRadius: 8, border: "none",
                  padding: "8px 16px", fontSize: 14, fontWeight: 500, color: "#fff",
                  background: "#dc2626", cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
