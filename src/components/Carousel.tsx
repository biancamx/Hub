"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutGrid, ArrowUpRight, Star } from "lucide-react";

interface CardItem { _id: string; title: string; description: string; url: string; imageUrl: string; }

export default function Carousel() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") handlePrev();
      if (event.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cards.length]);

  if (loading) return <div className="w-full flex justify-center py-20"><div style={{ width: "380px", height: "430px" }} className="bg-white rounded-[36px] animate-pulse shadow-xl" /></div>;
  if (cards.length === 0) return <div className="text-center py-16 bg-white rounded-[36px] border border-blue-100 text-slate-500 max-w-sm mx-auto p-8 shadow-2xl"><LayoutGrid size={36} className="mx-auto mb-3 opacity-40 text-blue-600" /><p className="font-bold text-slate-800 text-base">Nenhum sistema cadastrado</p><p className="text-xs text-slate-400 mt-1">Acesse o Painel para cadastrar ferramentas.</p></div>;

  const sortedCards = [...cards].sort((a, b) => Number(favorites.includes(b._id)) - Number(favorites.includes(a._id)));

  const favoriteCards = cards.filter((card) => favorites.includes(card._id));

  return (
    <div className="w-full flex flex-col items-center select-none py-2 relative">
      <div ref={stageRef} className="relative w-full max-w-[1400px] h-[480px] flex items-center justify-center overflow-visible px-16">
        <div className="absolute w-[500px] h-[350px] rounded-full bg-gradient-to-tr from-blue-500/20 via-sky-400/15 to-indigo-500/10 blur-[120px] pointer-events-none z-0" />

        {sortedCards.length > 1 && (
          <button onClick={handlePrev} aria-label="Anterior" className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-40 cursor-pointer">
            <ChevronLeft size={24} />
          </button>
        )}

        {sortedCards.map((card, index) => {
          let offset = index - currentIndex;
          if (offset < -Math.floor(sortedCards.length / 2)) offset += sortedCards.length;
          if (offset > Math.floor(sortedCards.length / 2)) offset -= sortedCards.length;
          if (Math.abs(offset) > 2) return null;

          const isCenter = offset === 0;
          const absoluteOffset = Math.abs(offset);
          const translateX = offset === 0 ? 0 : offset > 0 ? (offset === 1 ? 380 : 700) : (offset === -1 ? -380 : -700);
          const opacity = isCenter ? 1 : absoluteOffset === 1 ? 0.22 : 0.08;
          const scale = isCenter ? 1 : 0.88;
          const zIndex = isCenter ? 30 : absoluteOffset === 1 ? 20 : 10;
          const isFavorited = favorites.includes(card._id);

          return <motion.div key={card._id} onClick={() => { if (!isCenter) setCurrentIndex(index); }} animate={{ x: translateX, scale, opacity }} transition={{ type: "spring", stiffness: 220, damping: 26 }} style={{ width: "370px", height: "430px", zIndex, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }} className={`absolute top-1/2 left-1/2 -ml-[185px] -mt-[215px] rounded-[36px] p-7 flex flex-col justify-between border select-none bg-white ${isCenter ? "border-blue-300 shadow-[0_25px_60px_rgba(37,99,235,0.16)] ring-2 ring-blue-500/20 cursor-default" : "border-slate-200/90 shadow-[0_12px_35px_rgba(0,0,0,0.06)] cursor-pointer hover:border-slate-300"}`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono"><div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 font-semibold text-[11px]"><LayoutGrid size={12} className="text-blue-600" /><span>Sistema</span></div><button type="button" onClick={(event) => toggleFavorite(card._id, event)} title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"} className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center cursor-pointer shadow-xs ${isFavorited ? "bg-amber-50 text-amber-500 border-amber-300 ring-2 ring-amber-300/40 scale-105" : "bg-slate-50 text-slate-400 border-slate-200 hover:text-amber-500 hover:bg-amber-50/50"}`}><Star size={13} className={isFavorited ? "fill-amber-400 text-amber-500" : ""} /></button></div>
            <div className="flex flex-col items-center text-center my-auto px-2"><div className="w-20 h-20 rounded-full bg-slate-50 p-1 border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden mb-3.5"><img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover rounded-full" onError={(event) => { (event.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200"; }} /></div><h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1.5" style={{ textRendering: "optimizeLegibility" }}>{card.title}</h3><p className="text-xs text-slate-600 font-medium line-clamp-2 max-w-[270px] leading-relaxed" style={{ textRendering: "optimizeLegibility" }}>{card.description || "Acesse diretamente esta ferramenta de trabalho."}</p></div>
            <div className="pt-2">{isCenter ? <a href={card.url} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 px-6 rounded-full font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 hover:from-blue-600 hover:to-indigo-600 text-white active:scale-95 shadow-xl shadow-blue-900/20 hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer"><span>Acessar Ferramenta</span><ArrowUpRight size={15} /></a> : <div className="w-full py-3 px-5 rounded-full font-semibold text-xs flex items-center justify-center gap-2 bg-slate-100/80 text-slate-400 border border-slate-200/50 pointer-events-none opacity-60"><span>Acessar Ferramenta</span><ArrowUpRight size={14} /></div>}</div>
          </motion.div>;
        })}

        {sortedCards.length > 1 && (
          <button onClick={handleNext} aria-label="Próximo" className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-40">
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {sortedCards.length > 1 && <div className="flex items-center gap-2 mt-4">{sortedCards.map((card, index) => <button key={card._id} onClick={() => setCurrentIndex(index)} aria-label={`Ir para card ${index + 1}`} className={`h-1.5 rounded-full transition-all duration-500 ${index === currentIndex ? "w-8 bg-blue-600 shadow-sm shadow-blue-500/40" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`} />)}</div>}

      {favoriteCards.length > 0 && <div className="mt-6 z-20 animate-in fade-in slide-in-from-bottom-3 duration-300"><div className="bg-white p-1.5 px-4 rounded-full border border-slate-200 shadow-[0_15px_35px_rgba(0,0,0,0.08)] flex items-center gap-2"><div className="pl-1 pr-2 border-r border-slate-200 flex items-center justify-center text-amber-500"><Star size={14} className="fill-amber-400 text-amber-500" /></div><div className="flex items-center gap-1.5 overflow-x-auto max-w-[600px] py-0.5">{favoriteCards.map((favorite) => <a key={`dock-${favorite._id}`} href={favorite.url} target="_blank" rel="noopener noreferrer" title={`Abrir ${favorite.title}`} className="group relative flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-100 active:scale-95 transition-all"><div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-200 shadow-xs flex-shrink-0 group-hover:scale-110 transition-transform"><img src={favorite.imageUrl} alt={favorite.title} className="w-full h-full object-cover" onError={(event) => { (event.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100"; }} /></div><span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors whitespace-nowrap">{favorite.title}</span></a>)}</div></div></div>}
    </div>
  );
}
