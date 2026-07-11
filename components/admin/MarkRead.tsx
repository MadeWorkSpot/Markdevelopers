"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markMessagesAsRead } from "@/actions";
import { toast } from "./Toaster";

export default function MarkRead() {
  const router = useRouter();

  useEffect(() => {
    markMessagesAsRead()
      .then(() => {
        // Refresh so the layout re-fetches unreadCount and the badge clears
        router.refresh();
      })
      .catch(() => toast.error("Failed to mark messages as read"));
  }, [router]);

  return null;
}
