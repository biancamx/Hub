"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, Copy, ExternalLink, Globe, HelpCircle, Key, Search, Sparkles, X } from "lucide-react";
import AccessRequestModal from "@/components/AccessRequestModal";

interface SiteAccess { _id: string; systemInterest: string; siteUrl: string; siteUser?: string; passwordViewed?: boolean; credentialsForgot?: boolean; }
interface DefaultSite { _id: string; title: string; url: string; active?: boolean; }

interface QuickSearchCardProps {
  isGridActive?: boolean;
  onToggleGrid?: () => void;
  totalCardsCount?: number;
}

export default function QuickSearchCard({ isGridActive = false, onToggleGrid, totalCardsCount }: QuickSearchCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [defaultSites, setDefaultSites] = useState<DefaultSite[]>([]);
  const [myPrivateSites, setMyPrivateSites] = useState<SiteAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [credentialModal, setCredentialModal] = useState<{ systemName: string; siteUrl: string; siteUser: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const [privateResponse, defaultResponse] = await Promise.all([fetch("/api/user/my-sites"), fetch("/api/quick-sites")]);
        const privateData = await privateResponse.json();
        const defaultData = await defaultResponse.json();
        if (privateData.success) setMyPrivateSites(privateData.data);
        if (defaultData.success) setDefaultSites(defaultData.data);
      } catch { console.error("Erro ao buscar sites"); } finally { setLoading(false); }
    };
    void fetchSites();
  }, []);

  const revealPassword = async (requestId: string, systemName: string, event: React.MouseEvent) => {
    event.preventDefault(); event.stopPropagation();
    if (!window.confirm("Atenção: esta senha será exibida apenas UMA ÚNICA VEZ. Deseja visualizar agora?")) return;
    try {
      const response = await fetch("/api/user/my-sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) });
      const data = await response.json();
      if (!data.success) { alert(data.error); return; }
      setCredentialModal({ systemName, siteUrl: data.siteUrl, siteUser: data.siteUser || "Não informado", password: data.password });
      setMyPrivateSites((previous) => previous.map((site) => site._id === requestId ? { ...site, passwordViewed: true } : site));
    } catch { alert("Erro ao revelar senha."); }
  };

  const forgotPassword = async (requestId: string, systemName: string, event: React.MouseEvent) => {
    event.preventDefault(); event.stopPropagation();
    if (!window.confirm(`Deseja solicitar a recuperação das credenciais para [${systemName}]?`)) return;
    try {
      const response = await fetch("/api/user/request-site-credentials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, systemName }) });
      const data = await response.json();
      if (!data.success) { alert(data.error || "Erro ao solicitar."); return; }
      alert("Solicitação enviada com sucesso!");
      setMyPrivateSites((previous) => previous.map((site) => site._id === requestId ? { ...site, credentialsForgot: true } : site));
    } catch { alert("Erro de conexão."); }
  };

  const filteredDefaultSites = defaultSites.filter((site) => site.title.toLowerCase().includes(filter.toLowerCase()));
  const filteredPrivateSites = myPrivateSites.filter((site) => site.systemInterest.toLowerCase().includes(filter.toLowerCase()));
  const totalSitesCount = defaultSites.length + myPrivateSites.length;
  const totalCount = totalCardsCount !== undefined ? totalCardsCount : totalSitesCount;

  return <>
    <button id="tour-quick-sites-pill" type="button" onClick={onToggleGrid ? onToggleGrid : () => {}} title={isGridActive ? "Voltar ao modo Carrossel" : "Ver todos os sites em grade expandida"} className={`group h-11 border backdrop-blur-xl px-4 rounded-full transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95 ${isGridActive ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-lg shadow-blue-500/30" : "bg-white/90 hover:bg-white text-slate-800 border-slate-200/90 shadow-[0_10px_25px_rgba(15,23,42,0.06)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.1)]"}`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-transform ${isGridActive ? "bg-white/20 text-white" : "bg-blue-50 border border-blue-100 text-blue-600 group-hover:scale-105"}`}><Globe size={13} /></span>
      <span className={`text-xs font-bold whitespace-nowrap transition-colors ${isGridActive ? "text-white" : "text-slate-800 group-hover:text-blue-600"}`}>Acessos Sites</span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${isGridActive ? "bg-blue-700 text-white border-blue-400/40" : "bg-slate-100 text-slate-500 border-slate-200/70"}`}>{totalCount}</span>
    </button>

    {isOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-white rounded-[36px] p-6 sm:p-7 shadow-2xl relative text-slate-800" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={() => setIsOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100"><X size={18} /></button>
        <div className="flex items-center gap-3 mb-5 pr-8"><div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600"><Globe size={20} /></div><div><h3 className="text-lg font-extrabold text-slate-900">Acessos a Sites &amp; Ferramentas</h3><p className="text-xs text-slate-500">{totalSitesCount} atalhos disponíveis</p></div></div>
        <div className="bg-[#f1f4f8] border border-slate-200/70 rounded-[28px] p-4 sm:p-5">
          <div className="relative mb-3.5"><Search size={14} className="absolute left-3.5 top-3 text-slate-400" /><input type="text" placeholder="Filtrar atalhos por nome..." value={filter} onChange={(event) => setFilter(event.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500" /></div>
          {myPrivateSites.length > 0 && <section className="mb-4"><span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-2.5"><Sparkles size={11} />Meus Acessos Liberados ({myPrivateSites.length})</span><div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">{loading ? <div className="h-12 rounded-2xl bg-white animate-pulse" /> : filteredPrivateSites.map((site) => <div key={site._id} className="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90"><a href={site.siteUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 pr-1"><span className="text-xs font-bold truncate block group-hover:text-blue-600">{site.systemInterest}</span></a><span className="flex items-center gap-1">{!site.passwordViewed ? <button onClick={(event) => revealPassword(site._id, site.systemInterest, event)} title="Ver credenciais" className="p-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-300"><Key size={11} /></button> : <button onClick={(event) => forgotPassword(site._id, site.systemInterest, event)} title="Esqueci a senha" className="p-1 text-slate-300 hover:text-slate-600"><HelpCircle size={13} /></button>}<ChevronRight size={13} className="text-slate-300" /></span></div>)}</div></section>}
          <section><span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2 px-1">Sistemas Globais Padrão</span><div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">{filteredDefaultSites.map((site) => <a key={site._id} href={site.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200/80 transition-all"><span className="text-xs font-bold truncate">{site.title}</span><ChevronRight size={14} /></a>)}</div></section>
          <button type="button" onClick={() => { setIsOpen(false); setIsRequestModalOpen(true); }} className="w-full mt-4 flex items-center justify-between p-3.5 px-5 rounded-2xl bg-white text-slate-900 border border-slate-200/80"><span className="text-xs font-black">Solicitar Acesso a Outro Site</span><ChevronRight size={14} /></button>
        </div>
      </div>
    </div>}

    <AccessRequestModal isOpen={isRequestModalOpen} onClose={() => { setIsRequestModalOpen(false); setIsOpen(true); }} />
    {credentialModal && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setCredentialModal(null)}><div className="bg-white border border-slate-200 rounded-[32px] p-6 max-w-sm w-full shadow-2xl relative text-slate-800" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setCredentialModal(null)} className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-400"><X size={16} /></button><h4 className="text-base font-extrabold text-slate-900 mb-4">{credentialModal.systemName}</h4><div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs"><div><span className="block text-[10px] uppercase font-bold text-slate-400">Usuário / Login</span><strong className="font-mono">{credentialModal.siteUser}</strong></div><div><span className="block text-[10px] uppercase font-bold text-slate-400">Senha</span><div className="flex gap-2"><strong className="font-mono text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 flex-1 truncate">{credentialModal.password}</strong><button type="button" onClick={() => { void navigator.clipboard.writeText(credentialModal.password); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }} className="p-1.5 rounded-lg border border-slate-200">{copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}</button></div></div></div><p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 my-4">Guarde sua senha. Ela não poderá ser exibida novamente.</p><a href={credentialModal.siteUrl} target="_blank" rel="noopener noreferrer" onClick={() => setCredentialModal(null)} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5">Ir para o Site Agora <ExternalLink size={13} /></a></div></div>}
  </>;
}
