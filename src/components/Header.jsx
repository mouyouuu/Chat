import { MessagesSquare, PlugZap, Power, Settings, Wifi, WifiOff } from 'lucide-react';

function StatusPill({ label, status }) {
  const tone =
    status === 'connected'
      ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100'
      : status === 'connecting'
        ? 'border-amber-300/50 bg-amber-300/10 text-amber-100'
        : 'border-slate-700 bg-slate-900 text-slate-400';
  const Icon = status === 'connected' ? Wifi : WifiOff;
  const statusText = status === 'connected' ? 'online' : status === 'connecting' ? 'sync' : 'offline';

  return (
    <span className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-black uppercase ${tone}`}>
      <Icon size={14} />
      {label} {statusText}
    </span>
  );
}

export function Header({
  twitchStatus,
  tiktokStatus,
  isAnyConnected,
  isAnyConnecting,
  onConnectAll,
  onDisconnectAll,
  onOpenSettings,
}) {
  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/85 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-accent/35 bg-accent/10 text-cyan-100 shadow-glow">
          <MessagesSquare size={22} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black leading-tight text-slate-100 sm:text-2xl">
            Unified Stream Chat
          </h1>
          <p className="hidden text-xs font-bold uppercase text-slate-500 sm:block">Twitch + TikTok Live</p>
        </div>
      </div>

      <div className="hidden items-center gap-2 lg:flex">
        <StatusPill label="Twitch" status={twitchStatus} />
        <StatusPill label="TikTok" status={tiktokStatus} />
      </div>

      <div className="flex items-center gap-2">
        {isAnyConnected ? (
          <button
            className="icon-text-button border-red-400/35 bg-red-500/10 text-red-100 hover:bg-red-500/20"
            type="button"
            onClick={onDisconnectAll}
            title="Déconnecter les plateformes"
          >
            <Power size={16} />
            <span className="hidden sm:inline">Stop</span>
          </button>
        ) : (
          <button
            className="icon-text-button border-accent/45 bg-accent/15 text-cyan-100 hover:bg-accent/25 disabled:opacity-50"
            type="button"
            onClick={onConnectAll}
            disabled={isAnyConnecting}
            title="Connecter les plateformes configurées"
          >
            <PlugZap size={16} />
            <span className="hidden sm:inline">Connect</span>
          </button>
        )}
        <button
          className="icon-button border-slate-700/90 bg-slate-900/75 text-slate-100 hover:border-accent/50 hover:text-cyan-100"
          type="button"
          onClick={onOpenSettings}
          title="Paramètres"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
