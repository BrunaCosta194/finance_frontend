import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Preencha todos os campos'); return; }
    if (tab === 'register' && !form.name) { setError('Nome é obrigatório'); return; }
    setLoading(true);
    try {
      if (tab === 'login') {
        await authService.login(form.email, form.password);
      } else {
        await authService.register(form.name, form.email, form.password);
        await authService.login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070b14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: -120, left: -80,
        width: 500, height: 500,
        background: 'radial-gradient(circle, #10b98115 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, right: -60,
        width: 400, height: 400,
        background: 'radial-gradient(circle, #3b82f615 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 52,
            height: 52,
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 24,
          }}>
            ₿
          </div>
          <h1 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 800, margin: 0 }}>FinEdu</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '6px 0 0' }}>Educação Financeira Inteligente</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#0f1117',
          border: '1px solid #1e2130',
          borderRadius: 24,
          padding: '32px 28px',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: '#1e2130', borderRadius: 12, padding: 4, marginBottom: 28,
          }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{
                  padding: '10px 0', border: 'none', borderRadius: 9, cursor: 'pointer',
                  fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                  background: tab === t ? '#10b981' : 'transparent',
                  color: tab === t ? '#fff' : '#64748b',
                  fontFamily: 'inherit',
                }}>
                {t === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>NOME</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Seu nome completo" style={inputSt} />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>E-MAIL</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="email@exemplo.com" style={inputSt} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>SENHA</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="••••••••" style={inputSt} />
            </div>

            {error && (
              <div style={{
                background: '#ef444415', border: '1px solid #ef444430',
                color: '#ef4444', borderRadius: 10, padding: '10px 14px',
                fontSize: 13, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px 0',
              background: loading ? '#334155' : 'linear-gradient(135deg, #10b981, #0ea5e9)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', letterSpacing: 0.3, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {loading
                ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Aguarde...</>
                : tab === 'login' ? 'Entrar' : 'Criar conta'
              }
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #475569; }
        input:focus { border-color: #10b981 !important; outline: none; }
        select:focus { border-color: #10b981 !important; outline: none; }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600,
  marginBottom: 6, letterSpacing: 0.5,
};
const inputSt = {
  width: '100%', background: '#1e2130', border: '1px solid #2d3348',
  borderRadius: 10, padding: '11px 14px', color: '#f1f5f9',
  fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s',
};
