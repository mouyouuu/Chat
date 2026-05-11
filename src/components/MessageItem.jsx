import { formatClock, PLATFORM_META } from '../utils/formatters';

export function MessageItem({ message, fontSize }) {
  const meta = PLATFORM_META[message.platform] || PLATFORM_META.system;
  const isSystem = message.platform === 'system';

  return (
    <article
      className={`message-row border-l-2 ${
        isSystem ? 'border-accent/60 bg-accent/5' : 'border-white/10 bg-slate-900/55'
      }`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <span className={`platform-badge ${meta.badgeClass}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
        {meta.label}
      </span>
      <span className={isSystem ? 'text-cyan-100' : 'text-slate-100'}>@{message.username}</span>
      <span className="text-slate-500">-</span>
      <p className="min-w-0 flex-1 break-words leading-6 text-slate-200">{message.comment}</p>
      <span className="text-slate-500">-</span>
      <time className="shrink-0 text-xs font-semibold text-slate-400" dateTime={new Date(message.timestamp).toISOString()}>
        {formatClock(message.timestamp)}
      </time>
    </article>
  );
}
