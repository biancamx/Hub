"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useSession } from "next-auth/react";
import {
  Trash2,
  Edit2,
  Loader2,
  ArrowLeft,
  Save,
  X,
  Plus,
  Users,
  Layers,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Key,
  AlertTriangle,
  Search,
  ExternalLink,
  Globe,
  BellOff,
  Sparkles,
  Ban,
  RotateCcw,
  Activity,
  RefreshCw,
  Crown,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import ApproveRequestModal from "@/components/ApproveRequestModal";
import AdminTutorial from "@/components/AdminTutorial";

interface Card {
  _id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: "master" | "admin" | "user";
  status: "pending" | "active" | "rejected";
  passwordResetRequested?: boolean;
  createdAt: string;
}

interface LogData {
  _id: string;
  level: "info" | "warn" | "error";
  action: string;
  message: string;
  userEmail?: string;
  ip?: string;
  createdAt: string;
}

interface AccessRequest {
  _id: string;
  name: string;
  email: string;
  empresa: string;
  setor: string;
  systemInterest: string;
  priority: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface QuickSite {
  _id: string;
  title: string;
  url: string;
  active: boolean;
  visibilityType?: "all" | "restricted";
  allowedUsers?: string[];
}

export default function AdminPage() {
  const { data: session } = useSession();
  const currentRole = (session?.user as { role?: string } | undefined)?.role;
  const isMaster = currentRole === "master";

  const getInitialTab = (): "cards" | "users" | "requests" | "logs" => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab && ["cards", "users", "requests", "logs"].includes(tab)) return tab as "cards" | "users" | "requests" | "logs";
    }
    return "cards";
  };

  const getInitialFilter = (): "all" | "pending" | "reset" | "active" => {
    if (typeof window !== "undefined") {
      const filter = new URLSearchParams(window.location.search).get("filter");
      if (filter && ["all", "pending", "reset", "active"].includes(filter)) return filter as "all" | "pending" | "reset" | "active";
    }
    return "all";
  };

  const [activeTab, setActiveTab] = useState<"cards" | "users" | "requests" | "logs">(getInitialTab);
  const [cards, setCards] = useState<Card[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [logs, setLogs] = useState<LogData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "pending" | "reset" | "active">(getInitialFilter);
  const [logLevelFilter, setLogLevelFilter] = useState<"all" | "info" | "warn" | "error">("all");
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    imageUrl: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [userNameEdit, setUserNameEdit] = useState("");
  const [userRoleEdit, setUserRoleEdit] = useState<"master" | "admin" | "user">("user");
  const [userStatusEdit, setUserStatusEdit] = useState<"pending" | "active" | "rejected">("active");
  const [approvalRequest, setApprovalRequest] = useState<AccessRequest | null>(null);
  const [quickSites, setQuickSites] = useState<QuickSite[]>([]);
  const [isQuickSiteModalOpen, setIsQuickSiteModalOpen] = useState(false);
  const [quickSiteForm, setQuickSiteForm] = useState({ id: "", title: "", url: "", visibilityType: "all" as "all" | "restricted", allowedUsers: [] as string[] });

  useEffect(() => {
    fetchCards();
    fetchUsers();
    fetchRequests();
    fetchQuickSites();
  }, []);

  useEffect(() => {
    if (activeTab === "logs" && isMaster) fetchLogs();
  }, [activeTab, logLevelFilter, isMaster]);

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      const filter = params.get("filter");

      if (tab && ["cards", "users", "requests", "logs"].includes(tab)) setActiveTab(tab as "cards" | "users" | "requests" | "logs");
      if (filter && ["all", "pending", "reset", "active"].includes(filter)) setUserFilter(filter as "all" | "pending" | "reset" | "active");
    };

    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  const fetchCards = async () => {
    try {
      const res = await fetch("/api/cards");
      const result = await res.json();
      if (result.success) setCards(result.data);
    } catch {
      setError("Erro ao carregar os sistemas.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const result = await res.json();
      if (result.success) setUsers(result.data);
    } catch {
      console.error("Erro ao carregar usuários");
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/requests");
      const result = await res.json();
      if (result.success) setAccessRequests(result.data);
    } catch {
      console.error("Erro ao carregar solicitações de acesso");
    }
  };

  const fetchQuickSites = async () => {
    try {
      const res = await fetch("/api/quick-sites", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setQuickSites(data.data);
    } catch {
      console.error("Erro ao carregar atalhos rápidos");
    }
  };

  const handleSaveQuickSite = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const method = quickSiteForm.id ? "PATCH" : "POST";
      const body = quickSiteForm;
      const res = await fetch("/api/quick-sites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(quickSiteForm.id ? "Atalho atualizado!" : "Novo atalho cadastrado!");
        setIsQuickSiteModalOpen(false);
        setQuickSiteForm({ id: "", title: "", url: "", visibilityType: "all", allowedUsers: [] });
        fetchQuickSites();
      } else {
        setError(data.error || "Erro ao salvar atalho.");
      }
    } catch {
      setError("Erro ao salvar atalho.");
    }
  };

  const toggleQuickSiteActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/quick-sites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickSites((previous) => previous.map((site) => site._id === id ? { ...site, active: !currentActive } : site));
        setSuccess(`Visibilidade alterada! O atalho agora está ${!currentActive ? "VISÍVEL" : "OCULTO"}.`);
      }
    } catch {
      setError("Erro ao alterar visibilidade.");
    }
  };

  const handleDeleteQuickSite = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este atalho de site?")) return;
    try {
      const res = await fetch(`/api/quick-sites?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setQuickSites((previous) => previous.filter((site) => site._id !== id));
        setSuccess("Atalho excluído com sucesso!");
      } else {
        setError(data.error || "Erro ao excluir atalho.");
      }
    } catch {
      setError("Erro ao excluir atalho.");
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const url = logLevelFilter === "all"
        ? "/api/admin/notifications/logs"
        : `/api/admin/notifications/logs?level=${logLevelFilter}`;
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) setLogs(result.data);
    } catch {
      console.error("Erro ao carregar logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Função que converte o arquivo enviado pelo PC em imagem comprimida
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Trava de tamanho: limite de 2MB para não sobrecarregar
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem selecionada é muito pesada. Escolha um arquivo de até 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData((prev) => ({
        ...prev,
        imageUrl: base64String,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitCard = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/cards/${editingId}` : "/api/cards";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        setSuccess(editingId ? "Sistema atualizado com sucesso!" : "Sistema adicionado ao Hub!");
        closeModalAndReset();
        fetchCards();
      } else {
        setError(result.error || "Erro ao salvar.");
      }
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este sistema do Hub?")) return;
    try {
      const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setSuccess("Sistema excluído!");
        fetchCards();
      }
    } catch {
      setError("Erro ao excluir.");
    }
  };

  const closeModalAndReset = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", description: "", url: "", imageUrl: "" });
  };

  const updateUserStatus = async (userId: string, newStatus: "active" | "pending" | "rejected") => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u)));
        setSuccess(
          newStatus === "active"
            ? "Acesso aprovado com sucesso!"
            : newStatus === "rejected"
              ? "Acesso bloqueado/suspenso!"
              : "Status alterado!"
        );
      }
    } catch {
      setError("Erro ao atualizar status do usuário.");
    }
  };

  const toggleUserRole = async (user: UserData) => {
    if (!isMaster) {
      setError("Apenas a conta Matriz pode conceder ou remover cargos de Administrador.");
      return;
    }

    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, role: newRole }),
      });
      const result = await res.json();
      if (result.success) {
        setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u)));
        setSuccess(
          newRole === "admin"
            ? `${user.name || user.email} agora é Administrador!`
            : `${user.name || user.email} agora é Usuário Comum!`
        );
      }
    } catch {
      setError("Erro ao alterar cargo do usuário.");
    }
  };

  const dismissResetRequest = async (userId: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, passwordResetRequested: false }),
      });
      const result = await res.json();
      if (result.success) {
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, passwordResetRequested: false } : u)));
        setSuccess("Pedido de redefinição dispensado. O usuário continua ativo!");
      }
    } catch {
      setError("Erro ao dispensar pedido.");
    }
  };

  const handleResetPassword = async (u: UserData) => {
    const defaultPass = window.prompt(`Digite a nova senha padrão para ${u.name || u.email}:`, "Mudar@123");

    if (!defaultPass) return;

    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u._id, defaultPassword: defaultPass }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`Senha de ${u.name || u.email} redefinida para "${defaultPass}"! Bloqueio zerado.`);
        fetchUsers();
      } else {
        setError(data.error || "Erro ao resetar senha.");
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    }
  };

  const openEditUserModal = (u: UserData) => {
    setEditingUser(u);
    setUserNameEdit(u.name || "");
    setUserRoleEdit(u.role || "user");
    setUserStatusEdit(u.status || "active");
    setIsUserModalOpen(true);
  };

  const handleSaveUserEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser._id,
          name: userNameEdit,
          role: userRoleEdit,
          status: userStatusEdit,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setUsers((prev) => prev.map((u) => (u._id === editingUser._id ? { ...u, name: userNameEdit, role: userRoleEdit, status: userStatusEdit } : u)));
        setIsUserModalOpen(false);
        setSuccess("Dados do usuário salvos!");
      }
    } catch {
      setError("Erro ao salvar dados.");
    }
  };

  const handleDeleteUser = async (u: UserData) => {
    if (u.role === "master") {
      alert("A conta Matriz não pode ser excluída!");
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir permanentemente "${u.name || u.email}"?`)) return;

    try {
      const res = await fetch(`/api/users?id=${u._id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setUsers((prev) => prev.filter((user) => user._id !== u._id));
        setSuccess("Usuário removido!");
      } else {
        setError(result.error || "Erro ao excluir.");
      }
    } catch {
      setError("Erro ao excluir usuário.");
    }
  };

  const handleRequestAction = async (requestId: string, status: "approved" | "rejected") => {
    if (status === "approved") {
      const request = accessRequests.find((item) => item._id === requestId);
      if (request) setApprovalRequest(request);
      return;
    }

    try {
      const res = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      const result = await res.json();
      if (result.success) {
        setSuccess("Solicitação recusada!");
        fetchRequests();
      } else {
        setError(result.error || "Erro ao atualizar solicitação.");
      }
    } catch {
      setError("Erro ao atualizar solicitação.");
    }
  };

  const handleApprovalSuccess = () => {
    setApprovalRequest(null);
    setSuccess("Solicitação aprovada com credenciais!");
    fetchRequests();
  };

  const filteredCards = cards.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedUsers = [...users].sort((a, b) => {
    const aPriority = a.status === "pending" || a.passwordResetRequested ? 1 : 0;
    const bPriority = b.status === "pending" || b.passwordResetRequested ? 1 : 0;
    return bPriority - aPriority;
  });

  const filteredUsers = sortedUsers.filter((u) => {
    if (!isMaster && u.role === "master") return false;
    if (userFilter === "pending") return u.status === "pending";
    if (userFilter === "reset") return u.passwordResetRequested;
    if (userFilter === "active") return u.status === "active";
    return true;
  });

  const pendingApprovalsCount = users.filter((u) => u.status === "pending").length;
  const pendingResetsCount = users.filter((u) => u.passwordResetRequested).length;
  const pendingRequestsCount = accessRequests.filter((request) => request.status === "pending").length;

  return (
    <main className="min-h-screen relative overflow-hidden text-slate-800 pb-20 bg-[#eef2f6]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/60 via-transparent to-indigo-100/30 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 pt-6 relative z-10">
        <header id="admin-tour-header" className="bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[28px] px-6 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-11 h-11 rounded-full bg-white/90 border border-slate-200/80 hover:bg-white text-slate-700 transition flex items-center justify-center shadow-xs" title="Voltar ao Hub">
              <ArrowLeft size={18} />
            </Link>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black tracking-tight text-slate-900">Painel de Controle</h1>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1 ${isMaster ? "bg-amber-100/80 text-amber-900 border-amber-300 shadow-xs" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                  {isMaster && <Crown size={12} className="text-amber-700" />}
                  {isMaster ? "Acesso Matriz" : "Workspace Pro"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Gerencie sistemas, senhas, permissões e auditoria completa</p>
            </div>
          </div>

          <div id="admin-tour-tabs" className="flex items-center bg-slate-200/60 backdrop-blur-md p-1.5 rounded-full border border-slate-300/40 shadow-inner gap-1 self-start md:self-auto">
            <button onClick={() => setActiveTab("cards")} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${activeTab === "cards" ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "text-slate-600 hover:text-slate-900"}`}>
              <Layers size={14} />
              Sistemas ({cards.length})
            </button>

            <button onClick={() => setActiveTab("users")} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all relative ${activeTab === "users" ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "text-slate-600 hover:text-slate-900"}`}>
              <Users size={14} />
              Usuários ({users.length})
              {(pendingApprovalsCount > 0 || pendingResetsCount > 0) && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
            </button>

            <button onClick={() => setActiveTab("requests")} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all relative ${activeTab === "requests" ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "text-slate-600 hover:text-slate-900"}`}>
              <Globe size={14} />
              Acessos ({accessRequests.length})
              {pendingRequestsCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
            </button>

            {isMaster && (
              <button onClick={() => setActiveTab("logs")} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${activeTab === "logs" ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "text-slate-600 hover:text-slate-900"}`}>
                <Activity size={14} />
                Auditoria & Logs
              </button>
            )}
          </div>
        </header>
      </div>

      <div id="admin-tour-content" className="max-w-7xl mx-auto px-6 pt-6 relative z-10">
        {error && <div className="p-4 mb-6 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-sm backdrop-blur-md"><span>{error}</span><button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700"><X size={16} /></button></div>}
        {success && <div className="p-4 mb-6 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-sm backdrop-blur-md"><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" />{success}</span><button onClick={() => setSuccess("")} className="text-emerald-500 hover:text-emerald-700"><X size={16} /></button></div>}

        {activeTab === "cards" && (
          <section className="space-y-6">
            <div className="bg-white/70 backdrop-blur-2xl p-4 rounded-[28px] border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input type="text" placeholder="Buscar sistema por título ou URL..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100/80 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-inner" />
              </div>

              <button onClick={() => { closeModalAndReset(); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl transition shadow-lg shadow-blue-500/20 text-xs active:scale-98">
                <Plus size={16} />
                Adicionar Sistema
              </button>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center text-slate-400"><Loader2 className="animate-spin" size={32} /></div>
            ) : filteredCards.length === 0 ? (
              <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 bg-white/60 backdrop-blur-md text-slate-400"><Globe size={40} className="mx-auto mb-3 opacity-30 text-slate-400" /><p className="text-sm font-semibold text-slate-700">Nenhum sistema cadastrado</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCards.map((card) => (
                  <div
                    key={card._id}
                    className="group bg-white/85 backdrop-blur-xl border border-white/90 hover:border-blue-300/60 rounded-[32px] p-6 flex flex-col justify-between transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_rgba(37,99,235,0.08)]"
                  >
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-200/80 flex-shrink-0 shadow-xs flex items-center justify-center p-1">
                          <img
                            src={card.imageUrl}
                            alt={card.title}
                            className="w-full h-full object-contain object-center"
                            onError={(e) => {
                              (e.target as any).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300";
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-extrabold text-slate-900 truncate">
                            {card.title}
                          </h3>
                          <a
                            href={card.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-500 hover:text-blue-600 truncate flex items-center gap-1 mt-0.5 font-medium transition"
                          >
                            <span className="truncate">{card.url.replace(/^https?:\/\//, "")}</span>
                            <ExternalLink size={10} className="flex-shrink-0" />
                          </a>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 leading-relaxed">
                        {card.description || "Sem descrição informada."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-5 border-t border-slate-100/80">
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(card._id);
                            setFormData({
                              title: card.title,
                              description: card.description,
                              url: card.url,
                              imageUrl: card.imageUrl,
                            });
                            setIsModalOpen(true);
                          }}
                          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center justify-center shadow-xs"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteCard(card._id)}
                          className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 transition flex items-center justify-center shadow-xs"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Atalhos do Painel &quot;Acessos Sites&quot;</h3>
                  <p className="text-xs text-slate-500 font-medium">Controle os botões de sites disponíveis para todos os colaboradores no Hub.</p>
                </div>
                <button onClick={() => { setQuickSiteForm({ id: "", title: "", url: "", visibilityType: "all", allowedUsers: [] }); setIsQuickSiteModalOpen(true); }} className="flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-2xl transition shadow-sm text-xs">
                  <Plus size={15} /> Novo Atalho de Site
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {quickSites.map((site) => (
                  <div key={site._id} className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate">{site.title}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${site.active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>{site.active ? "Visível" : "Oculto"}</span>
                      </div>
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-400 hover:text-blue-600 truncate block mt-0.5">{site.url}</a>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleQuickSiteActive(site._id, site.active)} title={site.active ? "Ocultar do Hub" : "Tornar visível no Hub"} className={`p-1.5 rounded-xl border text-xs font-bold transition ${site.active ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-amber-50 hover:text-amber-700" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"}`}>{site.active ? "Ocultar" : "Mostrar"}</button>
                      <button onClick={() => { setQuickSiteForm({ id: site._id, title: site.title, url: site.url, visibilityType: site.visibilityType || "all", allowedUsers: site.allowedUsers || [] }); setIsQuickSiteModalOpen(true); }} className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition" title="Editar Link/Nome"><Edit2 size={13} /></button>
                      <button onClick={() => handleDeleteQuickSite(site._id)} className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition" title="Excluir"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "users" && (
          <section className="space-y-6">
            <div className="bg-white/70 backdrop-blur-2xl p-3 rounded-[24px] border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button onClick={() => setUserFilter("all")} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${userFilter === "all" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-600 hover:bg-slate-100"}`} >Todos ({users.length})</button>
                <button onClick={() => setUserFilter("pending")} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${userFilter === "pending" ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "text-amber-800 bg-amber-50/80 hover:bg-amber-100"}`} >Pendentes ({pendingApprovalsCount})</button>
                <button onClick={() => setUserFilter("reset")} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${userFilter === "reset" ? "bg-rose-600 text-white shadow-md shadow-rose-500/20" : "text-rose-800 bg-rose-50/80 hover:bg-rose-100"}`} >Pedidos de Senha ({pendingResetsCount})</button>
                <button onClick={() => setUserFilter("active")} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${userFilter === "active" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-600 hover:bg-slate-100"}`} >Aprovados ({users.filter((u) => u.status === "active").length})</button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="p-16 text-center rounded-3xl border border-dashed border-slate-200 text-slate-400 bg-white/60 backdrop-blur-md text-xs">Nenhum usuário corresponde ao filtro selecionado.</div>
              ) : (
                filteredUsers.map((u) => {
                  const isPending = u.status === "pending";
                  const isRejected = u.status === "rejected";
                  const hasReset = u.passwordResetRequested;
                  const needsAttention = isPending || hasReset;

                  return (
                    <div key={u._id} className={`p-5 rounded-[32px] border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-[0_15px_35px_rgba(0,0,0,0.03)] backdrop-blur-xl ${needsAttention ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-200" : "bg-white/85 border-white/90 hover:border-slate-300"}`}>
                      <div className="flex items-center gap-4 min-w-[280px]">
                        {u.image ? (
                          <img src={u.image} alt={u.name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200 flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm flex-shrink-0">{u.name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || "U"}</div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 truncate">{u.name || "Sem Nome"}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border flex items-center gap-1 ${u.role === "master" ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : u.role === "admin" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {u.role === "master" && <Crown size={11} className="text-amber-700" />}
                              {u.role === "master" ? "Matriz" : u.role === "admin" ? "Administrador" : "Usuário Comum"}
                            </span>
                            {isPending && <span className="text-[10px] bg-amber-500 text-white px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 shadow-sm"><AlertTriangle size={11} /> Aprovação Pendente</span>}
                            {hasReset && <span className="text-[10px] bg-rose-600 text-white px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 animate-pulse shadow-sm"><Key size={11} /> Pediu Senha</span>}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 min-w-[340px]">
                        <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border whitespace-nowrap ${u.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : u.status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                          {u.status === "active" ? "Acesso Liberado" : u.status === "rejected" ? "Acesso Bloqueado" : "Aguardando Avaliação"}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isPending && <><button onClick={() => updateUserStatus(u._id, "active")} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-1"><CheckCircle2 size={13} /> Aprovar</button><button onClick={() => updateUserStatus(u._id, "rejected")} className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition">Recusar</button></>}

                          {u.role === "master" ? <span className="text-[11px] text-slate-400 font-medium px-3 py-1 italic">Conta Principal</span> : <>
                            {isMaster && u.status === "active" && <button onClick={() => toggleUserRole(u)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${u.role === "admin" ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`} title={u.role === "admin" ? "Rebaixar para Usuário Comum" : "Promover a Administrador"}>{u.role === "admin" ? <><ShieldAlert size={13} /> Tirar Admin</> : <><ShieldCheck size={13} /> Tornar Admin</>}</button>}
                            {hasReset && <button onClick={() => dismissResetRequest(u._id)} className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition" title="Dispensar aviso"><BellOff size={13} /></button>}
                            <button onClick={() => handleResetPassword(u)} className={`p-2 rounded-xl border transition flex items-center gap-1 ${hasReset ? "bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 text-xs border-rose-600 shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"}`} title="Definir Senha Padrão"><Key size={14} /></button>
                            {u.status === "active" ? <button onClick={() => updateUserStatus(u._id, "rejected")} className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition" title="Bloquear / Suspender Acesso"><Ban size={14} /></button> : isRejected ? <button onClick={() => updateUserStatus(u._id, "active")} className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition" title="Reativar Acesso">Reativar</button> : null}
                            <button onClick={() => openEditUserModal(u)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition" title="Editar Usuário"><Edit2 size={14} /></button>
                            <button onClick={() => handleDeleteUser(u)} className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition" title="Excluir Definitivamente"><Trash2 size={14} /></button>
                          </>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {activeTab === "requests" && (
          <section className="space-y-4">
            <div className="bg-white/70 backdrop-blur-2xl p-4 rounded-[28px] border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Liberação de Acessos a Sistemas</h2>
                <p className="text-xs text-slate-500 mt-0.5">Analise os chamados enviados pelos colaboradores.</p>
              </div>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                Total: {accessRequests.length}
              </span>
            </div>

            <div className="space-y-3">
              {accessRequests.length === 0 ? (
                <div className="p-16 text-center rounded-[32px] border border-dashed border-slate-300 bg-white/50 text-slate-400 text-xs">
                  Nenhuma solicitação de acesso encontrada.
                </div>
              ) : (
                accessRequests.map((request) => (
                  <div key={request._id} className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-[32px] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm text-slate-900">{request.name}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                          {request.systemInterest}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${request.priority === "Urgente" || request.priority === "Alta" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                          Prioridade: {request.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        <strong>Empresa:</strong> {request.empresa} &bull; <strong>Setor:</strong> {request.setor} &bull; <strong>E-mail:</strong> {request.email}
                      </p>
                      <p className="text-xs text-slate-700 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 mt-2.5 leading-relaxed">
                        &quot;{request.message}&quot;
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {request.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleRequestAction(request._id, "approved")}
                            className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={14} /> Liberar Acesso
                          </button>
                          <button
                            onClick={() => handleRequestAction(request._id, "rejected")}
                            className="px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                          >
                            Recusar
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${request.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                          {request.status === "approved" ? "Acesso Liberado" : "Recusado"}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "logs" && isMaster && (
          <section className="space-y-6">
            <div className="bg-white/70 backdrop-blur-2xl p-3 rounded-[24px] border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-700 mr-2">Filtrar nível:</span>
                {(["all", "info", "warn", "error"] as const).map((level) => (
                  <button key={level} onClick={() => setLogLevelFilter(level)} className={`px-4 py-1.5 rounded-full font-bold transition ${logLevelFilter === level ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 bg-slate-100 hover:bg-slate-200"}`}>
                    {level === "all" ? "Todos" : level.toUpperCase()}
                  </button>
                ))}
              </div>

              <button onClick={fetchLogs} disabled={loadingLogs} className="flex items-center gap-1.5 text-xs text-blue-700 font-bold px-4 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 transition shadow-xs">
                <RefreshCw size={13} className={loadingLogs ? "animate-spin" : ""} />
                Atualizar Logs
              </button>
            </div>

            <div className="bg-white/85 backdrop-blur-2xl rounded-[32px] border border-white/90 shadow-[0_15px_35px_rgba(0,0,0,0.03)] overflow-hidden divide-y divide-slate-100">
              {loadingLogs ? (
                <div className="py-20 flex justify-center text-slate-400"><Loader2 className="animate-spin" size={30} /></div>
              ) : logs.length === 0 ? (
                <div className="p-16 text-center text-slate-400 text-xs">Nenhum registro de log encontrado para este filtro.</div>
              ) : (
                logs.map((log) => (
                  <div key={log._id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/80 transition text-xs">
                    <div className="flex items-start gap-3">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border mt-0.5 ${log.level === "error" ? "bg-rose-50 text-rose-700 border-rose-200" : log.level === "warn" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        {log.level}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 font-mono">{log.action}</span>
                          {log.userEmail && <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{log.userEmail}</span>}
                          {log.ip && <span className="text-[10px] text-slate-400 font-mono">IP: {log.ip}</span>}
                        </div>
                        <p className="text-slate-600 mt-1">{log.message}</p>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("pt-BR")}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {approvalRequest && (
        <ApproveRequestModal
          isOpen={Boolean(approvalRequest)}
          onClose={() => setApprovalRequest(null)}
          requestId={approvalRequest._id}
          userName={approvalRequest.name}
          systemName={approvalRequest.systemInterest}
          onSuccess={handleApprovalSuccess}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModalAndReset} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition"><X size={18} /></button>

            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center"><Layers size={20} /></div>
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Editar Sistema" : "Novo Sistema no Hub"}</h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">Preencha os dados do card exibido no Hub.</p>

            <form onSubmit={handleSubmitCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Título do Sistema *</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Ex: ERP Corporativo, Google Workspace..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Descrição Curta</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={2} placeholder="Ex: Ferramenta financeira e gestão de notas..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">URL de Destino *</label>
                <input type="url" name="url" value={formData.url} onChange={handleInputChange} required placeholder="https://sistema.empresa.com.br" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition" />
              </div>

              <div>
                {/* CAMPO DE IMAGEM HÍBRIDO (UPLOAD DO PC OU URL) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Imagem de Capa do Card *
                  </label>

                  {formData.imageUrl && (
                    <div className="mb-2 relative w-full h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group">
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${formData.imageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat"
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, imageUrl: "" }))}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-white/90 text-slate-700 hover:bg-white border border-slate-200 transition text-xs flex items-center gap-1"
                      >
                        <X size={14} /> Trocar Foto
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition text-center group">
                      <Upload size={18} className="text-slate-500 group-hover:text-blue-600 mb-1" />
                      <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">
                        Enviar do Computador
                      </span>
                      <span className="text-[10px] text-slate-400">PNG, JPG até 2MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="flex flex-col justify-center p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <ImageIcon size={14} className="text-slate-400" />
                        Ou colar link (URL)
                      </span>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl.startsWith("data:") ? "" : formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 mt-4 text-xs disabled:opacity-50">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Salvar Sistema
              </button>
            </form>
          </div>
        </div>
      )}

      {isQuickSiteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button type="button" onClick={() => setIsQuickSiteModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100"><X size={16} /></button>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">{quickSiteForm.id ? "Editar Atalho de Site" : "Novo Atalho de Site"}</h3>
            <p className="text-xs text-slate-500 mb-4">Defina o nome, link e quem pode visualizar.</p>
            <form onSubmit={handleSaveQuickSite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Botão *</label>
                <input type="text" required value={quickSiteForm.title} onChange={(event) => setQuickSiteForm({ ...quickSiteForm, title: event.target.value })} placeholder="Ex: Portal de Notas" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL de Destino *</label>
                <input type="url" required value={quickSiteForm.url} onChange={(event) => setQuickSiteForm({ ...quickSiteForm, url: event.target.value })} placeholder="https://sistema.empresa.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Disponibilidade de Acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setQuickSiteForm({ ...quickSiteForm, visibilityType: "all" })} className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${quickSiteForm.visibilityType === "all" ? "bg-blue-50 text-blue-700 border-blue-300" : "bg-slate-50 text-slate-600 border-slate-200"}`}><Globe size={13} /> Liberado para Todos</button>
                  <button type="button" onClick={() => setQuickSiteForm({ ...quickSiteForm, visibilityType: "restricted" })} className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${quickSiteForm.visibilityType === "restricted" ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-slate-50 text-slate-600 border-slate-200"}`}><ShieldAlert size={13} /> Restrito a Usuários</button>
                </div>
              </div>
              {quickSiteForm.visibilityType === "restricted" && <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in">
                <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-700">Usuários autorizados ({quickSiteForm.allowedUsers.length})</span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button type="button" onClick={() => setQuickSiteForm({ ...quickSiteForm, allowedUsers: users.filter((user) => user.role !== "master").map((user) => user.email.toLowerCase().trim()) })} className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition border border-blue-200">Selecionar Todos</button>
                    <button type="button" onClick={() => setQuickSiteForm({ ...quickSiteForm, allowedUsers: [] })} className="px-2 py-0.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-600 font-bold transition">Limpar</button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {users.filter((user) => user.role !== "master").map((user) => {
                    const email = user.email.toLowerCase().trim();
                    const checked = quickSiteForm.allowedUsers.includes(email);
                    return <label key={user._id} className="flex items-center gap-2.5 pt-1.5 text-xs text-slate-700 cursor-pointer hover:text-blue-600"><input type="checkbox" checked={checked} onChange={(event) => setQuickSiteForm({ ...quickSiteForm, allowedUsers: event.target.checked ? [...quickSiteForm.allowedUsers, email] : quickSiteForm.allowedUsers.filter((item) => item !== email) })} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" /><span className="min-w-0 flex-1 truncate"><strong className="block truncate">{user.name || "Sem Nome"}</strong><small className="block text-[10px] text-slate-400 truncate">{user.email}</small></span></label>;
                  })}
                </div>
              </div>}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-500/20 mt-2">{quickSiteForm.id ? "Salvar Alterações" : "Adicionar Atalho"}</button>
            </form>
          </div>
        </div>
      )}

      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsUserModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition"><X size={18} /></button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Editar Colaborador</h2>
            <p className="text-xs text-slate-500 mb-5 truncate">{editingUser.email}</p>

            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nome Completo</label>
                <input type="text" value={userNameEdit} onChange={(e) => setUserNameEdit(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Papel de Acesso</label>
                <select value={userRoleEdit} onChange={(e) => setUserRoleEdit(e.target.value as "master" | "admin" | "user")} disabled={!isMaster} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-60">
                  <option value="user">Usuário Padrão</option>
                  <option value="admin">Administrador Geral</option>
                  {isMaster && <option value="master">Matriz (Super Admin)</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status da Conta</label>
                <select value={userStatusEdit} onChange={(e) => setUserStatusEdit(e.target.value as "pending" | "active" | "rejected")} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition">
                  <option value="active">Liberado (Ativo)</option>
                  <option value="pending">Aguardando Avaliação</option>
                  <option value="rejected">Bloqueado / Suspenso</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-md shadow-blue-500/15 flex items-center justify-center gap-2 mt-4 text-xs">
                <Save size={15} />
                Confirmar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
      <AdminTutorial isMaster={isMaster} />
    </main>
  );
}
