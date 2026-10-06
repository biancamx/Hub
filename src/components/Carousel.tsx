"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe,
  Key,
  LayoutGrid,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import AccessRequestModal from "@/components/AccessRequestModal";
import QuickSearchCard from "@/components/QuickSearchCard";

interface CardItem {
  _id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  isPersonal?: boolean;
}

interface SiteItem {
  _id: string;
  title: string;
  url: string;
  description?: string;
  isPrivate?: boolean;
  siteUser?: string;
  passwordViewed?: boolean;
  credentialsForgot?: boolean;
}

const fallbackImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200";

export default function Carousel() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [personalCards, setPersonalCards] = useState<CardItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [accessSites, setAccessSites] = useState<SiteItem[]>([]);
  const [siteSearch, setSiteSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGridMode, setIsGridMode] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [credentialModal, setCredentialModal] = useState<{ systemName: string; siteUrl: string; siteUser: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formImage, setFormImage] = useState("");
  const [submittingPersonal, setSubmittingPersonal] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const responses = await Promise.all([
        fetch("/api/cards"),
        fetch("/api/user/favorites"),
        fetch("/api/quick-sites"),
        fetch("/api/user/my-sites"),
        fetch("/api/user/personal-links"),
      ]);
      const [cardsData, favoritesData, quickData, privateData, personalData] = await Promise.all(responses.map((response) => response.json()));
      if (cardsData.success) setCards(cardsData.data);
      if (favoritesData.success) setFavorites(favoritesData.data);
      if (personalData.success && Array.isArray(personalData.data)) {
        setPersonalCards(personalData.data.map((link: CardItem) => ({ ...link, isPersonal: true })));
      }

      const sites: SiteItem[] = [];
      if (quickData.success && Array.isArray(quickData.data)) {
        quickData.data.forEach((site: { _id: string; title: string; url: string }) => {
          sites.push({ _id: site._id, title: site.title, url: site.url, description: "Acesso corporativo padrão" });
        });
      }
      if (privateData.success && Array.isArray(privateData.data)) {
        privateData.data.forEach((site: { _id: string; systemInterest: string; siteUrl: string; siteUser?: string; passwordViewed?: boolean; credentialsForgot?: boolean }) => {
          sites.push({ _id: site._id, title: site.systemInterest, url: site.siteUrl, description: "Acesso privado liberado", isPrivate: true, siteUser: site.siteUser, passwordViewed: site.passwordViewed, credentialsForgot: site.credentialsForgot });
        });
      }
      setAccessSites(sites);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void Promise.resolve().then(fetchAllData); }, []);

  const toggleFavorite = async (cardId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const previous = favorites;
    const next = favorites.includes(cardId) ? favorites.filter((id) => id !== cardId) : [...favorites, cardId];
    setFavorites(next);
    try {
      const response = await fetch("/api/user/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId }) });
      if (!response.ok) setFavorites(previous);
    } catch (error) {
      console.error("Erro ao favoritar", error);
      setFavorites(previous);
    }
  };

  const handleRevealPassword = async (requestId: string, systemName: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm("Por segurança, esta senha será exibida apenas UMA VEZ. Deseja visualizar?")) return;
    try {
      const response = await fetch("/api/user/my-sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) });
      const data = await response.json();
      if (!data.success) { alert(data.error); return; }
      setCredentialModal({ systemName, siteUrl: data.siteUrl, siteUser: data.siteUser || "Não informado", password: data.password });
      setAccessSites((previous) => previous.map((site) => site._id === requestId ? { ...site, passwordViewed: true } : site));
    } catch { alert("Erro ao buscar credenciais."); }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) {
      alert("Escolha uma imagem PNG, JPEG, GIF ou WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem deve ter até 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setFormImage(reader.result);
    };
    reader.onerror = () => alert("Não foi possível ler a imagem.");
    reader.readAsDataURL(file);
  };

  const handleCreatePersonalCard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) return;

    setSubmittingPersonal(true);
    try {
      const response = await fetch("/api/user/personal-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          url: formUrl,
          imageUrl: formImage,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.error || "Erro ao criar card.");
        return;
      }

      setPersonalCards((previous) => [{ ...data.data, isPersonal: true }, ...previous]);
      setFormTitle("");
      setFormDescription("");
      setFormUrl("");
      setFormImage("");
      setIsAddModalOpen(false);
      setCurrentIndex(0);
    } catch {
      alert("Erro ao conectar ao servidor.");
    } finally {
      setSubmittingPersonal(false);
    }
  };

  const handleDeletePersonalCard = async (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm("Deseja remover este sistema pessoal do seu Hub?")) return;

    try {
      const response = await fetch(`/api/user/personal-links?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.error || "Erro ao excluir o card.");
        return;
      }
      setPersonalCards((previous) => previous.filter((card) => card._id !== id));
      setCurrentIndex((previous) => Math.max(0, previous - 1));
    } catch {
      alert("Erro ao conectar ao servidor.");
    }
  };

  const combinedCards = [...personalCards, ...cards];
  const sortedCards = [...combinedCards].sort((a, b) => Number(favorites.includes(b._id)) - Number(favorites.includes(a._id)));
  const favoriteCards = combinedCards.filter((card) => favorites.includes(card._id));
  const addSystemCard: CardItem = {
    _id: "add-custom-system-card",
    title: "Adicionar Sistema",
    description: "Cadastre um link ou ferramenta particular no seu carrossel",
    url: "#",
    imageUrl: "",
  };
  const allDisplayCards = [...sortedCards, addSystemCard];
  const filteredAccessSites = accessSites.filter((site) => site.title.toLowerCase().includes(siteSearch.toLowerCase()));
  const handlePrev = () => setCurrentIndex((previous) => (previous === 0 ? allDisplayCards.length - 1 : previous - 1));
  const handleNext = () => setCurrentIndex((previous) => (previous === allDisplayCards.length - 1 ? 0 : previous + 1));

  if (loading) return <div className="w-full flex justify-center py-20"><div style={{ width: "380px", height: "430px" }} className="bg-white rounded-[36px] animate-pulse shadow-xl" /></div>;

  return (
    <div className="w-full flex flex-col items-center select-none py-2 relative">
      {!isGridMode && <div ref={stageRef} className="relative w-full max-w-[1400px] h-[480px] flex items-center justify-center overflow-visible px-16 animate-in fade-in duration-300">
        <div className="absolute w-[500px] h-[350px] rounded-full bg-gradient-to-tr from-blue-500/20 via-sky-400/15 to-indigo-500/10 blur-[120px] pointer-events-none" />
        {allDisplayCards.length > 1 && <button onClick={handlePrev} aria-label="Anterior" className="absolute left-4 sm:left-8 md:left-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white text-slate-800 border border-slate-200 shadow-xl flex items-center justify-center z-40"><ChevronLeft size={24} /></button>}
        {allDisplayCards.map((card, index) => {
          let offset = index - currentIndex;
          if (offset < -Math.floor(allDisplayCards.length / 2)) offset += allDisplayCards.length;
          if (offset > Math.floor(allDisplayCards.length / 2)) offset -= allDisplayCards.length;
          if (Math.abs(offset) > 2) return null;
          const centered = offset === 0;
          const distance = Math.abs(offset);
          const isAddCard = card._id === addSystemCard._id;
          const isFavorited = favorites.includes(card._id);
          return <motion.div key={card._id} onClick={() => { if (!centered) setCurrentIndex(index); }} animate={{ x: offset * 380, scale: centered ? 1 : 0.88, opacity: centered ? 1 : distance === 1 ? 0.25 : 0.08 }} transition={{ type: "spring", stiffness: 220, damping: 26 }} style={{ width: "370px", height: "430px", zIndex: centered ? 30 : distance === 1 ? 20 : 10 }} className={`absolute top-1/2 left-1/2 -ml-[185px] -mt-[215px] rounded-[36px] p-7 flex flex-col justify-between border bg-white ${centered ? isAddCard ? "border-dashed border-2 border-blue-400 shadow-2xl" : "border-blue-300 shadow-2xl ring-2 ring-blue-500/20" : "border-slate-200 shadow-xl cursor-pointer"}`}>
            {isAddCard ? <>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 font-semibold text-[11px]"><User size={12} /> Meu Atalho</span>
                <span className="text-[10px] text-slate-400 font-semibold">Pessoal</span>
              </div>
              <button type="button" onClick={() => centered && setIsAddModalOpen(true)} className="flex flex-col items-center text-center my-auto px-2" aria-label="Adicionar sistema pessoal">
                <span className="w-20 h-20 rounded-full bg-blue-50 border-2 border-dashed border-blue-300 text-blue-600 flex items-center justify-center mb-3.5"><Plus size={32} /></span>
                <span className="text-2xl font-black text-slate-900 leading-tight mb-1.5">Adicionar Meu Sistema</span>
                <span className="text-xs text-slate-600 font-medium max-w-[270px]">Adicione um link particular ao seu carrossel.</span>
              </button>
              {centered ? <button type="button" onClick={() => setIsAddModalOpen(true)} className="w-full py-3.5 rounded-full font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"><Plus size={15} />Adicionar Sistema</button> : <div className="w-full py-3.5 rounded-full font-semibold text-xs text-center bg-slate-100 text-slate-400">Adicionar Sistema</div>}
            </> : <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 font-semibold text-[11px]"><LayoutGrid size={12} />{card.isPersonal ? "Meu Atalho" : "Sistema"}</div>
              <div className="flex items-center gap-1">
                {card.isPersonal && <button type="button" onClick={(event) => void handleDeletePersonalCard(card._id, event)} title="Remover sistema pessoal" aria-label={`Remover ${card.title}`} className="w-8 h-8 rounded-full border border-rose-200 bg-rose-50 text-rose-500 flex items-center justify-center"><Trash2 size={13} /></button>}
                <button type="button" onClick={(event) => toggleFavorite(card._id, event)} title="Favoritar" className={`w-8 h-8 rounded-full border flex items-center justify-center ${isFavorited ? "bg-amber-50 text-amber-500 border-amber-300" : "bg-slate-50 text-slate-400 border-slate-200"}`}><Star size={13} className={isFavorited ? "fill-amber-400" : ""} /></button>
              </div>
            </div>
            <div className="flex flex-col items-center text-center my-auto"><div className="w-20 h-20 rounded-full bg-slate-50 p-1 border border-slate-200 flex items-center justify-center overflow-hidden mb-3.5"><img src={card.imageUrl} alt={card.title} className="w-full h-full object-contain rounded-full" onError={(event) => { event.currentTarget.src = fallbackImage; }} /></div><h3 className="text-2xl font-black text-slate-900 leading-tight mb-1.5">{card.title}</h3><p className="text-xs text-slate-600 font-medium line-clamp-2 max-w-[270px]">{card.description || "Acesse diretamente esta ferramenta de trabalho."}</p></div>
            {centered ? <a href={card.url} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white"><span>Acessar Ferramenta</span><ArrowUpRight size={15} /></a> : <div className="w-full py-3 rounded-full font-semibold text-xs text-center bg-slate-100 text-slate-400">Acessar Ferramenta</div>}
            </>}
          </motion.div>;
        })}
        {allDisplayCards.length > 1 && <button onClick={handleNext} aria-label="Próximo" className="absolute right-4 sm:right-8 md:right-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white text-slate-800 border border-slate-200 shadow-xl flex items-center justify-center z-40"><ChevronRight size={24} /></button>}
      </div>}

      {isGridMode && <div className="w-full max-w-[1600px] px-4 sm:px-8 my-2 animate-in fade-in duration-300">
        <div className="flex items-center justify-center mb-4">
          <button
            type="button"
            onClick={() => setIsGridMode(false)}
            className="group bg-white/90 hover:bg-white border border-slate-200/90 shadow-sm hover:shadow-md px-4 py-2 rounded-full transition-all flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar para os Sistemas</span>
          </button>
        </div>
        <div className="max-w-md mx-auto mb-6 relative"><Search size={15} className="absolute left-4 top-3 text-slate-400" /><input type="text" placeholder="Pesquisar nos sites e ferramentas..." value={siteSearch} onChange={(event) => setSiteSearch(event.target.value)} className="w-full bg-white border border-slate-200 rounded-full pl-11 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm" /></div>
        <div className="max-h-[480px] overflow-y-auto pr-1 py-1"><div className="grid grid-cols-[repeat(auto-fill,minmax(125px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(135px,1fr))] gap-3">
          {filteredAccessSites.map((site) => <div key={`site-${site._id}`} className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-[22px] p-3 shadow-sm flex flex-col justify-between items-center text-center relative h-[168px]">
            {site.isPrivate && !site.passwordViewed && <button type="button" onClick={(event) => handleRevealPassword(site._id, site.title, event)} title="Ver credenciais de acesso" className="absolute top-2 right-2 p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-300"><Key size={11} /></button>}
            <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mt-1"><Globe size={20} /></div>
            <div className="w-full my-auto px-1"><h4 className="text-xs font-black text-slate-900 truncate">{site.title}</h4><p className="text-[9px] text-slate-500 line-clamp-1 truncate mt-0.5">{site.description}</p></div>
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="w-full py-1.5 rounded-xl bg-slate-950 hover:bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center gap-1">Acessar<ChevronRight size={11} /></a>
          </div>)}
          <button type="button" onClick={() => setIsRequestModalOpen(true)} className="bg-white/80 hover:bg-blue-50/60 border-2 border-dashed border-blue-300 rounded-[22px] p-3 flex flex-col justify-center items-center text-center cursor-pointer h-[168px]"><div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5"><Plus size={18} /></div><span className="text-xs font-bold text-slate-800">Solicitar Acesso</span><span className="text-[9px] text-slate-400 mt-0.5">Novo site</span></button>
        </div></div>
      </div>}

      {!isGridMode && allDisplayCards.length > 1 && <div className="flex items-center gap-2 mt-4">{allDisplayCards.map((card, index) => <button key={card._id} onClick={() => setCurrentIndex(index)} aria-label={`Ir para card ${index + 1}`} className={`h-1.5 rounded-full ${index === currentIndex ? "w-8 bg-blue-600" : "w-1.5 bg-slate-300"}`} />)}</div>}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 z-20">
        {favoriteCards.length > 0 && <div className="h-11 bg-white/90 px-3.5 rounded-full border border-slate-200 shadow flex items-center gap-2"><Star size={14} className="fill-amber-400 text-amber-500" />{favoriteCards.map((favorite) => <a key={favorite._id} href={favorite.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-800 whitespace-nowrap">{favorite.title}</a>)}</div>}
        <QuickSearchCard isGridActive={isGridMode} onToggleGrid={() => setIsGridMode((active) => !active)} totalCardsCount={accessSites.length} />
      </div>

      {isAddModalOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[10001] flex items-center justify-center p-4" onClick={() => setIsAddModalOpen(false)}>
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-[32px] p-6 sm:p-7 shadow-2xl relative text-slate-800 max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => setIsAddModalOpen(false)} aria-label="Fechar formulário" className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100"><X size={16} /></button>
          <div className="flex items-center gap-2.5 mb-1"><div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center"><Plus size={18} /></div><h4 className="text-lg font-black text-slate-900">Novo Sistema no Meu Hub</h4></div>
          <p className="text-xs text-slate-500 mb-5">Este card aparecerá no seu carrossel e será visível apenas para você.</p>
          <form onSubmit={handleCreatePersonalCard} className="space-y-3.5">
            <label className="block text-xs font-semibold text-slate-700">Nome do Sistema *
              <input type="text" required maxLength={100} value={formTitle} onChange={(event) => setFormTitle(event.target.value)} placeholder="Ex.: Minha Planilha" className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500" />
            </label>
            <label className="block text-xs font-semibold text-slate-700">Descrição Curta
              <input type="text" maxLength={300} value={formDescription} onChange={(event) => setFormDescription(event.target.value)} placeholder="Ex.: Ferramenta de uso diário" className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500" />
            </label>
            <label className="block text-xs font-semibold text-slate-700">URL / Link de Acesso *
              <input type="url" required maxLength={2048} value={formUrl} onChange={(event) => setFormUrl(event.target.value)} placeholder="https://..." className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500" />
            </label>
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1">Ícone / Logo da Capa</span>
              {formImage && <div className="mb-2 relative w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200 mx-auto">
                <img src={formImage} alt="Prévia do ícone" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setFormImage("")} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-[10px] font-bold">Remover</button>
              </div>}
              <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 cursor-pointer text-center">
                <Upload size={14} className="text-slate-500" /><span className="text-xs font-semibold text-slate-700">Escolher imagem (até 2 MB)</span>
                <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <button type="submit" disabled={submittingPersonal} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50">
              {submittingPersonal ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Adicionar ao Meu Carrossel
            </button>
          </form>
        </div>
      </div>}

      <AccessRequestModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} />
      {credentialModal && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setCredentialModal(null)}><div className="bg-white border border-slate-200 rounded-[32px] p-6 max-w-sm w-full shadow-2xl relative text-slate-800" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setCredentialModal(null)} className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-400"><X size={16} /></button><h4 className="text-base font-extrabold text-slate-900 mb-3">{credentialModal.systemName}</h4><div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs"><div><span className="text-slate-400 block text-[10px] font-bold">Login:</span><span className="font-mono font-bold">{credentialModal.siteUser}</span></div><div><span className="text-slate-400 block text-[10px] font-bold">Senha:</span><div className="flex items-center gap-2"><span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 flex-1 truncate">{credentialModal.password}</span><button type="button" onClick={() => { void navigator.clipboard.writeText(credentialModal.password); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }} className="p-1.5 rounded-lg bg-white border border-slate-200">{copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}</button></div></div></div><p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 my-3">Guarde sua senha. Ela não será exibida novamente.</p><a href={credentialModal.siteUrl} target="_blank" rel="noopener noreferrer" onClick={() => setCredentialModal(null)} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1"><span>Ir para o Site</span><ExternalLink size={13} /></a></div></div>}
    </div>
  );
}
