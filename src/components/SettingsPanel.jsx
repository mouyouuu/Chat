import {
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  PlugZap,
  Save,
  SlidersHorizontal,
  Trash2,
  Twitch,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function Field({ label, value, onChange, placeholder, type = 'text', autoComplete = 'off' }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </label>
  );
}

function Toggle({ label, checked, onChange, tone = 'accent' }) {
  const toneClass =
    tone === 'twitch'
      ? 'peer-checked:bg-twitch'
      : tone === 'tiktok'
        ? 'peer-checked:bg-tiktok'
        : 'peer-checked:bg-accent';

  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-slate-700/80 bg-slate-950/40 px-3 py-2 text-sm font-bold text-slate-200">
      <span>{label}</span>
      <span className="relative inline-flex h-6 w-11 items-center">
        <input className="peer sr-only" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className={`absolute inset-0 rounded-full bg-slate-700 transition ${toneClass}`} />
        <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function ErrorBox({ children }) {
  if (!children) {
    return null;
  }

  return <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-100">{children}</div>;
}

export function SettingsPanel({
  open,
  settings,
  storageError,
  twitch,
  tiktok,
  onClose,
  onSave,
  onClearData,
  onConnectTwitch,
  onDisconnectTwitch,
  onConnectTikTok,
  onDisconnectTikTok,
  onConnectAll,
  onDisconnectAll,
}) {
  const [draft, setDraft] = useState(settings);
  const [showSecrets, setShowSecrets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const twitchReady = useMemo(
    () => draft.twitchChannel && draft.twitchUsername && draft.twitchToken,
    [draft.twitchChannel, draft.twitchToken, draft.twitchUsername],
  );
  const tiktokReady = useMemo(
    () => draft.tiktokUsername && (draft.tiktoolCredential || import.meta.env.VITE_TIKTOOL_API_KEY),
    [draft.tiktokUsername, draft.tiktoolCredential],
  );

  const updateField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateFilter = (field, value) => {
    setDraft((current) => ({
      ...current,
      filters: {
        ...current.filters,
        [field]: value,
      },
    }));
  };

  const save = async () => {
    setIsSaving(true);
    try {
      await onSave(draft);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <aside className="fixed inset-0 z-40 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md border border-accent/35 bg-accent/10 text-cyan-100">
              <SlidersHorizontal size={18} />
            </div>
            <h2 className="text-lg font-black text-slate-100">Paramètres</h2>
          </div>
          <button className="icon-button border-slate-700 bg-slate-900 text-slate-100" type="button" onClick={onClose} title="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="settings-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="grid gap-5">
            <section className="settings-section">
              <div className="section-heading text-purple-100">
                <Twitch size={18} />
                Twitch
              </div>
              <div className="grid gap-3">
                <Field
                  label="Channel Twitch"
                  value={draft.twitchChannel}
                  onChange={(value) => updateField('twitchChannel', value)}
                  placeholder="nom_de_chaine"
                />
                <Field
                  label="Pseudo bot Twitch"
                  value={draft.twitchUsername}
                  onChange={(value) => updateField('twitchUsername', value)}
                  placeholder="ton_compte_twitch"
                />
                <Field
                  label="OAuth token"
                  type={showSecrets ? 'text' : 'password'}
                  value={draft.twitchToken}
                  onChange={(value) => updateField('twitchToken', value)}
                  placeholder="oauth:xxxxxxxx"
                  autoComplete="new-password"
                />
                <ErrorBox>{twitch.error}</ErrorBox>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="icon-text-button justify-center border-twitch/45 bg-twitch/15 text-purple-100 hover:bg-twitch/25 disabled:opacity-40"
                    type="button"
                    onClick={() => onConnectTwitch(draft)}
                    disabled={!twitchReady || twitch.isConnecting}
                  >
                    <PlugZap size={16} />
                    Connect
                  </button>
                  <button
                    className="icon-text-button justify-center border-slate-700 bg-slate-900 text-slate-200"
                    type="button"
                    onClick={onDisconnectTwitch}
                  >
                    <LogOut size={16} />
                    Disconnect
                  </button>
                </div>
              </div>
            </section>

            <section className="settings-section">
              <div className="section-heading text-pink-100">
                <KeyRound size={18} />
                TikTool / TikTok
              </div>
              <div className="grid gap-3">
                <Field
                  label="Pseudo TikTok Live"
                  value={draft.tiktokUsername}
                  onChange={(value) => updateField('tiktokUsername', value)}
                  placeholder="@pseudo_tiktok"
                />
                <Field
                  label="Clé API ou JWT TikTool"
                  type={showSecrets ? 'text' : 'password'}
                  value={draft.tiktoolCredential}
                  onChange={(value) => updateField('tiktoolCredential', value)}
                  placeholder="api_key ou jwt_key"
                  autoComplete="new-password"
                />
                <ErrorBox>{tiktok.error}</ErrorBox>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="icon-text-button justify-center border-tiktok/45 bg-tiktok/15 text-pink-100 hover:bg-tiktok/25 disabled:opacity-40"
                    type="button"
                    onClick={() => onConnectTikTok(draft)}
                    disabled={!tiktokReady || tiktok.isConnecting}
                  >
                    <PlugZap size={16} />
                    Connect
                  </button>
                  <button
                    className="icon-text-button justify-center border-slate-700 bg-slate-900 text-slate-200"
                    type="button"
                    onClick={onDisconnectTikTok}
                  >
                    <LogOut size={16} />
                    Disconnect
                  </button>
                </div>
              </div>
            </section>

            <section className="settings-section">
              <div className="section-heading text-cyan-100">
                <Eye size={18} />
                Affichage
              </div>
              <div className="grid gap-3">
                <Toggle label="Afficher Twitch" checked={draft.filters.showTwitch} onChange={(value) => updateFilter('showTwitch', value)} tone="twitch" />
                <Toggle label="Afficher TikTok" checked={draft.filters.showTikTok} onChange={(value) => updateFilter('showTikTok', value)} tone="tiktok" />
                <Toggle label="Son nouveau message" checked={draft.filters.sound} onChange={(value) => updateFilter('sound', value)} />
                <label className="grid gap-2 text-sm font-bold text-slate-200">
                  Filtre mot-clé
                  <input
                    className="form-input"
                    value={draft.filters.keyword}
                    onChange={(event) => updateFilter('keyword', event.target.value)}
                    placeholder="pseudo, mot, emote..."
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-200">
                  Taille texte: {draft.filters.fontSize}px
                  <input
                    className="accent-cyan-400"
                    type="range"
                    min="12"
                    max="20"
                    value={draft.filters.fontSize}
                    onChange={(event) => updateFilter('fontSize', Number(event.target.value))}
                  />
                </label>
              </div>
            </section>

            <ErrorBox>{storageError}</ErrorBox>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 bg-slate-950/95 p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-2">
            <button className="icon-text-button justify-center border-accent/45 bg-accent/15 text-cyan-100" type="button" onClick={() => onConnectAll(draft)}>
              <PlugZap size={16} />
              Connect all
            </button>
            <button className="icon-text-button justify-center border-red-400/35 bg-red-500/10 text-red-100" type="button" onClick={onDisconnectAll}>
              <LogOut size={16} />
              Disconnect all
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              className="icon-text-button justify-center border-slate-700 bg-slate-900 text-slate-100 disabled:opacity-50"
              type="button"
              onClick={save}
              disabled={isSaving}
            >
              <Save size={16} />
              Save
            </button>
            <button
              className="icon-text-button justify-center border-slate-700 bg-slate-900 text-slate-100"
              type="button"
              onClick={() => setShowSecrets((current) => !current)}
            >
              {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
              Secrets
            </button>
            <button
              className="icon-text-button justify-center border-red-400/35 bg-red-500/10 text-red-100"
              type="button"
              onClick={onClearData}
            >
              <Trash2 size={16} />
              Oublier
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
