import { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';

const today = () => new Date().toISOString().split('T')[0];

export default function TransactionModal({ monthId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE',
    categoryId: '',
    date: today(),
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [errors, setErrors] = useState({});
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories by selected type
  const filtered = categories.filter((c) => c.type === form.type);

  async function fetchCategories() {
    setLoadingCats(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch {
      // silently fail; user can create categories
    } finally {
      setLoadingCats(false);
    }
  }

  function validate() {
    const e = {};
    if (!form.description.trim()) e.description = 'Descrição obrigatória';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Valor inválido';
    if (!form.categoryId) e.categoryId = 'Selecione uma categoria';
    if (!form.date) e.date = 'Data obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await transactionService.create({
        monthId,
        categoryId: Number(form.categoryId),
        description: form.description.trim(),
        amount: Number(form.amount),
        type: form.type,
        date: form.date,
      });
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao salvar transação';
      setErrors({ global: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const created = await categoryService.create({
        name: newCatName.trim(),
        type: form.type,
      });
      setCategories((prev) => [...prev, created]);
      setForm((f) => ({ ...f, categoryId: String(created.id) }));
      setNewCatName('');
      setShowNewCat(false);
    } catch {
      // silently fail
    } finally {
      setCreatingCat(false);
    }
  }

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Overlay click to close
  function handleOverlay(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const accent = form.type === 'EXPENSE' ? '#ef4444' : '#10b981';

  return (
    <div
      onClick={handleOverlay}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          background: '#0f1117',
          border: '1px solid #1e2130',
          borderRadius: 20,
          width: '100%',
          maxWidth: 460,
          padding: '32px 28px',
          position: 'relative',
          animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h2 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, margin: 0 }}>Nova Transação</h2>
            <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Mês #{monthId}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#1e2130',
              border: 'none',
              color: '#94a3b8',
              width: 36,
              height: 36,
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            ×
          </button>
        </div>

        {/* Type toggle */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 20,
            background: '#1e2130',
            borderRadius: 12,
            padding: 4,
          }}
        >
          {['EXPENSE', 'INCOME'].map((t) => (
            <button
              key={t}
              onClick={() => { set('type', t); set('categoryId', ''); }}
              style={{
                padding: '10px 0',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                transition: 'all 0.2s',
                background: form.type === t ? (t === 'EXPENSE' ? '#ef4444' : '#10b981') : 'transparent',
                color: form.type === t ? '#fff' : '#64748b',
              }}
            >
              {t === 'EXPENSE' ? '↓ Despesa' : '↑ Receita'}
            </button>
          ))}
        </div>

        {/* Description */}
        <Field label="Descrição" error={errors.description}>
          <input
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Ex: Mercado, Salário..."
            style={inputStyle(errors.description)}
          />
        </Field>

        {/* Amount */}
        <Field label="Valor (R$)" error={errors.amount}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="0,00"
            style={inputStyle(errors.amount)}
          />
        </Field>

        {/* Category */}
        <Field label="Categoria" error={errors.categoryId}>
          {loadingCats ? (
            <div style={{ ...inputStyle(), color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              Carregando...
            </div>
          ) : (
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              style={inputStyle(errors.categoryId)}
            >
              <option value="">Selecione uma categoria</option>
              {filtered.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowNewCat(!showNewCat)}
            style={{
              marginTop: 8,
              background: 'none',
              border: `1px dashed ${accent}40`,
              color: accent,
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s',
            }}
          >
            {showNewCat ? '− Cancelar' : '+ Criar nova categoria'}
          </button>
          {showNewCat && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={`Nome para ${form.type === 'EXPENSE' ? 'despesa' : 'receita'}`}
                style={{ ...inputStyle(), flex: 1, margin: 0 }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
              <button
                onClick={handleCreateCategory}
                disabled={creatingCat}
                style={{
                  background: accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '0 16px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  opacity: creatingCat ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {creatingCat ? '...' : 'Criar'}
              </button>
            </div>
          )}
        </Field>

        {/* Date */}
        <Field label="Data" error={errors.date}>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            style={inputStyle(errors.date)}
          />
        </Field>

        {/* Global error */}
        {errors.global && (
          <div style={{
            background: '#ef444420',
            border: '1px solid #ef444440',
            color: '#ef4444',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            marginBottom: 16,
          }}>
            {errors.global}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 0',
            background: loading ? '#334155' : accent,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            letterSpacing: 0.3,
          }}
        >
          {loading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: 18 }}>⟳</span>
              Salvando...
            </>
          ) : (
            'Salvar Transação'
          )}
        </button>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </label>
      {children}
      {error && (
        <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{error}</span>
      )}
    </div>
  );
}

function inputStyle(error) {
  return {
    width: '100%',
    background: '#1e2130',
    border: `1px solid ${error ? '#ef4444' : '#2d3348'}`,
    borderRadius: 10,
    padding: '11px 14px',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
}
