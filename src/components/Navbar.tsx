"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AlertCircle, ArrowRight, Bell, CheckCircle2, Clock, Crown, Globe, KeyRound, Loader2, Lock, LogOut, ShieldCheck, X } from "lucide-react";

interface NavbarProps { user: { name?: string | null; email?: string | null; image?: string | null; role?: string } }
interface NotificationUser { _id: string; name?: string; email: string; image?: string; avatarUrl?: string }
type Feedback = { type: "success" | "error"; text: string } | null;

export default function Navbar({ user }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ total: number; resetRequests: number; pendingUsers: number; pendingAccessRequests: number }>({ total: 0, resetRequests: 0, pendingUsers: 0, pendingAccessRequests: 0 });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (user.role !== "admin" && user.role !== "master") return;
    const load = async () => {
      try {
        const result = await (await fetch("/api/admin/notifications", { cache: "no-store" })).json();
        if (result.success) setNotifications(result.data);
      } catch {
        // Mantém o último estado válido.
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(interval);
  }, [user.role]);

  const navigateTo = (url: string) => {
    setNotificationsOpen(false);
    setDropdownOpen(false);
    window.location.href = url;
  };

  const goToAdminUsers = () => navigateTo("/admin");

  const initials = user.name?.trim().charAt(0).toUpperCase() || "U";

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", text: "A confirmação da nova senha não confere." });
      return;
    }
    setLoading(true);
    try {
      const result = await (await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })).json();
      if (!result.success) {
        setFeedback({ type: "error", text: result.error || "Erro ao alterar a senha." });
        return;
      }
      setFeedback({ type: "success", text: "Senha alterada com sucesso!" });
      window.setTimeout(() => {
        setPasswordModalOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setFeedback(null);
      }, 1200);
    } catch {
      setFeedback({ type: "error", text: "Erro ao conectar com o servidor." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="w-full bg-transparent text-stone-900 sticky top-0 z-50 px-8 py-5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3.5 group transition">
            <img
              src="/logo.png"
              alt="Logotipo"
              className="h-15 w-auto object-contain group-hover:scale-105 transition-transform"
            />
           
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {(user.role === "admin" || user.role === "master") && (
            <div className="relative">
              <button onClick={() => { setNotificationsOpen(!notificationsOpen); setDropdownOpen(false); }} aria-label="Notificações" className={`relative p-2.5 rounded-full transition border shadow-sm ${notifications.total > 0 ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-white/80 hover:bg-white text-slate-700 border-slate-200/80 backdrop-blur-md"}`}>
                <Bell size={18} />
                {notifications.total > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">{notifications.total}</span>}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white/95 border border-slate-200 shadow-2xl z-50 overflow-hidden backdrop-blur-2xl text-slate-800">
                  <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between"><p className="text-sm font-bold flex items-center gap-2">Central de Solicitações <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-xs">{notifications.total}</span></p><button onClick={goToAdminUsers} className="text-xs text-blue-700 hover:text-blue-800 font-semibold">Abrir painel <ArrowRight size={12} className="inline" /></button></div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-800 p-1">
                    {notifications.total === 0 ? (
                      <div className="px-4 py-6 text-center text-stone-400 text-xs">
                        <CheckCircle2 size={24} className="mx-auto mb-2 opacity-50 text-emerald-400" />
                        Tudo tranquilo por aqui!<br/>Nenhuma pendência.
                      </div>
                    ) : (
                      <>
                        {notifications.resetRequests > 0 && (
                          <button
                            type="button"
                            onClick={() => navigateTo("/admin?tab=users&filter=reset")}
                            className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-amber-500/10 transition text-left group cursor-pointer"
                          >
                            <div className="p-2 rounded-full bg-amber-500/20 text-amber-400 group-hover:scale-110 transition">
                              <KeyRound size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-amber-300">Pedidos de Senha</p>
                              <p className="text-xs text-stone-400 mt-0.5">
                                {notifications.resetRequests} usuário(s) solicitaram redefinição.
                              </p>
                            </div>
                          </button>
                        )}

                        {notifications.pendingUsers > 0 && (
                          <button
                            type="button"
                            onClick={() => navigateTo("/admin?tab=users&filter=pending")}
                            className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-500/10 transition text-left group mt-1 cursor-pointer"
                          >
                            <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition">
                              <Clock size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-emerald-300">Novos Cadastros</p>
                              <p className="text-xs text-stone-400 mt-0.5">
                                {notifications.pendingUsers} conta(s) aguardando aprovação.
                              </p>
                            </div>
                          </button>
                        )}

                        {notifications.pendingAccessRequests > 0 && (
                          <button
                            type="button"
                            onClick={() => navigateTo("/admin?tab=requests")}
                            className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-blue-500/10 transition text-left group mt-1 cursor-pointer"
                          >
                            <div className="p-2 rounded-full bg-blue-500/20 text-blue-400 group-hover:scale-110 transition">
                              <Globe size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-blue-300">Acessos a Sites</p>
                              <p className="text-xs text-stone-400 mt-0.5">
                                {notifications.pendingAccessRequests} pedido(s) de liberação de sistema.
                              </p>
                            </div>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <button onClick={() => { setDropdownOpen(!dropdownOpen); setNotificationsOpen(false); }} className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 backdrop-blur-md transition-all focus:outline-none shadow-sm">
              {user.image ? <img src={user.image} alt={user.name || "Usuário"} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200" /> : <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">{initials}</div>}
              <div className="text-left hidden sm:block"><p className="text-xs font-bold leading-tight text-slate-800">{user.name || "Usuário"}</p><span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 border ${user.role === "master" ? "bg-amber-50 text-amber-800 border-amber-300 shadow-sm" : user.role === "admin" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>{user.role === "master" && <Crown size={11} className="text-amber-700" />}{user.role === "master" ? "MATRIZ" : user.role === "admin" ? "ADMIN" : "USUÁRIO"}</span></div>
            </button>

            {dropdownOpen && <div className="absolute right-0 mt-3 w-64 rounded-3xl bg-white/95 border border-slate-200 shadow-2xl py-2 z-50 backdrop-blur-2xl text-slate-800"><div className="px-5 py-3.5 border-b border-slate-200"><p className="text-sm font-bold text-slate-900 truncate">{user.name}</p><p className="text-xs text-slate-500 truncate">{user.email}</p></div><div className="p-1.5 space-y-1">{(user.role === "admin" || user.role === "master") && <Link href="/admin" className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs rounded-2xl hover:bg-slate-100 text-slate-700 font-semibold transition" onClick={() => setDropdownOpen(false)}><ShieldCheck className="w-4 h-4 text-blue-600" /> Painel de Controle</Link>}<button onClick={() => { setDropdownOpen(false); setPasswordModalOpen(true); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs rounded-2xl hover:bg-slate-100 text-slate-700 font-medium transition"><KeyRound className="w-4 h-4 text-slate-500" /> Alterar Minha Senha</button><button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs rounded-2xl hover:bg-rose-50 text-rose-700 font-medium transition"><LogOut className="w-4 h-4 text-rose-600" /> Sair do Sistema</button></div></div>}
          </div>
        </div>
      </header>

      {passwordModalOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"><div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl"><button type="button" onClick={() => setPasswordModalOpen(false)} className="absolute right-5 top-5 rounded-lg bg-slate-100 p-1 text-slate-500"><X size={18} /></button><div className="mb-5 flex items-center gap-3"><KeyRound className="text-amber-600" /><h2 className="text-xl font-bold">Alterar Minha Senha</h2></div>{feedback && <div className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{feedback.text}</div>}<form onSubmit={changePassword} className="space-y-3"><label className="block text-sm">Senha atual<input type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" /></label><label className="block text-sm">Nova senha<input type="password" required minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" /></label><label className="block text-sm">Confirmar nova senha<input type="password" required minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" /></label><button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />} Salvar Nova Senha</button></form></div></div>}
    </>
  );
}
