"use client";

import { useEffect, useState } from "react";

export default function PasswordResetNotice() {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/users");
        const result = await response.json();
        setPending(Boolean(result.success && result.data?.some((user: { passwordResetRequested?: boolean }) => user.passwordResetRequested)));
      } catch {
        setPending(false);
      }
    };
    void load();
  }, []);

  if (!pending) return null;
  return <div className="fixed right-6 top-24 z-40 animate-pulse rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 shadow-sm">Há usuários aguardando redefinição de senha.</div>;
}
