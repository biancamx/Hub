"use client";

import { useState, useEffect } from "react";
import { Maximize2, RefreshCw, Sparkles, Globe, Star } from "lucide-react";
import Link from "next/link";

interface CardItem { _id: string; title: string; url: string; imageUrl: string; }

export default function QuickAccessPage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resCards, resFavs] = await Promise.all([fetch("/api/cards"), fetch("/api/user/favorites")]);
      const dataCards = await resCards.json();
      const dataFavs = await resFavs.json();
      if (dataCards.success) setCards(dataCards.data);
      if (dataFavs.success) setFavorites(dataFavs.data);
    } catch {
      console.error("Erro ao carregar dados rápidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const favoriteCards = cards.filter((card) => favorites.includes(card._id));
  const otherCards = cards.filter((card) => !favorites.includes(card._id));
  const renderCard = (card: CardItem, favorite = false) => <a key={card._id} href={card.url} target="_blank" rel="noopener noreferrer" className={`group flex flex-col items-center justify-center p-2.5 rounded-2xl transition text-center ${favorite ? "bg-amber-50/30 hover:bg-amber-50/80 border border-amber-200/60 shadow-sm" : "hover:bg-slate-50 active:scale-95 border border-transparent hover:border-slate-200/80"}`}><div className={`${favorite ? "w-12 h-12" : "w-12 h-12"} rounded-2xl bg-white border ${favorite ? "border-amber-200/70" : "border-slate-200"} p-1 mb-1.5 flex items-center justify-center group-hover:scale-105 group-hover:shadow-sm transition-all overflow-hidden`}><img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover rounded-xl" onError={(e) => { (e.target as any).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100"; }} /></div><span className={`text-[11px] line-clamp-1 leading-tight ${favorite ? "font-bold text-slate-800 group-hover:text-amber-800" : "font-semibold text-slate-700 group-hover:text-blue-600"}`}>{card.title}</span></a>;

  return <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4"><div className="w-[370px] bg-white/95 text-slate-800 rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.12)] border border-slate-200/80 backdrop-blur-xl overflow-hidden flex flex-col justify-between font-sans">
    <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"><div className="flex items-center gap-2"><span className="text-xs font-bold tracking-tight text-slate-900">Acesso rápido</span><button onClick={fetchData} title="Atualizar lista" className="p-1 text-slate-400 hover:text-slate-700 transition rounded-md"><RefreshCw size={12} className={loading ? "animate-spin" : ""} /></button></div><Link href="/" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100/70 border border-blue-200/60"><span>Hub Completo</span><Maximize2 size={11} /></Link></div>
    <div className="p-3.5 min-h-[280px] max-h-[420px] overflow-y-auto">{loading ? <div className="grid grid-cols-3 gap-2.5 py-6">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}</div> : cards.length === 0 ? <div className="text-center py-12 text-slate-400 text-xs"><Globe size={28} className="mx-auto mb-2 opacity-30 text-slate-400" />Nenhum sistema cadastrado ainda.</div> : <div className="space-y-4">
      {favoriteCards.length > 0 && <div><span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-2.5"><Star size={10} className="fill-amber-400 text-amber-500" />Meus Favoritos ({favoriteCards.length})</span><div className="grid grid-cols-3 gap-2">{favoriteCards.map((card) => renderCard(card, true))}</div></div>}
      <div>{favoriteCards.length > 0 && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">Outros Sistemas</span>}<div className="grid grid-cols-3 gap-2">{otherCards.map((card) => renderCard(card))}</div></div>
    </div>}</div>
    <div className="p-3 px-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500"><span className="flex items-center gap-1 font-medium"><Sparkles size={11} className="text-blue-500" />1 clique para abrir</span><span className="font-semibold text-slate-400">{cards.length} sistema(s)</span></div>
  </div></div>;
}
