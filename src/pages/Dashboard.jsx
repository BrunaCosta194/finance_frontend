import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { monthService } from '../services/monthService';
import { categoryService } from '../services/categoryService';
import { authService } from '../services/authService';
import TransactionModal from '../components/TransactionModal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function fmt(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val ?? 0);
}
function fmtDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

// ─── Modal Configurações do Mês ───────────────────────────────────────────────
function MonthSettingsModal({ monthId, currentIncome, currentGoal, onClose, onSuccess }) {
  const [income, setIncome] = useState(currentIncome ?? '');
  const [goal, setGoal] = useState(currentGoal ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!income || Number(income) <= 0) { setError('Renda inválida'); return; }
    setLoading(true);
    try {
      await api.patch(`/months/${monthId}/settings`, null, {
        params: {
          monthlyIncome: Number(income),
          savingsGoal: Number(goal || 0),
        },
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#0f1117', border: '1px solid #1e2130', borderRadius: 20,
        width: '100%', maxWidth: 420, padding: '32px 28px',
        animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h2 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, margin: 0 }}>Configurações do Mês</h2>
            <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Ajuste sua renda e meta de economia</p>
          </div>
          <button onClick={onClose} style={{
            background: '#1e2130', border: 'none', color: '#94a3b8',
            width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelSt}>RENDA MENSAL (R$)</label>
          <input type="number" value={income} onChange={e => { setIncome(e.target.value); setError(''); }}
            placeholder="Ex: 3000" style={inputSt} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelSt}>META DE ECONOMIA (R$)</label>
          <input type="number" value={goal} onChange={e => setGoal(e.target.value)}
            placeholder="Ex: 500 (opcional)" style={inputSt} />
          <span style={{ color: '#64748b', fontSize: 12, marginTop: 4, display: 'block' }}>
            Valor que deseja guardar este mês
          </span>
        </div>

        {error && (
          <div style={{
            background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16,
          }}>{error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onClose} style={{
            padding: '13px 0', background: '#1e2130', border: 'none', borderRadius: 12,
            color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading} style={{
            padding: '13px 0', border: 'none', borderRadius: 12, fontFamily: 'inherit',
            background: loading ? '#334155' : 'linear-gradient(135deg, #10b981, #0ea5e9)',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Painel Lateral (Transações / Categorias) ─────────────────────────────────
function SidePanel({ title, onClose, children }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(2px)', zIndex: 900,
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 480,
        background: '#0f1117', borderLeft: '1px solid #1e2130',
        zIndex: 901, display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 24px 20px', borderBottom: '1px solid #1e2130',
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{title}</h2>
          <button onClick={onClose} style={{
            background: '#1e2130', border: 'none', color: '#94a3b8',
            width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Painel de Transações ─────────────────────────────────────────────────────
function TransactionsPanel({ transactions, onNewTransaction }) {
  return (
    <div>
      <button onClick={onNewTransaction} style={{
        width: '100%', padding: '12px 0', marginBottom: 20,
        background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
        border: 'none', borderRadius: 12, color: '#fff',
        fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        + Nova Transação
      </button>
      {transactions.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
          Nenhuma transação encontrada.
        </div>
      ) : (
        transactions.map((t, i) => (
          <div key={t.id || i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0',
            borderBottom: i < transactions.length - 1 ? '1px solid #1e2130' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: t.type === 'EXPENSE' ? '#ef444420' : '#10b98120',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>
                {t.type === 'EXPENSE' ? '↓' : '↑'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{t.description}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {t.category?.name || t.categoryName || 'Sem categoria'} · {fmtDate(t.date)}
                </div>
              </div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: t.type === 'EXPENSE' ? '#ef4444' : '#10b981', flexShrink: 0 }}>
              {t.type === 'EXPENSE' ? '-' : '+'}{fmt(t.amount)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Painel de Categorias ─────────────────────────────────────────────────────
function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('EXPENSE');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await categoryService.create({ name: newName.trim(), type: newType });
      setNewName('');
      setShowForm(false);
      await fetchCategories();
    } finally {
      setCreating(false);
    }
  }

  const expenses = categories.filter(c => c.type === 'EXPENSE');
  const incomes = categories.filter(c => c.type === 'INCOME');

  return (
    <div>
      <button onClick={() => setShowForm(s => !s)} style={{
        width: '100%', padding: '12px 0', marginBottom: 20,
        background: showForm ? '#1e2130' : 'linear-gradient(135deg, #10b981, #0ea5e9)',
        border: 'none', borderRadius: 12, color: '#fff',
        fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        {showForm ? '× Cancelar' : '+ Nova Categoria'}
      </button>

      {showForm && (
        <div style={{
          background: '#1e2130', borderRadius: 14, padding: 16, marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['EXPENSE', 'INCOME'].map(t => (
              <button key={t} onClick={() => setNewType(t)} style={{
                padding: '9px 0', border: 'none', borderRadius: 9, cursor: 'pointer',
                fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.2s',
                background: newType === t ? (t === 'EXPENSE' ? '#ef4444' : '#10b981') : '#0f1117',
                color: newType === t ? '#fff' : '#64748b',
              }}>
                {t === 'EXPENSE' ? '↓ Despesa' : '↑ Receita'}
              </button>
            ))}
          </div>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Nome da categoria"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={{ ...inputSt, margin: 0 }} />
          <button onClick={handleCreate} disabled={creating || !newName.trim()} style={{
            padding: '11px 0', border: 'none', borderRadius: 10, fontFamily: 'inherit',
            background: creating || !newName.trim() ? '#334155' : '#10b981',
            color: '#fff', fontWeight: 700, fontSize: 14,
            cursor: creating || !newName.trim() ? 'not-allowed' : 'pointer',
          }}>
            {creating ? 'Criando...' : 'Criar Categoria'}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>Carregando...</div>
      ) : (
        <>
          {[{ label: 'Despesas', list: expenses, color: '#ef4444' }, { label: 'Receitas', list: incomes, color: '#10b981' }].map(group => (
            <div key={group.label} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: 0.5, marginBottom: 10 }}>
                {group.label.toUpperCase()} ({group.list.length})
              </div>
              {group.list.length === 0 ? (
                <div style={{ color: '#475569', fontSize: 13 }}>Nenhuma categoria</div>
              ) : (
                group.list.map((c, i) => (
                  <div key={c.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', background: '#1e2130', borderRadius: 10, marginBottom: 6,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: `${group.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: group.color,
                    }}>
                      {group.label === 'Despesas' ? '↓' : '↑'}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#f1f5f9' }}>{c.name}</span>
                  </div>
                ))
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Dashboard Principal ───────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [monthId, setMonthId] = useState(null);
  const [monthInfo, setMonthInfo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'transactions' | 'categories'
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentMonth = await monthService.getCurrent();
      const id = currentMonth.id;
      setMonthId(id);
      setMonthInfo(currentMonth);

      const [sum, trans, chart] = await Promise.all([
        monthService.getSummary(id),
        monthService.getTransactions(id),
        monthService.getExpensesByCategory(id),
      ]);

      setSummary(sum);
      setTransactions(Array.isArray(trans) ? trans : []);
      const normalized = Array.isArray(chart)
        ? chart.map(item => ({
            name: item.category || item.name || 'Outros',
            value: Number(item.total || item.amount || item.value || 0),
          }))
        : [];
      setChartData(normalized);
    } catch (err) {
      if (err.response?.status === 404) setError('sem_mes');
      else setError('geral');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function handleLogout() { authService.logout(); navigate('/login'); }

  function handleTransactionSuccess() {
    setShowModal(false);
    setActivePanel(null);
    showToast('Transação salva com sucesso!', 'success');
    fetchAll();
  }

  function handleSettingsSuccess() {
    setShowSettings(false);
    showToast('Configurações salvas!', 'success');
    fetchAll();
  }

  const user = authService.getUser();
  const now = new Date();
  const monthName = monthInfo ? MONTHS_PT[(monthInfo.month ?? now.getMonth() + 1) - 1] : MONTHS_PT[now.getMonth()];
  const monthYear = monthInfo?.year ?? now.getFullYear();
  const progress = Math.min(summary?.monthlyProgress ?? 0, 100);

  const navItems = [
    { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
    { id: 'transactions', icon: '↕', label: 'Transações' },
    { id: 'categories', icon: '⊞', label: 'Categorias' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070b14', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: '#f1f5f9' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 240 : 72, background: '#0f1117', borderRight: '1px solid #1e2130',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden', flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{
  padding: '0 20px', marginBottom: 32,
  display: 'flex', alignItems: 'center', gap: 12,
  justifyContent: sidebarOpen ? 'flex-start' : 'center',
}}>
  <div style={{
    width: 36, height: 36, background: 'linear-gradient(135deg, #10b981, #3b82f6)',
    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden',
  }}>
    <svg viewBox="0 0 36 36" width="36" height="36">
      <rect x="5" y="22" width="5" height="8" rx="1" fill="white" opacity="0.5"/>
      <rect x="13" y="16" width="5" height="14" rx="1" fill="white" opacity="0.75"/>
      <rect x="21" y="10" width="5" height="20" rx="1" fill="white"/>
      <polyline points="7,22 15,15 23,10 30,6" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="30" cy="6" r="2.5" fill="white"/>
    </svg>
  </div>
  {sidebarOpen && (
    <div>
      <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', color: '#10b981', lineHeight: 1 }}>Educação</div>
      <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', color: '#3b82f6', lineHeight: 1 }}>Financeira</div>
    </div>
  )}
</div>
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const isActive = item.id === 'dashboard'
              ? activePanel === null
              : activePanel === item.id;
            return (
              <button key={item.id} onClick={() => {
                if (item.id === 'dashboard') setActivePanel(null);
                else setActivePanel(item.id);
              }} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 12px', borderRadius: 10, border: 'none',
                cursor: 'pointer', width: '100%', textAlign: 'left',
                fontFamily: 'inherit', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                background: isActive ? '#10b98120' : 'transparent',
                color: isActive ? '#10b981' : '#64748b',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '0 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10, background: '#1e2130', marginBottom: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, flexShrink: 0,
            }}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || 'Usuário'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Conta pessoal</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%',
            fontFamily: 'inherit', fontWeight: 600, fontSize: 13, background: 'transparent', color: '#ef4444',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#ef444415'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>⏻</span>
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: '1px solid #1e2130',
          position: 'sticky', top: 0, background: '#070b14', zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(s => !s)} style={{
              background: '#1e2130', border: 'none', color: '#94a3b8',
              width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>☰</button>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Visão Geral</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                {monthName} {monthYear}
                {monthId && <span style={{ color: '#334155', marginLeft: 8 }}>· Mês #{monthId}</span>}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {monthId && (
              <button onClick={() => setShowSettings(true)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                background: '#1e2130', border: '1px solid #2d3348', borderRadius: 12,
                color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2d3348'}
              >
                ⚙ Configurar Mês
              </button>
            )}
            <button onClick={() => setShowModal(true)} disabled={!monthId} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              background: monthId ? 'linear-gradient(135deg, #10b981, #0ea5e9)' : '#1e2130',
              border: 'none', borderRadius: 12, color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: monthId ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', boxShadow: monthId ? '0 4px 20px #10b98130' : 'none',
              transition: 'all 0.2s',
            }}>
              + Nova Transação
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: '28px', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#64748b', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 36, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
              <span>Carregando dados...</span>
            </div>
          ) : error === 'sem_mes' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 48 }}>📅</div>
              <h2 style={{ color: '#f1f5f9', margin: 0 }}>Nenhum mês aberto</h2>
              <p style={{ color: '#64748b', maxWidth: 360 }}>Crie um mês financeiro para começar.</p>
              <CreateMonthForm onSuccess={fetchAll} showToast={showToast} />
            </div>
          ) : error ? (
            <div style={{ color: '#ef4444', textAlign: 'center', padding: 40 }}>
              Erro ao carregar dados.
              <br />
              <button onClick={fetchAll} style={{ marginTop: 16, padding: '10px 20px', background: '#1e2130', border: 'none', borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit' }}>
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* Cards principais */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                <StatCard label="Saldo" value={fmt(summary?.balance)} color="#10b981" icon="◎" />
                <StatCard label="Receitas" value={fmt(summary?.income)} color="#3b82f6" icon="↑" />
                <StatCard label="Despesas" value={fmt(summary?.expenses)} color="#ef4444" icon="↓" />
                <StatCard label="Limite Diário" value={fmt(summary?.dailyLimit)} color="#f59e0b" icon="⊝" />
              </div>

              {/* Cards secundários */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                <StatCard label="Gasto Hoje" value={fmt(summary?.spentToday)} color="#8b5cf6" icon="○" small />
                <StatCard label="Restante Hoje" value={fmt(summary?.remainingToday)} color="#14b8a6" icon="●" small />
                <StatCard label="Disponível Mês" value={fmt(summary?.availableToSpend)} color="#f97316" icon="◷" small />
                <StatCard label="Meta Economia" value={fmt(summary?.savingsGoal)} color="#ec4899" icon="★" small />
              </div>

              {/* Progresso */}
              <div style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>PROGRESSO DO MÊS</span>
                  <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700 }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ background: '#1e2130', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, transition: 'width 1s ease',
                    width: `${progress}%`,
                    background: progress > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #3b82f6)',
                  }} />
                </div>
                {summary?.warning && (
                  <p style={{ margin: '12px 0 0', fontSize: 13, color: '#f59e0b', background: '#f59e0b15', borderRadius: 10, padding: '10px 14px' }}>
                    ⚠️ {summary.warning}
                  </p>
                )}
                {summary?.insight && (
                  <p style={{ margin: '10px 0 0', fontSize: 13, color: '#94a3b8', background: '#1e2130', borderRadius: 10, padding: '10px 14px', lineHeight: 1.5 }}>
                    💡 {summary.insight}
                  </p>
                )}
              </div>

              {/* Gráfico + Transações */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>
                <div style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 16, padding: '24px' }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: 14, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5 }}>
                    DESPESAS POR CATEGORIA
                  </h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                          {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #2d3348', borderRadius: 10, color: '#f1f5f9', fontSize: 13 }} formatter={val => fmt(val)} />
                        <Legend formatter={value => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 13 }}>
                      Sem despesas este mês
                    </div>
                  )}
                </div>

                <div style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 16, padding: '24px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 14, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5 }}>ÚLTIMAS TRANSAÇÕES</h3>
                    <span style={{ fontSize: 12, color: '#475569' }}>{transactions.length} registro(s)</span>
                  </div>
                  <div style={{ overflowY: 'auto', maxHeight: 280 }}>
                    {transactions.length === 0 ? (
                      <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                        Nenhuma transação encontrada.<br />
                        <span style={{ color: '#10b981', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowModal(true)}>
                          Adicionar primeira transação →
                        </span>
                      </div>
                    ) : (
                      transactions.slice(0, 20).map((t, i) => (
                        <div key={t.id || i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 0', borderBottom: i < transactions.length - 1 ? '1px solid #1e2130' : 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: t.type === 'EXPENSE' ? '#ef444420' : '#10b98120',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                            }}>
                              {t.type === 'EXPENSE' ? '↓' : '↑'}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{t.description}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>
                                {t.category?.name || t.categoryName || 'Sem categoria'} · {fmtDate(t.date)}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 14, color: t.type === 'EXPENSE' ? '#ef4444' : '#10b981' }}>
                            {t.type === 'EXPENSE' ? '-' : '+'}{fmt(t.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Painéis Laterais ── */}
      {activePanel === 'transactions' && (
        <SidePanel title="Transações" onClose={() => setActivePanel(null)}>
          <TransactionsPanel transactions={transactions} onNewTransaction={() => { setActivePanel(null); setShowModal(true); }} />
        </SidePanel>
      )}
      {activePanel === 'categories' && (
        <SidePanel title="Categorias" onClose={() => setActivePanel(null)}>
          <CategoriesPanel />
        </SidePanel>
      )}

      {/* ── Modais ── */}
      {showModal && monthId && (
        <TransactionModal monthId={monthId} onClose={() => setShowModal(false)} onSuccess={handleTransactionSuccess} />
      )}
      {showSettings && monthId && (
        <MonthSettingsModal
          monthId={monthId}
          currentIncome={monthInfo?.monthlyIncome}
          currentGoal={monthInfo?.savingsGoal}
          onClose={() => setShowSettings(false)}
          onSuccess={handleSettingsSuccess}
        />
      )}

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d3348; border-radius: 99px; }
        input::placeholder { color: #475569; }
        input:focus { border-color: #10b981 !important; outline: none; }
        select:focus { border-color: #10b981 !important; outline: none; }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color, icon, small }) {
  return (
    <div style={{
      background: '#0f1117', border: '1px solid #1e2130',
      borderRadius: 16, padding: small ? '16px 20px' : '20px 24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `${color}12` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 14, color, width: 28, height: 28, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
        <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
      </div>
      <div style={{ fontSize: small ? 18 : 22, fontWeight: 800, color: '#f1f5f9' }}>{value}</div>
    </div>
  );
}

function CreateMonthForm({ onSuccess, showToast }) {
  const [loading, setLoading] = useState(false);
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');

  async function handleCreate() {
    if (!income) return;
    setLoading(true);
    const now = new Date();
    try {
      await monthService.createCurrent({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        monthlyIncome: Number(income),
        savingsGoal: Number(goal || 0),
      });
      showToast('Mês criado com sucesso!', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erro ao criar mês', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
      <input type="number" placeholder="Renda mensal (R$)" value={income}
        onChange={e => setIncome(e.target.value)} style={inputSt} />
      <input type="number" placeholder="Meta de economia (R$) — opcional" value={goal}
        onChange={e => setGoal(e.target.value)} style={inputSt} />
      <button onClick={handleCreate} disabled={loading || !income} style={{
        padding: '12px 0',
        background: loading || !income ? '#334155' : 'linear-gradient(135deg, #10b981, #0ea5e9)',
        border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700,
        fontSize: 14, cursor: loading || !income ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      }}>
        {loading ? 'Criando...' : '+ Criar Mês Atual'}
      </button>
    </div>
  );
}

const labelSt = { display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 };
const inputSt = {
  width: '100%', background: '#1e2130', border: '1px solid #2d3348',
  borderRadius: 10, padding: '11px 14px', color: '#f1f5f9', fontSize: 14,
  boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s',
};
