import { Eraser, MessageSquareText, SearchX } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';

function Stat({ label, value, tone }) {
  const toneClass =
    tone === 'twitch'
      ? 'border-twitch/40 text-purple-100'
      : tone === 'tiktok'
        ? 'border-tiktok/40 text-pink-100'
        : 'border-accent/40 text-cyan-100';

  return (
    <div className={`flex items-center gap-2 rounded-md border bg-slate-950/45 px-3 py-2 ${toneClass}`}>
      <span className="text-lg font-black leading-none">{value}</span>
      <span className="text-[11px] font-bold uppercase tracking-normal text-slate-400">{label}</span>
    </div>
  );
}

export function ChatWindow({ messages, fontSize, stats, onClearMessages }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const empty = messages.length === 0;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Stat label="Total" value={stats.total} tone="system" />
          <Stat label="Twitch" value={stats.twitch} tone="twitch" />
          <Stat label="TikTok" value={stats.tiktok} tone="tiktok" />
        </div>
        <button
          className="icon-text-button border-slate-700/90 bg-slate-900/70 text-slate-200 hover:border-red-400/50 hover:text-red-100"
          type="button"
          onClick={onClearMessages}
          title="Vider le flux"
        >
          <Eraser size={16} />
          Vider
        </button>
      </div>

      <section className="chat-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6" aria-live="polite">
        {empty ? (
          <div className="flex h-full min-h-[360px] items-center justify-center">
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-md border border-accent/30 bg-accent/10 text-cyan-100 shadow-glow">
                <SearchX size={26} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-100">Aucun message affiché</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Connecte Twitch ou TikTok, ou ajuste tes filtres dans les paramètres.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} fontSize={fontSize} />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </section>

      <footer className="flex h-[60px] items-center gap-3 border-t border-white/10 bg-slate-950/70 px-4 text-xs font-semibold uppercase text-slate-500 sm:px-6">
        <MessageSquareText size={16} className="text-accent" />
        Flux chronologique unifié
      </footer>
    </main>
  );
}
