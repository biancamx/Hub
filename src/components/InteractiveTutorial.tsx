"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Check, Compass, Star, Layers, Sparkles, HelpCircle, FolderLock, MousePointerClick } from "lucide-react";

export interface TutorialStep {
  targetId: string;
  title: string;
  badge: string;
  description: string;
  icon: typeof Compass;
  placement: "bottom" | "top" | "left" | "right";
}

const STEPS: TutorialStep[] = [
  { targetId: "tour-header", title: "Identificação e Perfil", badge: "Navegação", description: "Visualize o logotipo do Hub, seu perfil corporativo, notificações de chamados e atalhos para alteração de senha e painel de controle.", icon: Layers, placement: "bottom" },
  { targetId: "tour-hero-text", title: "Hub de Produtividade", badge: "Central de Operações", description: "O Hub foi feito para centralizar todos os sistemas, ferramentas e sites de pesquisa da empresa em um só lugar. Aqui você acessa tudo em 1 clique, favorita os sistemas que mais usa no seu dia a dia e solicita novos acessos com segurança.", icon: Sparkles, placement: "bottom" },
  { targetId: "tour-carousel-stage", title: "Carrossel de Ferramentas", badge: "Acesso Rápido", description: "O sistema em foco no centro pode ser acessado com um clique no botão. Use as setas laterais ou o teclado para navegar entre os sistemas cadastrados.", icon: MousePointerClick, placement: "bottom" },
  { targetId: "tour-dock-favorites", title: "Favoritos Pessoais", badge: "Personalização", description: "Clique no ícone de estrela de qualquer sistema para fixá-lo aqui. Sua lista de favoritos fica salva exclusivamente na sua conta para acesso imediato.", icon: Star, placement: "top" },
  { targetId: "tour-quick-sites-pill", title: "Acessos a Sites & Chamados", badge: "Gestão de Links", description: "Abra este painel para visualizar todos os atalhos disponíveis para sua rotina ou solicitar permissões e senhas para novos sistemas à administração.", icon: FolderLock, placement: "top" },
];

export default function InteractiveTutorial() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const updateHighlight = useCallback(() => {
    if (!isActive) return;
    const element = document.getElementById(STEPS[currentStep].targetId);
    if (!element) { setTargetRect(null); return; }
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setTargetRect(element.getBoundingClientRect());
  }, [isActive, currentStep]);

  useEffect(() => {
    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight);
    return () => { window.removeEventListener("resize", updateHighlight); window.removeEventListener("scroll", updateHighlight); };
  }, [updateHighlight]);

  const startTutorial = () => { setCurrentStep(0); setIsActive(true); };
  const handleNext = () => currentStep < STEPS.length - 1 ? setCurrentStep((previous) => previous + 1) : handleFinish();
  const handlePrev = () => { if (currentStep > 0) setCurrentStep((previous) => previous - 1); };
  const handleFinish = () => { setIsActive(false); setCurrentStep(0); setTargetRect(null); };
  const activeStep = STEPS[currentStep];
  const StepIcon = activeStep.icon;

  const getPopoverStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const margin = 16;
    const popoverWidth = Math.min(360, window.innerWidth - margin * 2);
    const popoverHeight = 220;
    let top = targetRect.bottom + margin;
    let left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
    if (activeStep.placement === "top" || top + popoverHeight > window.innerHeight) top = Math.max(margin, targetRect.top - popoverHeight - margin);
    if (left < margin) left = margin;
    if (left + popoverWidth > window.innerWidth - margin) left = window.innerWidth - popoverWidth - margin;
    return { top: `${top}px`, left: `${left}px`, width: `${popoverWidth}px` };
  };

  return <>
    <button type="button" onClick={startTutorial} title="Iniciar Tutorial do Sistema" className="fixed bottom-5 right-5 z-40 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.08)] px-4 py-2.5 rounded-full transition-all duration-200 flex items-center gap-2 text-xs font-bold active:scale-95 group cursor-pointer"><span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><HelpCircle size={14} /></span><span>Tutorial do Hub</span></button>

    {isActive && <div className="fixed inset-0 z-[12000] overflow-hidden select-none pointer-events-auto font-sans">
      <div className="absolute inset-0 bg-slate-950/65 transition-opacity duration-200" onClick={handleFinish} />
      {targetRect && <div style={{ top: `${targetRect.top - 8}px`, left: `${targetRect.left - 8}px`, width: `${targetRect.width + 16}px`, height: `${targetRect.height + 16}px` }} className="absolute rounded-[28px] border-2 border-blue-400 bg-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] transition-all duration-300 ease-out pointer-events-none z-10" />}
      <div style={getPopoverStyle()} className="fixed bg-white border border-slate-200 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] text-slate-800 transition-all duration-200 z-20" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center"><StepIcon size={16} /></div><div><span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">{activeStep.badge}</span><p className="text-[11px] font-semibold text-slate-400">Etapa {currentStep + 1} de {STEPS.length}</p></div></div><button type="button" onClick={handleFinish} className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"><X size={16} /></button></div>
        <div className="mb-4"><h4 className="text-base font-extrabold text-slate-900 tracking-tight mb-1">{activeStep.title}</h4><p className="text-xs text-slate-600 font-normal leading-relaxed">{activeStep.description}</p></div>
        <div className="flex items-center gap-1.5 mb-4">{STEPS.map((_, index) => <div key={`step-dot-${index}`} className={`h-1.5 rounded-full transition-all duration-300 ${index === currentStep ? "flex-1 bg-blue-600" : index < currentStep ? "w-3 bg-blue-300" : "w-2 bg-slate-200"}`} />)}</div>
        <div className="flex items-center justify-between pt-1"><button type="button" onClick={handleFinish} className="text-xs font-bold text-slate-400 hover:text-slate-700 px-1 py-1">Pular</button><div className="flex items-center gap-2">{currentStep > 0 && <button type="button" onClick={handlePrev} className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-0.5"><ChevronLeft size={14} />Voltar</button>}<button type="button" onClick={handleNext} className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-1 active:scale-95 cursor-pointer">{currentStep === STEPS.length - 1 ? <><span>Concluir</span><Check size={14} /></> : <><span>Próximo</span><ChevronRight size={14} /></>}</button></div></div>
      </div>
    </div>}
  </>;
}
