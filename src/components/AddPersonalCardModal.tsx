"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { X, Plus, Upload, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";

interface AddPersonalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPersonalCardModal({ isOpen, onClose, onSuccess }: AddPersonalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem selecionada é muito pesada. Escolha um arquivo de até 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          url,
          imageUrl,
          isPersonal: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTitle("");
        setDescription("");
        setUrl("");
        setImageUrl("");
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Erro ao adicionar sistema pessoal.");
      }
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
      <div
        className="bg-white/95 backdrop-blur-2xl border border-white rounded-[36px] p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Novo Sistema Pessoal</h2>
            <p className="text-xs text-slate-500 font-medium">Este atalho aparecerá exclusivamente no seu carrossel.</p>
          </div>
        </div>

        {error && <div className="my-3 p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs border border-rose-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nome do Sistema *</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Figma, Canva, Notion..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-inner" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Descrição Curta</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Minhas demandas de design e prototipagem..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none shadow-inner" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Link de Acesso (URL) *</label>
            <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.figma.com" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-inner" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ícone ou Logo *</label>
            {imageUrl && (
              <div className="mb-2 relative w-full h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center p-2">
                <img src={imageUrl} alt="Prévia" className="max-h-full max-w-full object-contain" />
                <button type="button" onClick={() => setImageUrl("")} className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-900/70 text-white text-[10px] font-bold">Trocar</button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 cursor-pointer text-center transition">
                <Upload size={18} className="text-slate-500 mb-1" />
                <span className="text-[11px] font-bold text-slate-700">Enviar do PC</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <div className="flex flex-col justify-center p-3 rounded-2xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1"><ImageIcon size={13} className="text-slate-400" />Ou colar link</span>
                <input type="url" value={imageUrl.startsWith("data:") ? "" : imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://.../logo.png" className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 rounded-2xl transition shadow-lg shadow-blue-500/20 text-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Adicionar ao Meu Carrossel
          </button>
        </form>
      </div>
    </div>
  );
}
