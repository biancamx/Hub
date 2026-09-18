"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Layers, Mail, Lock, User, Loader2, CheckCircle2, AlertCircle, Clock, ShieldAlert } from "lucide-react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "warning"; title?: string; text: string; showRetry?: boolean } | null>(() => {
    if (urlError?.includes("PENDING_APPROVAL")) return { type: "warning", title: "Acesso Aguardando Aprovação", text: "Sua solicitação foi enviada aos administradores. Assim que aprovada, tente entrar novamente!", showRetry: true };
    if (urlError?.includes("ACCOUNT_REJECTED")) return { type: "error", title: "Acesso Não Autorizado", text: "O acesso desta conta foi recusado pela administração." };
    return null;
  });

  useEffect(() => {
    if (countdownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setNotification({ type: "success", title: "Bloqueio Expirado", text: "O tempo de penalidade acabou. Você já pode tentar digitar sua senha novamente!" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSeconds]);

  const formatTime = (totalSec: number) => `${String(Math.floor(totalSec / 60)).padStart(2, "0")}:${String(totalSec % 60).padStart(2, "0")}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (countdownSeconds > 0) return;
    setNotification(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
        const data = await response.json();
        if (!data.success) {
          setNotification({ type: "error", text: data.error });
          setLoading(false);
          return;
        }
        setNotification({ type: "warning", title: "Solicitação Enviada!", text: "Sua conta foi criada e está pendente de liberação pelo Administrador.", showRetry: true });
        setMode("login");
        setName("");
        setPassword("");
        setLoading(false);
      } else {
        const result = await signIn("credentials", { email, password, redirect: false });
        if (result?.error) {
          const errorText = result.error;
          if (errorText.includes("LOCKED_")) {
            const minutes = Number.parseInt(errorText.split("LOCKED_")[1], 10) || 5;
            setCountdownSeconds(minutes * 60);
            setNotification({ type: "error", title: "Acesso Temporariamente Bloqueado", text: "Muitas tentativas com senha incorreta. O acesso foi bloqueado por segurança." });
          } else if (errorText.includes("PENDING_APPROVAL")) {
            setNotification({ type: "warning", title: "Aguardando Liberação", text: "Seu acesso ainda não foi aprovado pelo Administrador.", showRetry: true });
          } else if (errorText.includes("ACCOUNT_REJECTED")) {
            setNotification({ type: "error", title: "Acesso Recusado", text: "Seu cadastro foi recusado pela administração." });
          } else {
            setNotification({ type: "error", text: "E-mail ou senha incorretos." });
          }
          setLoading(false);
          return;
        }
        setNotification({ type: "success", text: "Login realizado com sucesso! Entrando..." });
        setTimeout(() => router.push(callbackUrl), 800);
      }
    } catch {
      setNotification({ type: "error", text: "Ocorreu um erro de conexão." });
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/95 border border-slate-200/90 rounded-3xl p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 mb-3 text-white"><Layers className="w-6 h-6" /></div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hub Corporativo</h1>
        <p className="text-xs text-slate-500 mt-1">Acesso seguro e centralizado aos sistemas</p>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-2xl mb-6 border border-slate-200">
        <button type="button" onClick={() => { setMode("login"); setNotification(null); }} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === "login" ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900"}`}>Entrar</button>
        <button type="button" onClick={() => { setMode("register"); setNotification(null); }} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === "register" ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900"}`}>Solicitar Acesso</button>
      </div>

      {countdownSeconds > 0 && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 mb-5 text-center"><ShieldAlert className="w-7 h-7 text-rose-600 mx-auto mb-1" /><p className="text-xs font-bold uppercase tracking-wider">Acesso Bloqueado Temporariamente</p><p className="text-2xl font-mono font-extrabold text-rose-900 my-1">{formatTime(countdownSeconds)}</p></div>}

      {notification && countdownSeconds === 0 && <div className={`p-4 rounded-2xl text-xs mb-5 border ${notification.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : notification.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}><div className="flex items-start gap-2.5">{notification.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}{notification.type === "warning" && <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}{notification.type === "error" && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}<div className="flex-1">{notification.title && <p className="font-bold text-xs mb-0.5">{notification.title}</p>}<p className="leading-relaxed">{notification.text}</p></div></div></div>}

      <button onClick={() => signIn("google", { callbackUrl })} disabled={loading || countdownSeconds > 0} type="button" className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-4 py-3 rounded-xl border border-slate-200 transition-all text-xs mb-5 shadow-sm active:scale-[0.98] disabled:opacity-50"><FcGoogle size={20} /><span>Continuar com Google</span></button>

      <div className="relative flex py-2 items-center mb-5"><div className="flex-grow border-t border-slate-200" /><span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-wider font-bold">ou e-mail</span><div className="flex-grow border-t border-slate-200" /></div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === "register" && <div><label className="block text-xs font-semibold text-slate-700 mb-1">Seu Nome</label><div className="relative"><User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" /><input type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Carlos Mendes" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition" /></div></div>}
        <div><label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Corporativo</label><div className="relative"><Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" /><input type="email" required disabled={countdownSeconds > 0} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="carlos@empresa.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-50" /></div></div>
        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label><div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" /><input type="password" required disabled={countdownSeconds > 0} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-50" /></div></div>
        <button type="submit" disabled={loading || countdownSeconds > 0} className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition shadow-md shadow-blue-500/15 text-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-40">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : countdownSeconds > 0 ? `Aguarde ${formatTime(countdownSeconds)}` : mode === "login" ? "Entrar no Sistema" : "Enviar Solicitação"}</button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return <main className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4"><Suspense fallback={<div className="text-slate-600 text-xs">Carregando...</div>}><AuthForm /></Suspense></main>;
}
