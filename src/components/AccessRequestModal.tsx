"use client";

import { useState } from "react";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccessRequestModal({ isOpen, onClose }: AccessRequestModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [setor, setSetor] = useState("");
  const [systemInterest, setSystemInterest] = useState("");
  const [priority, setPriority] = useState("Baixa");
  const [justification, setJustification] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          empresa,
          setor,
          systemInterest,
          priority,
          message: justification,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setName("");
          setEmail("");
          setEmpresa("");
          setSetor("");
          setSystemInterest("");
          setJustification("");
          onClose();
        }, 2000);
      } else {
        alert(data.error || "Erro ao enviar solicitação.");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white/95 backdrop-blur-2xl border border-white rounded-[36px] p-6 sm:p-8 max-w-xl w-full shadow-2xl relative font-sans text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            Acesso Solicitado
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Solicitar Acesso
          </h2>
        </div>

        {success ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 size={24} />
            </div>
            <p className="font-bold text-slate-900 text-base">Solicitação enviada com sucesso!</p>
            <p className="text-xs text-slate-500">A Matriz e os Administradores foram notificados.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@empresa.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa</label>
                <input
                  type="text"
                  required
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Nome da empresa"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Setor</label>
                <input
                  type="text"
                  required
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  placeholder="Ex: Operações"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sistema / serviço de interesse</label>
                <input
                  type="text"
                  required
                  value={systemInterest}
                  onChange={(e) => setSystemInterest(e.target.value)}
                  placeholder="Ex: ERP, BI, Portais"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-inner"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Justificativa</label>
              <textarea
                required
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Descreva rapidamente a necessidade do acesso e o que será utilizado."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none shadow-inner"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3 rounded-2xl transition shadow-md shadow-blue-500/20 text-xs flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar solicitação
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
