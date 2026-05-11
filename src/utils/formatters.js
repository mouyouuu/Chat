export const MAX_CHAT_MESSAGES = 600;

export const PLATFORM_META = {
  twitch: {
    label: 'TWITCH',
    dotClass: 'bg-twitch',
    badgeClass: 'border-twitch/50 bg-twitch/15 text-purple-100 shadow-twitch',
  },
  tiktok: {
    label: 'TIKTOK',
    dotClass: 'bg-tiktok',
    badgeClass: 'border-tiktok/50 bg-tiktok/15 text-pink-100 shadow-tiktok',
  },
  system: {
    label: 'SYSTEM',
    dotClass: 'bg-accent',
    badgeClass: 'border-accent/50 bg-accent/15 text-cyan-100 shadow-glow',
  },
};

const clockFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatClock(timestamp) {
  return clockFormatter.format(new Date(timestamp));
}

export function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeTwitchChannel(channel) {
  return normalizeText(channel).replace(/^#/, '').replace(/^@/, '').toLowerCase();
}

export function normalizeTwitchToken(token) {
  const cleaned = normalizeText(token);

  if (!cleaned) {
    return '';
  }

  return cleaned.startsWith('oauth:') ? cleaned : `oauth:${cleaned}`;
}

export function normalizeTikTokUsername(username) {
  return normalizeText(username).replace(/^@/, '');
}

export function createChatMessage({ platform, username, comment, timestamp = Date.now(), meta = {} }) {
  const cleanPlatform = platform === 'twitch' || platform === 'tiktok' ? platform : 'system';
  const cleanUsername = normalizeText(username) || 'viewer';
  const cleanComment = normalizeText(comment);

  return {
    id: meta.id || `${cleanPlatform}-${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
    platform: cleanPlatform,
    username: cleanUsername,
    comment: cleanComment,
    timestamp,
    meta,
  };
}

export function createSystemMessage(comment, level = 'info') {
  return createChatMessage({
    platform: 'system',
    username: level,
    comment,
    meta: { level },
  });
}

export function appendLimitedMessage(messages, nextMessage) {
  return [...messages, nextMessage].slice(-MAX_CHAT_MESSAGES);
}

export function filterMessages(messages, filters) {
  const keyword = normalizeText(filters.keyword).toLowerCase();

  return messages.filter((message) => {
    if (message.platform === 'twitch' && !filters.showTwitch) {
      return false;
    }

    if (message.platform === 'tiktok' && !filters.showTikTok) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return `${message.username} ${message.comment}`.toLowerCase().includes(keyword);
  });
}
