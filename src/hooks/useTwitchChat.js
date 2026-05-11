import { useCallback, useEffect, useRef, useState } from 'react';
import {
  appendLimitedMessage,
  createChatMessage,
  createSystemMessage,
  normalizeText,
  normalizeTwitchChannel,
  normalizeTwitchToken,
} from '../utils/formatters';

export function useTwitchChat() {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const clientRef = useRef(null);
  const manuallyDisconnectedRef = useRef(false);

  const pushMessage = useCallback((message) => {
    setMessages((current) => appendLimitedMessage(current, message));
  }, []);

  const disconnect = useCallback(
    async ({ silent = false } = {}) => {
      manuallyDisconnectedRef.current = true;
      const client = clientRef.current;
      clientRef.current = null;

      if (client) {
        client.removeAllListeners?.();

        try {
          await client.disconnect();
        } catch {
          // tmi.js throws when disconnect is called while the socket is already closed.
        }
      }

      setIsConnected(false);
      setIsConnecting(false);

      if (!silent) {
        pushMessage(createSystemMessage('Twitch déconnecté.', 'info'));
      }
    },
    [pushMessage],
  );

  const connect = useCallback(
    async ({ twitchChannel, twitchUsername, twitchToken }) => {
      const channel = normalizeTwitchChannel(twitchChannel);
      const username = normalizeText(twitchUsername);
      const token = normalizeTwitchToken(twitchToken);

      if (!channel || !username || !token) {
        const nextError = 'Renseigne le channel, le pseudo bot et le token OAuth Twitch.';
        setError(nextError);
        pushMessage(createSystemMessage(nextError, 'error'));
        return false;
      }

      await disconnect({ silent: true });
      manuallyDisconnectedRef.current = false;
      setIsConnecting(true);
      setError('');
      pushMessage(createSystemMessage(`Connexion Twitch vers #${channel}...`, 'info'));

      try {
        const tmiModule = await import('tmi.js');
        const tmi = tmiModule.default ?? tmiModule;
        const Client = tmi.Client ?? tmi.client;
        const client = new Client({
          options: { debug: false, skipUpdatingEmotesets: true },
          connection: { reconnect: true, secure: true },
          identity: { username, password: token },
          channels: [channel],
        });

        clientRef.current = client;

        client.on('connected', () => {
          setIsConnected(true);
          setIsConnecting(false);
          setError('');
          pushMessage(createSystemMessage(`Twitch connecté sur #${channel}.`, 'success'));
        });

        client.on('message', (room, tags, message, self) => {
          if (self) {
            return;
          }

          pushMessage(
            createChatMessage({
              platform: 'twitch',
              username: tags['display-name'] || tags.username,
              comment: message,
              timestamp: Date.now(),
              meta: {
                id: tags.id,
                badges: tags.badges,
                color: tags.color,
                room,
              },
            }),
          );
        });

        client.on('notice', (room, msgId, message) => {
          const notice = message || `Notice Twitch: ${msgId}`;
          setError(notice);
          pushMessage(createSystemMessage(notice, 'warning'));
        });

        client.on('disconnected', (reason) => {
          setIsConnected(false);
          setIsConnecting(false);

          if (!manuallyDisconnectedRef.current) {
            const nextError = `Twitch déconnecté: ${reason || 'connexion perdue'}. Reconnexion automatique tmi.js active.`;
            setError(nextError);
            pushMessage(createSystemMessage(nextError, 'warning'));
          }
        });

        await client.connect();
        return true;
      } catch (connectionError) {
        const nextError = connectionError?.message || 'Impossible de connecter Twitch.';
        setIsConnected(false);
        setIsConnecting(false);
        setError(nextError);
        pushMessage(createSystemMessage(nextError, 'error'));
        return false;
      }
    },
    [disconnect, pushMessage],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    return () => {
      disconnect({ silent: true });
    };
  }, [disconnect]);

  return {
    messages,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    clearMessages,
  };
}
