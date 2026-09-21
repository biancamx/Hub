"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Check, Compass, Layers, HelpCircle, KeyRound, ShieldCheck } from "lucide-react";

export interface AdminTutorialStep {
  targetId: string;
  title: string;
  badge: string;
  description: string;
  icon: typeof Compass;
  placement: "bottom" | "top" | "left" | "right";
}

const ADMIN_STEPS: AdminTutorialStep[] = [
  { targetId: "admin-tour-header", title: "Painel de Controle", badge: "Visão Geral", description: "Este é o centro administrativo do Hub. Aqui você gerencia ferramentas, permissões da equipe, aprova solicitações e audita acessos.", icon: ShieldCheck, placement: "bottom" },
  { targetId: "admin-tour-tabs", title: "Navegação por Módulos", badge: "Abas de Gestão", description: "Alterne rapidamente entre Sistemas, Usuários, Chamados de Acessos e os Logs de Auditoria (exclusivos da conta Matriz).", icon: Layers, placement: "bottom" },
  { targetId: "admin-tour-content", title: "Área de Trabalho Ativa", badge: "Operações", description: "Adicione novos sistemas com fotos personalizadas, aprove chamados com senhas criptografadas e redefina credenciais com um clique.", icon: KeyRound, placement: "bottom" },
];

export default function AdminTutorial({ isMaster }: { isMaster?: boolean }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const updateHighlight = useCallback(() => {
    if (!isActive) return;
    const element = document.getElementById(ADMIN_STEPS[currentStep].targetId);
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

  const finish = () => { setIsActive(false); setCurrentStep(0); setTargetRect(null); };
  const activeStep = ADMIN_STEPS[currentStep];
  const StepIcon = activeStep.icon;

  const getPopoverStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const margin = 16;
    const width = Math.min(360, window.innerWidth - margin * 2);
    const height = 220;
    let top = targetRect.bottom + margin;
    let left = targetRect.left + targetRect.width / 2 - width / 2;
    if (activeStep.placement === "top" || top + height > window.innerHeight) top = Math.max(margin, targetRect.top - height - margin);
    if (left < margin) left = margin;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
    return { top: `${top}px`, left: `${left}px`, width: `${width}px` };
  };

  return <>
    <button type="button" onClick={() => { setCurrentStep(0); setIsActive(true); }} title="Tutorial do Painel de Controle" className="fixed bottom-5 right-5 z-40 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200/90 shadow-lg px-4 py-2.5 rounded-full transition-all flex items-center gap-2 text-xs font-bold active:scale-95 group cursor-pointer"><span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><HelpCircle size={14} /></span><span>Guia do Admin</span></button>

    {isActive && <div className="fixed inset-0 z-[12000] overflow-hidden select-none pointer-events-auto font-sans">
      <svg className="absolute inset-0 w-full h-full pointer-events-auto"><defs><mask id="admin-spotlight-mask"><rect x="0" y="0" width="100%" height="100%" fill="white" />{targetRect && <rect x={targetRect.left - 8} y={targetRect.top - 8} width={targetRect.width + 16} height={targetRect.height + 16} rx="24" fill="black" />}</mask></defs><rect x="0" y="0" width="100%" height="100%" fill="rgba(15, 23, 42, 0.6)" mask="url(#admin-spotlight-mask)" onClick={finish} /></svg>
      {targetRect && <div style={{ top: `${targetRect.top - 8}px`, left: `${targetRect.left - 8}px`, width: `${targetRect.width + 16}px`, height: `${targetRect.height + 16}px` }} className="absolute rounded-[24px] border-2 border-blue-400 bg-transparent transition-all duration-300 pointer-events-none z-10" />}
      <div style={getPopoverStyle()} className="fixed bg-white border border-slate-200 rounded-[32px] p-6 shadow-2xl text-slate-800 transition-all duration-200 z-20" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center"><StepIcon size={16} /></div><div><span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">{activeStep.badge}</span><p className="text-[11px] font-semibold text-slate-400">Etapa {currentStep + 1} de {ADMIN_STEPS.length}</p></div></div><button type="button" onClick={finish} className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X size={16} /></button></div>
        <div className="mb-4"><h4 className="text-base font-extrabold text-slate-900 tracking-tight mb-1">{activeStep.title}</h4><p className="text-xs text-slate-600 leading-relaxed">{activeStep.description}</p></div>
        <div className="flex items-center gap-1.5 mb-4">{ADMIN_STEPS.map((_, index) => <div key={`admin-step-dot-${index}`} className={`h-1.5 rounded-full transition-all duration-300 ${index === currentStep ? "flex-1 bg-blue-600" : index < currentStep ? "w-3 bg-blue-300" : "w-2 bg-slate-200"}`} />)}</div>
        <div className="flex items-center justify-between pt-1"><button type="button" onClick={finish} className="text-xs font-bold text-slate-400 hover:text-slate-700 px-1 py-1">Pular</button><div className="flex items-center gap-2">{currentStep > 0 && <button type="button" onClick={() => setCurrentStep((value) => value - 1)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-0.5"><ChevronLeft size={14} />Voltar</button>}<button type="button" onClick={() => currentStep < ADMIN_STEPS.length - 1 ? setCurrentStep((value) => value + 1) : finish()} className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1 active:scale-95">{currentStep === ADMIN_STEPS.length - 1 ? <>Concluir <Check size={14} /></> : <>Próximo <ChevronRight size={14} /></>}</button></div></div>
      </div>
    </div>}
  </>;
}
