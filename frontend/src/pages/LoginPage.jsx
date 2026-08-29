import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useI18n } from '../i18n';
import AlertBanner from '../components/common/AlertBanner';
import IconButton from '../components/common/IconButton';

export default function LoginPage() {
  const setToken = useAuthStore((s) => s.setToken);
  const { t } = useI18n();
  const [inputToken, setInputToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputToken.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inputToken.trim() })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('login.error'));
      }

      const data = await response.json();
      setToken(data.token);
      navigate('/sparks');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-teal-500/10 blur-[128px]" />

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 z-10 transition-all duration-300 hover:border-zinc-700/80 animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="BiuNote Logo"
            className="w-16 h-16 rounded-2xl border border-emerald-500/20 mb-4 transition-all duration-300 hover:scale-105 object-contain"
          />
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">BiuNote</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Token</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 group-focus-within:text-emerald-400 transition-colors">
                <KeyRound className="w-5 h-5" />
              </span>
              <input
                type="password"
                placeholder={t('login.placeholder')}
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {error && <AlertBanner variant="error" message={error} />}

          <IconButton
            type="submit"
            icon={ArrowRight}
            loading={loading}
            disabled={loading || !inputToken.trim()}
            size="lg"
            shape="rounded-xl"
            variant={inputToken.trim() && !loading ? 'primary' : 'default'}
            className={`w-full h-11 ${!inputToken.trim() || loading ? 'opacity-40' : ''}`}
          />
        </form>
      </div>
    </div>
  );
}
