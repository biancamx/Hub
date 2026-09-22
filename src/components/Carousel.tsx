"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, LayoutGrid, Sparkles, ArrowUpRight, Star, Plus, X, Upload, Save, Loader2, Trash2 } from "lucide-react";
import QuickSearchCard from "@/components/QuickSearchCard";

interface CardItem { _id: string; title: string; description: string; url: string; imageUrl: string; ownerEmail?: string | null; isAddButton?: boolean; }

export default function Carousel() {
  const { data: session } = useSession();
  const currentUserEmail = session?.user?.email?.toLowerCase().trim();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [personalForm, setPersonalForm] = useState({ title: "", description: "", url: "", imageUrl: "" });
  const [submitting, setSubmitting] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  async function fetchData() {
    try {
      setLoading(true);
      const [cardsResponse, favoritesResponse] = await Promise.all([fetch("/api/cards"), fetch("/api/user/favorites")]);
      const cardsData = await cardsResponse.json();
      const favoritesData = await favoritesResponse.json();
      if (cardsData.success) setCards(cardsData.data);
      if (favoritesData.success) setFavorites(favoritesData.data);
    } catch (error) {
      console.error("Erro ao carregar dados do carrossel", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void Promise.resolve().then(fetchData); }, []);

  const toggleFavorite = async (cardId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const previousFavorites = favorites;
    const isFavorite = favorites.includes(cardId);
    setFavorites(isFavorite ? favorites.filter((id) => id !== cardId) : [...favorites, cardId]);
    try {
      const response = await fetch("/api/user/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId }) });
      if (!response.ok) setFavorites(previousFavorites);
    } catch {
      setFavorites(previousFavorites);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem selecionada é muito pesada. Escolha um arquivo de até 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPersonalForm((previous) => ({ ...previous, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleCreatePersonalCard = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...personalForm,
          imageUrl: personalForm.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200",
          isPersonal: true,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.error || "Erro ao adicionar sistema.");
        return;
      }
      setIsAddModalOpen(false);
      setPersonalForm({ title: "", description: "", url: "", imageUrl: "" });
      await fetchData();
    } catch {
      alert("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePersonalCard = async (cardId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm("Deseja realmente remover este sistema do seu Hub?")) return;
    try {
      const response = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) await fetchData();
      else alert(data.error || "Erro ao excluir.");
    } catch {
      alert("Erro ao excluir sistema.");
    }
  };

  const handlePrev = () => setCurrentIndex((previous) => (previous === 0 ? carouselItems.length - 1 : previous - 1));
  const handleNext = () => setCurrentIndex((previous) => (previous === carouselItems.length - 1 ? 0 : previous + 1));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") handlePrev();
      if (event.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cards.length]);

  if (loading) return <div className="w-full flex justify-center py-20"><div style={{ width: "380px", height: "430px" }} className="bg-white rounded-[36px] animate-pulse shadow-xl" /></div>;
  const sortedCards = [...cards].sort((a, b) => Number(favorites.includes(b._id)) - Number(favorites.includes(a._id)));

  const carouselItems: CardItem[] = [...sortedCards, {
    _id: "add-new-card-slot",
    title: "Adicionar Sistema",
    description: "Adicione um atalho com link e ícone diretamente ao seu carrossel",
    url: "#",
    imageUrl: "",
    isAddButton: true,
  }];

  const favoriteCards = cards.filter((card) => favorites.includes(card._id));

  return (
    <div className="w-full flex flex-col items-center select-none py-2 relative">
      <div ref={stageRef} className="relative z-10 w-full max-w-[1400px] h-[480px] flex items-center justify-center overflow-visible px-16">
        <div className="absolute w-[500px] h-[350px] rounded-full bg-gradient-to-tr from-blue-500/20 via-sky-400/15 to-indigo-500/10 blur-[120px] pointer-events-none z-0" />

        {carouselItems.length > 1 && (
          <button onClick={handlePrev} aria-label="Anterior" className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-40 cursor-pointer">
            <ChevronLeft size={24} />
          </button>
        )}

        {carouselItems.map((card, index) => {
          const total = carouselItems.length;
          let offset = index - currentIndex;
          if (offset < -Math.floor(total / 2)) offset += total;
          if (offset > Math.floor(total / 2)) offset -= total;
          if (Math.abs(offset) > 2) return null;

          const isCenter = offset === 0;
          const absoluteOffset = Math.abs(offset);
          const translateX = offset === 0 ? 0 : offset > 0 ? (offset === 1 ? 380 : 700) : (offset === -1 ? -380 : -700);
          const opacity = isCenter ? 1 : absoluteOffset === 1 ? 0.22 : 0.08;
          const scale = isCenter ? 1 : 0.88;
          const zIndex = isCenter ? 30 : absoluteOffset === 1 ? 20 : 10;

          if (card.isAddButton) return (
            <motion.div key={card._id} onClick={() => isCenter ? setIsAddModalOpen(true) : setCurrentIndex(index)} animate={{ x: translateX, scale, opacity }} transition={{ type: "spring", stiffness: 220, damping: 26 }} style={{ width: "370px", height: "430px", zIndex }} className={`absolute top-1/2 left-1/2 -ml-[185px] -mt-[215px] rounded-[36px] p-7 flex flex-col justify-between border-2 border-dashed cursor-pointer ${isCenter ? "bg-white/95 border-blue-400 shadow-[0_25px_60px_rgba(37,99,235,0.16)] ring-2 ring-blue-500/20" : "bg-white/70 border-slate-300"}`}>
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 font-semibold text-[11px] w-fit"><Sparkles size={12} className="text-blue-600" /><span>Personalizar Hub</span></div>
              <div className="flex flex-col items-center text-center my-auto px-4"><div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3.5"><Plus size={32} /></div><h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1.5">Novo Sistema</h3><p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[250px]">Adicione uma ferramenta ou site para aparecer no seu carrossel pessoal.</p></div>
              <button type="button" onClick={(event) => { event.stopPropagation(); setIsAddModalOpen(true); }} className="w-full py-3.5 px-6 rounded-full font-bold text-xs flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white active:scale-95 shadow-lg shadow-blue-500/25 transition-all"><span>Adicionar ao Carrossel</span><Plus size={15} /></button>
            </motion.div>
          );

          const isFavorited = favorites.includes(card._id);
          const isMyCard = card.ownerEmail && card.ownerEmail === currentUserEmail;

          return <motion.div key={card._id} onClick={() => { if (!isCenter) setCurrentIndex(index); }} animate={{ x: translateX, scale, opacity }} transition={{ type: "spring", stiffness: 220, damping: 26 }} style={{ width: "370px", height: "430px", zIndex, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }} className={`absolute top-1/2 left-1/2 -ml-[185px] -mt-[215px] rounded-[36px] p-7 flex flex-col justify-between border select-none bg-white ${isCenter ? "border-blue-300 shadow-[0_25px_60px_rgba(37,99,235,0.16)] ring-2 ring-blue-500/20 cursor-default" : "border-slate-200/90 shadow-[0_12px_35px_rgba(0,0,0,0.06)] cursor-pointer hover:border-slate-300"}`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono"><div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 font-semibold text-[11px]"><LayoutGrid size={12} className="text-blue-600" /><span>Sistema</span></div><div className="flex items-center gap-1">{isMyCard && <button type="button" onClick={(event) => handleDeletePersonalCard(card._id, event)} title="Excluir este sistema" className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition flex items-center justify-center"><Trash2 size={13} /></button>}<button type="button" onClick={(event) => toggleFavorite(card._id, event)} title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"} className={`p-1 transition-all flex items-center justify-center cursor-pointer ${isFavorited ? "text-amber-500 scale-105" : "text-slate-400 hover:text-amber-500"}`}><Star size={20} className={isFavorited ? "fill-amber-400 text-amber-500" : ""} /></button></div></div>
            <div className="flex flex-col items-center text-center my-auto px-2">
              <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 shadow-sm mb-3.5 flex-shrink-0 overflow-hidden p-1 flex items-center justify-center">
                <img src={card.imageUrl} alt={card.title} className="w-full h-full rounded-full object-contain bg-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1.5" style={{ textRendering: "optimizeLegibility" }}>{card.title}</h3>
              <p className="text-xs text-slate-600 font-medium line-clamp-2 max-w-[270px] leading-relaxed" style={{ textRendering: "optimizeLegibility" }}>{card.description || "Acesse diretamente esta ferramenta de trabalho."}</p>
            </div>
            <div className="pt-2">{isCenter ? <a href={card.url} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 px-6 rounded-full font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 hover:from-blue-600 hover:to-indigo-600 text-white active:scale-95 shadow-xl shadow-blue-900/20 hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer"><span>Acessar Ferramenta</span><ArrowUpRight size={15} /></a> : <div className="w-full py-3 px-5 rounded-full font-semibold text-xs flex items-center justify-center gap-2 bg-slate-100/80 text-slate-400 border border-slate-200/50 pointer-events-none opacity-60"><span>Acessar Ferramenta</span><ArrowUpRight size={14} /></div>}</div>
          </motion.div>;
        })}

        {carouselItems.length > 1 && (
          <button onClick={handleNext} aria-label="Próximo" className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-40">
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {carouselItems.length > 1 && <div className="flex items-center gap-2 mt-4">{carouselItems.map((card, index) => <button key={card._id} onClick={() => setCurrentIndex(index)} aria-label={`Ir para card ${index + 1}`} className={`h-1.5 rounded-full transition-all duration-500 ${index === currentIndex ? "w-8 bg-blue-600 shadow-sm shadow-blue-500/40" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`} />)}</div>}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 z-20 animate-in fade-in slide-in-from-bottom-3 duration-300">
        {favoriteCards.length > 0 && <div id="tour-dock-favorites" className="h-11 bg-white/90 backdrop-blur-xl px-3.5 rounded-full border border-slate-200/90 shadow-[0_10px_25px_rgba(15,23,42,0.06)] flex items-center gap-2"><div className="pl-0.5 pr-2 border-r border-slate-200 flex items-center justify-center text-amber-500"><Star size={14} className="fill-amber-400 text-amber-500" /></div><div className="flex items-center gap-1.5 overflow-x-auto max-w-[400px]">{favoriteCards.map((favorite) => <a key={`dock-${favorite._id}`} href={favorite.url} target="_blank" rel="noopener noreferrer" title={`Abrir ${favorite.title}`} className="group relative flex items-center gap-2 p-1 pr-2.5 rounded-full hover:bg-slate-100 active:scale-95 transition-all"><div className="w-7 h-7 rounded-full overflow-hidden bg-white border border-slate-200 shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform"><img src={favorite.imageUrl} alt={favorite.title} className="w-full h-full object-contain" onError={(event) => { (event.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100"; }} /></div><span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors whitespace-nowrap">{favorite.title}</span></a>)}</div></div>}
        <QuickSearchCard />
      </div>

      {isAddModalOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl relative font-sans text-slate-800" onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => setIsAddModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition"><X size={18} /></button>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">Personalização do Hub</span>
          <h3 className="text-xl font-black text-slate-900 mt-2">Adicionar Sistema ao Carrossel</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Este sistema entrará diretamente no seu carrossel principal.</p>
          <form onSubmit={handleCreatePersonalCard} className="space-y-3.5">
            <input type="text" required value={personalForm.title} onChange={(event) => setPersonalForm({ ...personalForm, title: event.target.value })} placeholder="Título do Sistema *" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
            <input type="text" value={personalForm.description} onChange={(event) => setPersonalForm({ ...personalForm, description: event.target.value })} placeholder="Descrição Curta" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
            <input type="url" required value={personalForm.url} onChange={(event) => setPersonalForm({ ...personalForm, url: event.target.value })} placeholder="URL de Destino (Link) *" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
            {personalForm.imageUrl && <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 mx-auto"><img src={personalForm.imageUrl} alt="Prévia" className="w-full h-full object-contain" /></div>}
            <div className="grid grid-cols-2 gap-2"><label className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 cursor-pointer text-center text-xs font-semibold text-slate-600"><Upload size={14} className="text-slate-400" /><span>Do Computador</span><input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" /></label><input type="url" value={personalForm.imageUrl.startsWith("data:") ? "" : personalForm.imageUrl} onChange={(event) => setPersonalForm({ ...personalForm, imageUrl: event.target.value })} placeholder="Ou link da imagem" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500" /></div>
            <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50">{submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Adicionar ao Carrossel</button>
          </form>
        </div>
      </div>}
    </div>
  );
}
