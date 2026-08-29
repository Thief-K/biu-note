import { useState, useEffect, type FormEvent } from 'react';
import { Settings, User, Cpu, Sun, Moon, Monitor, Save, LogOut, Check, Loader2, Globe, Eye, EyeOff } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { useNotesStore } from '../stores/notesStore';
import { useAuthStore } from '../stores/authStore';
import { useModalStore } from '../stores/modalStore';
import { apiFetch } from '../utils/api';
import { useI18n, type LocaleKey } from '../i18n';
import PageHeader from '../components/common/PageHeader';
import AlertBanner from '../components/common/AlertBanner';
import IconButton from '../components/common/IconButton';
import ContentContainer from '../components/common/ContentContainer';

interface FormSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  embeddingModel: string;
}

export default function SettingsPage() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const checkAiConfig = useNotesStore((s) => s.checkAiConfig);
  const setNotes = useNotesStore((s) => s.setNotes);
  const logout = useAuthStore((s) => s.logout);
  const showConfirm = useModalStore((s) => s.showConfirm);
  const { t, language, setLanguage } = useI18n();

  const handleLogout = () => {
    showConfirm(t('settings.logoutConfirm'), () => {
      logout();
      setNotes([]);
    });
  };

  const [formSettings, setFormSettings] = useState<FormSettings>({
    apiKey: '',
    baseUrl: '',
    model: '',
    embeddingModel: ''
  });
  const [initialSettings, setInitialSettings] = useState<FormSettings>({
    apiKey: '',
    baseUrl: '',
    model: '',
    embeddingModel: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/settings');
      if (res.ok) {
        const data = (await res.json()) as {
          maskedKey?: string;
          apiKey?: string;
          baseUrl?: string;
          model?: string;
          embeddingModel?: string;
        };
        const loaded: FormSettings = {
          apiKey: data.maskedKey || data.apiKey || '',
          baseUrl: data.baseUrl || '',
          model: data.model || '',
          embeddingModel: data.embeddingModel || ''
        };
        setFormSettings(loaded);
        setInitialSettings(loaded);
      }
    } catch (err: unknown) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const isDirty = JSON.stringify(formSettings) !== JSON.stringify(initialSettings);

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!isDirty || saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formSettings)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || t('settings.saveFailed'));
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      await loadSettings();
      await checkAiConfig();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 text-zinc-100">
      {/* 1. Header */}
      <PageHeader
        icon={Settings}
        iconClassName="bg-zinc-800/80 border-zinc-700/80 text-zinc-300"
        title={t('settings.title')}
      />

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 pb-32">
        <ContentContainer>
          {error && <AlertBanner variant="error" message={error} />}

          {/* Theme Settings Card (Flat Pure Border) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-850 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              <span>{t('settings.appearance')}</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dark', icon: Moon },
                { id: 'light', icon: Sun },
                { id: 'system', icon: Monitor }
              ].map(({ id, icon }) => (
                <IconButton
                  key={id}
                  icon={icon}
                  variant={theme === id ? 'emerald' : 'default'}
                  className="w-full h-10"
                  onClick={() => setTheme(id)}
                />
              ))}
            </div>
          </div>

          {/* Language Settings Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-850 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>{t('settings.language')}</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'zh' as LocaleKey, label: '简体中文' },
                { id: 'en' as LocaleKey, label: 'English' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLanguage(id)}
                  className={`h-10 px-4 rounded-xl text-xs font-medium border transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                    language === id
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI LLM Settings Card */}
          <form
            onSubmit={handleSaveSettings}
            className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-850 flex flex-col gap-3.5"
          >
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>{t('settings.aiConfig')}</span>
            </h3>

            {loading ? (
              <div className="py-6 flex items-center justify-center text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-300">API Key</label>
                  <div className="relative flex items-center">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={formSettings.apiKey}
                      onChange={(e) => setFormSettings({ ...formSettings, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-3.5 pr-10 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 p-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-300">Base URL</label>
                  <input
                    type="text"
                    value={formSettings.baseUrl}
                    onChange={(e) => setFormSettings({ ...formSettings, baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-300">Chat Model</label>
                    <input
                      type="text"
                      value={formSettings.model}
                      onChange={(e) => setFormSettings({ ...formSettings, model: e.target.value })}
                      placeholder="gpt-4o-mini"
                      className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-300">Embedding Model</label>
                    <input
                      type="text"
                      value={formSettings.embeddingModel}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, embeddingModel: e.target.value })
                      }
                      placeholder="text-embedding-3-small"
                      className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <IconButton
                    type="submit"
                    icon={savedSuccess ? Check : Save}
                    loading={saving}
                    disabled={saving || (!isDirty && !savedSuccess)}
                    variant={savedSuccess || isDirty ? 'primary' : 'default'}
                    size="md"
                    className={!isDirty && !savedSuccess && !saving ? 'opacity-40 cursor-not-allowed' : ''}
                  />
                </div>
              </>
            )}
          </form>

          {/* Account / Logout Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-850 flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{t('settings.account')}</span>
            </h3>

            <IconButton
              icon={LogOut}
              variant="danger"
              size="md"
              onClick={handleLogout}
            />
          </div>
        </ContentContainer>
      </div>
    </div>
  );
}
