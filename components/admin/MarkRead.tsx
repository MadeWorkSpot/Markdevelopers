"use client";

import { useEffect } from "react";
import { markMessagesAsRead } from "@/actions";
import { toast } from "./Toaster";

export default function MarkRead() {
  useEffect(() => {
    markMessagesAsRead().catch(() => toast.error("Failed to mark messages as read"));
  }, []);
  return null;
}
