"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Logout button — clears auth cookies and redirects to login.
 */
export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      {loading ? "…" : "Logout"}
    </button>
  );
}
