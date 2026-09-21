"use client";

import { useState } from "react";
import { X, Lock, Link as LinkIcon, User, Eye, EyeOff, Wand2, CheckCircle2, Loader2 } from "lucide-react";

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  userName: string;
  systemName: string;
  onSuccess: () => void;
}

export default function ApproveRequestModal({
  isOpen,
  onClose,
  requestId,
  userName,
  systemName,
  onSuccess,
}: ApproveModalProps) {
  const [siteUrl, setSiteUrl] = useState("");
  const [siteUser, setSiteUser] = useState("");
  const [sitePassword, setSitePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*?";
    let password = "";
    for (let index = 0; index < 12; index += 1) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSitePassword(password);
    setShowPassword(true);
  };

  const handleApprove = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status: "approved", siteUrl, siteUser, sitePassword }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Erro ao liberar acesso.");
      }
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-stretch justify-end animate-in fade-in duration-200">
      <div
        className="bg-white/95 backdrop-blur-2xl border-l border-white p-6 sm:p-8 max-w-md w-full h-full overflow-y-auto shadow-2xl relative font-sans text-slate-800 animate-in slide-in-from-right duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition"
        >
          <X size={18} />
        </button>

        <div className="mb-5">
          <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Liberação de Credenciais
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">Liberar Acesso para {userName}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistema solicitado: <strong className="text-slate-700">{systemName}</strong>
          </p>
        </div>

        {error && <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">{error}</div>}

        <form onSubmit={handleApprove} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Link de Acesso (URL) *</label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type="url" required value={siteUrl} onChange={(event) => setSiteUrl(event.target.value)} placeholder="https://sistema.empresa.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-inner" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Usuário / Login de Acesso *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type="text" required value={siteUser} onChange={(event) => setSiteUser(event.target.value)} placeholder="Ex: joao.silva ou matrícula" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-inner" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Senha de Acesso *</label>
              <button type="button" onClick={generateStrongPassword} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Wand2 size={12} /> Gerar Senha Forte
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type={showPassword ? "text" : "password"} required value={sitePassword} onChange={(event) => setSitePassword(event.target.value)} placeholder="Digite ou gere a senha" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-inner font-mono" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">* O colaborador visualizará esta senha apenas uma vez.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md shadow-emerald-500/20 text-xs flex items-center gap-2 active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Confirmar e Liberar Acesso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
