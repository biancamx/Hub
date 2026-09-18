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

export default function AdminPage() {
  const { data: session } = useSession();
  const currentRole = (session?.user as { role?: string } | undefined)?.role;
  const isMaster = currentRole === "master";

  const [activeTab, setActiveTab] = useState<"cards" | "users" | "logs">("cards");
  const [cards, setCards] = useState<Card[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [logs, setLogs] = useState<LogData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "pending" | "reset" | "active">("all");
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

  useEffect(() => {
    fetchCards();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "logs" && isMaster) fetchLogs();
  }, [activeTab, logLevelFilter, isMaster]);

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
    if (userFilter === "pending") return u.status === "pending";
    if (userFilter === "reset") return u.passwordResetRequested;
    if (userFilter === "active") return u.status === "active";
    return true;
  });

  const pendingApprovalsCount = users.filter((u) => u.status === "pending").length;
  const pendingResetsCount = users.filter((u) => u.passwordResetRequested).length;

  return (
    <main className="min-h-screen relative overflow-hidden text-slate-800 pb-20 bg-[#eef2f6]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/60 via-transparent to-indigo-100/30 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 pt-6 relative z-10">
        <header className="bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[28px] px-6 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          <div className="flex items-center bg-slate-200/60 backdrop-blur-md p-1.5 rounded-full border border-slate-300/40 shadow-inner gap-1 self-start md:self-auto">
            <button onClick={() => setActiveTab("cards")} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${activeTab === "cards" ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "text-slate-600 hover:text-slate-900"}`}>
              <Layers size={14} />
              Sistemas ({cards.length})
            </button>

            <button onClick={() => setActiveTab("users")} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all relative ${activeTab === "users" ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "text-slate-600 hover:text-slate-900"}`}>
              <Users size={14} />
              Usuários ({users.length})
              {(pendingApprovalsCount > 0 || pendingResetsCount > 0) && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
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

      <div className="max-w-7xl mx-auto px-6 pt-6 relative z-10">
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
                  <div key={card._id} className="group bg-white/80 backdrop-blur-2xl border border-white/90 hover:border-blue-300/60 rounded-[32px] p-6 flex flex-col justify-between transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_rgba(37,99,235,0.08)]">
                    <div>
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                          <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300"; }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="text-base font-bold text-slate-900 truncate">{card.title}</h3>
                          </div>

                          <a href={card.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-blue-600 truncate flex items-center gap-1 mt-0.5 font-medium">
                            <span className="truncate">{card.url.replace(/^https?:\/\//, "")}</span>
                            <ExternalLink size={10} className="flex-shrink-0" />
                          </a>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 leading-relaxed">{card.description || "Sem descrição informada."}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Online</span>

                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditingId(card._id); setFormData({ title: card.title, description: card.description, url: card.url, imageUrl: card.imageUrl }); setIsModalOpen(true); }} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center justify-center shadow-xs" title="Editar"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteCard(card._id)} className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 transition flex items-center justify-center shadow-xs" title="Excluir"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                      <img
                        src={formData.imageUrl}
                        alt="Prévia"
                        className="w-full h-full object-cover"
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
    </main>
  );
}
