"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Compass, Globe, HelpCircle, Layers, Star, X } from "lucide-react";

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  icon: typeof Compass;
  position?: "top" | "bottom" | "left" | "right";
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-welcome",
    title: "Central de Operações",
    description: "Este é o seu painel unificado de trabalho. Aqui você acessa sistemas, ferramentas e rotinas corporativas de forma rápida e segura.",
    icon: Layers,
    position: "bottom",
  },
  {
    targetId: "tour-carousel",
    title: "Carrossel de Ferramentas",
    description: "Navegue pelos sistemas disponíveis usando as setas ou o teclado. O sistema em foco no centro pode ser acessado diretamente com apenas um clique.",
    icon: Compass,
    position: "bottom",
  },
  {
    targetId: "tour-favorites",
    title: "Favoritos Pessoais",
    description: "Clique no ícone de estrela em qualquer card para fixá-lo na sua barra rápida individual. Seus favoritos ficam salvos na sua conta para todos os próximos acessos.",
    icon: Star,
    position: "top",
  },
  {
    targetId: "tour-quick-sites",
    title: "Acessos e Solicitações",
    description: "Abra este painel para visualizar todos os atalhos disponíveis para a sua função ou solicitar acesso e credenciais para novos sistemas à Matriz.",
    icon: Globe,
    position: "top",
  },
];

export default function AppTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (localStorage.getItem("hub_tour_completed")) return;
    const timer = window.setTimeout(() => setIsOpen(true), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const updateTargetPosition = () => {
      const element = document.getElementById(DEFAULT_TOUR_STEPS[currentStepIndex].targetId);
      if (!element) {
        setTargetRect(null);
        return;
      }
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setTargetRect(element.getBoundingClientRect());
    };

    updateTargetPosition();
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition);
    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition);
    };
  }, [isOpen, currentStepIndex]);

  const handleComplete = () => {
    localStorage.setItem("hub_tour_completed", "true");
    setIsOpen(false);
    setCurrentStepIndex(0);
  };

  const currentStep = DEFAULT_TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  return (
    <>
      <button type="button" onClick={() => { setCurrentStepIndex(0); setIsOpen(true); }} title="Iniciar Tutorial do Sistema" className="fixed bottom-5 left-5 z-40 bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 border border-slate-200/90 shadow-[0_8px_25px_rgba(15,23,42,0.08)] backdrop-blur-xl px-3.5 py-2 rounded-full transition-all flex items-center gap-2 text-xs font-semibold active:scale-95">
        <HelpCircle size={15} className="text-blue-600" />
        <span className="hidden sm:inline">Guia do Sistema</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[11000] overflow-hidden pointer-events-auto select-none">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300" />
          {targetRect && <div style={{ top: `${targetRect.top - 8}px`, left: `${targetRect.left - 8}px`, width: `${targetRect.width + 16}px`, height: `${targetRect.height + 16}px` }} className="absolute rounded-[32px] border-2 border-blue-500/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.55),_0_0_40px_rgba(37,99,235,0.35)] transition-all duration-500 ease-out pointer-events-none" />}

          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md bg-white/95 border border-white rounded-[32px] p-6 sm:p-7 shadow-[0_25px_70px_rgba(15,23,42,0.25)] backdrop-blur-2xl pointer-events-auto font-sans text-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center"><StepIcon size={18} /></div><div><span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Guia de Uso</span><p className="text-xs font-bold text-slate-400">Passo {currentStepIndex + 1} de {DEFAULT_TOUR_STEPS.length}</p></div></div>
                <button type="button" onClick={handleComplete} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700" title="Fechar Guia"><X size={16} /></button>
              </div>
              <div className="my-4"><h3 className="text-lg font-black text-slate-900 tracking-tight mb-1.5">{currentStep.title}</h3><p className="text-xs text-slate-600 leading-relaxed">{currentStep.description}</p></div>
              <div className="flex items-center gap-1.5 my-5">{DEFAULT_TOUR_STEPS.map((_, index) => <div key={`bar-${index}`} className={`h-1.5 rounded-full transition-all duration-300 ${index === currentStepIndex ? "flex-1 bg-blue-600" : index < currentStepIndex ? "w-4 bg-blue-300" : "w-3 bg-slate-200"}`} />)}</div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100"><button type="button" onClick={handleComplete} className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1.5">Pular Tour</button><div className="flex items-center gap-2">{currentStepIndex > 0 && <button type="button" onClick={() => setCurrentStepIndex((previous) => previous - 1)} className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1"><ChevronLeft size={14} />Voltar</button>}<button type="button" onClick={() => currentStepIndex < DEFAULT_TOUR_STEPS.length - 1 ? setCurrentStepIndex((previous) => previous + 1) : handleComplete()} className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1 active:scale-95">{currentStepIndex === DEFAULT_TOUR_STEPS.length - 1 ? <>Concluir <Check size={14} /></> : <>Próximo <ChevronRight size={14} /></>}</button></div></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
