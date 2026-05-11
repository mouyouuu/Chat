import { createChatMessage, normalizeText, normalizeTikTokUsername } from './formatters';

export function isLikelyJwt(value) {
  const cleaned = normalizeText(value).replace(/^jwt:/i, '');
  return cleaned.split('.').length === 3;
}

export function buildTikToolWebSocketUrl({ username, credential }) {
  const url = new URL('wss://api.tik.tools');
  const cleanUsername = normalizeTikTokUsername(username);
  const cleanCredential = normalizeText(credential);

  url.searchParams.set('uniqueId', cleanUsername);

  if (isLikelyJwt(cleanCredential)) {
    url.searchParams.set('jwtKey', cleanCredential.replace(/^jwt:/i, ''));
  } else {
    url.searchParams.set('apiKey', cleanCredential);
  }

  return url.toString();
}

export function parseTikToolPayload(rawValue) {
  if (!rawValue) {
    return null;
  }

  if (typeof rawValue === 'string') {
    try {
      return JSON.parse(rawValue);
    } catch {
      return null;
    }
  }

  return rawValue;
}

export function extractTikToolChatMessage(payload) {
  if (!payload) {
    return null;
  }

  const eventName = payload.event || payload.type || payload.action;

  if (eventName !== 'chat') {
    return null;
  }

  const data = payload.data || payload;
  const user = data.user || data.sender || {};
  const username =
    user.uniqueId ||
    user.nickname ||
    data.uniqueId ||
    data.nickname ||
    data.username ||
    data.userName ||
    'viewer';
  const comment = data.comment || data.message || data.text || '';

  if (!normalizeText(comment)) {
    return null;
  }

  return createChatMessage({
    platform: 'tiktok',
    username,
    comment,
    timestamp: Date.now(),
    meta: {
      rawEvent: payload,
      avatar: user.profilePictureUrl || user.avatarThumb || data.profilePictureUrl,
    },
  });
}

export function describeTikToolClose(code, reason) {
  const knownReasons = {
    1000: 'Connexion TikTool fermée normalement.',
    1006: 'Connexion TikTool interrompue.',
    4005: 'Live TikTok introuvable ou terminé.',
    4006: 'Aucun message TikTok reçu pendant la fenêtre de surveillance.',
    4400: 'Requête TikTool invalide.',
    4401: 'Identifiants TikTool invalides.',
    4403: 'Accès TikTool refusé.',
    4404: 'Utilisateur TikTok introuvable.',
    4429: 'Limite TikTool atteinte.',
    4500: 'Erreur serveur TikTool.',
  };

  return reason || knownReasons[code] || `Connexion TikTool fermée (${code}).`;
}

export function shouldRetryTikToolClose(code) {
  return ![1000, 4005, 4400, 4401, 4403, 4404, 4429].includes(code);
}
