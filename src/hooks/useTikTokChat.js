import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildTikToolWebSocketUrl,
  describeTikToolClose,
  extractTikToolChatMessage,
  parseTikToolPayload,
  shouldRetryTikToolClose,
} from '../utils/api';
import {
  appendLimitedMessage,
  createSystemMessage,
  normalizeText,
  normalizeTikTokUsername,
} from '../utils/formatters';

const MAX_RETRY_DELAY = 30000;

export function useTikTokChat() {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const retryAttemptRef = useRef(0);
  const paramsRef = useRef(null);
  const connectRef = useRef(null);
  const manuallyDisconnectedRef = useRef(false);

  const pushMessage = useCallback((message) => {
    setMessages((current) => appendLimitedMessage(current, message));
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(
    (message, closeCode) => {
      if (!paramsRef.current || manuallyDisconnectedRef.current || !shouldRetryTikToolClose(closeCode)) {
        return;
      }

      const attempt = retryAttemptRef.current + 1;
      retryAttemptRef.current = attempt;
      const delay = Math.min(2000 * 2 ** (attempt - 1), MAX_RETRY_DELAY);
      const seconds = Math.round(delay / 1000);
      const nextError = `${message} Nouvelle tentative TikTok dans ${seconds}s.`;

      setError(nextError);
      pushMessage(createSystemMessage(nextError, 'warning'));
      clearReconnectTimer();

      reconnectTimerRef.current = window.setTimeout(() => {
        if (paramsRef.current && !manuallyDisconnectedRef.current) {
          connectRef.current?.(paramsRef.current, { retry: true });
        }
      }, delay);
    },
    [clearReconnectTimer, pushMessage],
  );

  const disconnect = useCallback(
    ({ silent = false } = {}) => {
      manuallyDisconnectedRef.current = true;
      clearReconnectTimer();
      const socket = socketRef.current;
      socketRef.current = null;

      if (socket && socket.readyState <= WebSocket.OPEN) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close(1000, 'manual-disconnect');
      }

      setIsConnected(false);
      setIsConnecting(false);

      if (!silent) {
        pushMessage(createSystemMessage('TikTok déconnecté.', 'info'));
      }
    },
    [clearReconnectTimer, pushMessage],
  );

  const connect = useCallback(
    ({ tiktokUsername, tiktoolCredential }, { retry = false } = {}) => {
      const username = normalizeTikTokUsername(tiktokUsername);
      const credential = normalizeText(tiktoolCredential || import.meta.env.VITE_TIKTOOL_API_KEY);

      if (!username || !credential) {
        const nextError = 'Renseigne le pseudo TikTok et la clé API ou le JWT TikTool.';
        setError(nextError);
        pushMessage(createSystemMessage(nextError, 'error'));
        return false;
      }

      disconnect({ silent: true });
      manuallyDisconnectedRef.current = false;
      paramsRef.current = { tiktokUsername: username, tiktoolCredential: credential };
      setIsConnecting(true);
      setError('');

      if (!retry) {
        retryAttemptRef.current = 0;
        pushMessage(createSystemMessage(`Connexion TikTok vers @${username}...`, 'info'));
      }

      try {
        const socket = new WebSocket(buildTikToolWebSocketUrl({ username, credential }));
        socketRef.current = socket;

        socket.onopen = () => {
          retryAttemptRef.current = 0;
          setIsConnected(true);
          setIsConnecting(false);
          setError('');
          pushMessage(createSystemMessage(`TikTok connecté sur @${username}.`, 'success'));
        };

        socket.onmessage = (event) => {
          const payload = parseTikToolPayload(event.data);
          const chatMessage = extractTikToolChatMessage(payload);

          if (chatMessage) {
            pushMessage(chatMessage);
          }
        };

        socket.onerror = () => {
          const nextError = 'Erreur WebSocket TikTool.';
          setError(nextError);
          pushMessage(createSystemMessage(nextError, 'warning'));
        };

        socket.onclose = (event) => {
          setIsConnected(false);
          setIsConnecting(false);

          if (manuallyDisconnectedRef.current) {
            return;
          }

          const reason = describeTikToolClose(event.code, event.reason);
          setError(reason);
          pushMessage(createSystemMessage(reason, 'warning'));
          scheduleReconnect(reason, event.code);
        };

        return true;
      } catch (connectionError) {
        const nextError = connectionError?.message || 'Impossible de connecter TikTok.';
        setIsConnected(false);
        setIsConnecting(false);
        setError(nextError);
        pushMessage(createSystemMessage(nextError, 'error'));
        scheduleReconnect(nextError, 4500);
        return false;
      }
    },
    [disconnect, pushMessage, scheduleReconnect],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

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
