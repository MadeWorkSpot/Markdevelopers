"use client";

import { useState, useEffect } from "react";

function formatRelative(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export default function RelativeTime({ timestamp }: { timestamp: number }) {
  const [relative, setRelative] = useState(() => formatRelative(Date.now() - timestamp));

  useEffect(() => {
    const id = setInterval(() => setRelative(formatRelative(Date.now() - timestamp)), 30_000);
    return () => clearInterval(id);
  }, [timestamp]);

  return (
    <span title={new Date(timestamp).toLocaleString()} className="cursor-default">
      {relative}
    </span>
  );
}
