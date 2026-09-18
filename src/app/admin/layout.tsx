import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import PasswordResetNotice from "@/components/PasswordResetNotice";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  const user = session.user as typeof session.user & {
    role?: "master" | "admin" | "user";
  };

  if (user.role !== "admin" && user.role !== "master") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-6 text-center text-slate-900">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-slate-50 p-10 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">Acesso negado</h1>
          <p className="mt-3 text-slate-600">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-slate-700 underline">
            Voltar para o Hub
          </Link>
        </div>
      </main>
    );
  }

  return <><PasswordResetNotice />{children}</>;
}
