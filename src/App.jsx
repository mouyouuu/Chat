import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTikTokChat } from './hooks/useTikTokChat';
import { useTwitchChat } from './hooks/useTwitchChat';
import { createSystemMessage, filterMessages } from './utils/formatters';

const SETTINGS_KEY = 'unified-stream-chat-settings-v1';

const DEFAULT_SETTINGS = {
  twitchChannel: '',
  twitchUsername: '',
  twitchToken: '',
  tiktokUsername: '',
  tiktoolCredential: import.meta.env.VITE_TIKTOOL_API_KEY || '',
  filters: {
    showTwitch: true,
    showTikTok: true,
    keyword: '',
    sound: false,
    fontSize: 14,
  },
};

function getStatus(connection) {
  if (connection.isConnected) {
    return 'connected';
  }

  if (connection.isConnecting) {
    return 'connecting';
  }

  return 'offline';
}

function useMessageSound(enabled, count) {
  useEffect(() => {
    if (!enabled || count === 0) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 680;
    gain.gain.value = 0.025;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.035);

    oscillator.addEventListener('ended', () => {
      context.close();
    });
  }, [enabled, count]);
}

export default function App() {
  const {
    value: settings,
    saveValue: saveSettings,
    clearValue: clearSettings,
    isHydrated,
    storageError,
  } = useLocalStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
  const twitch = useTwitchChat();
  const tiktok = useTikTokChat();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [appMessages, setAppMessages] = useState(() => [
    createSystemMessage('Dashboard prêt. Ouvre les paramètres pour connecter tes chats.', 'info'),
  ]);

  const pushSystemMessage = useCallback((comment, level = 'info') => {
    setAppMessages((current) => [...current, createSystemMessage(comment, level)]);
  }, []);

  const allMessages = useMemo(
    () =>
      [...appMessages, ...twitch.messages, ...tiktok.messages].sort((left, right) => {
        return left.timestamp - right.timestamp;
      }),
    [appMessages, tiktok.messages, twitch.messages],
  );

  const visibleMessages = useMemo(() => filterMessages(allMessages, settings.filters), [allMessages, settings.filters]);

  const stats = useMemo(
    () => ({
      total: visibleMessages.filter((message) => message.platform !== 'system').length,
      twitch: visibleMessages.filter((message) => message.platform === 'twitch').length,
      tiktok: visibleMessages.filter((message) => message.platform === 'tiktok').length,
    }),
    [visibleMessages],
  );

  useMessageSound(settings.filters.sound, allMessages.length);

  const save = useCallback(
    async (nextSettings) => {
      await saveSettings(nextSettings);
      pushSystemMessage('Paramètres sauvegardés dans le navigateur.', 'success');
    },
    [pushSystemMessage, saveSettings],
  );

  const connectTwitch = useCallback(
    async (draft = settings) => {
      return twitch.connect(draft);
    },
    [settings, twitch],
  );

  const connectTikTok = useCallback(
    (draft = settings) => {
      return tiktok.connect(draft);
    },
    [settings, tiktok],
  );

  const connectAll = useCallback(
    async (draft = settings) => {
      await Promise.all([connectTwitch(draft), Promise.resolve(connectTikTok(draft))]);
    },
    [connectTikTok, connectTwitch, settings],
  );

  const disconnectAll = useCallback(() => {
    twitch.disconnect();
    tiktok.disconnect();
  }, [tiktok, twitch]);

  const clearData = useCallback(async () => {
    const confirmed = window.confirm('Oublier les identifiants et déconnecter les chats ?');

    if (!confirmed) {
      return;
    }

    disconnectAll();
    await clearSettings();
    pushSystemMessage('Identifiants locaux oubliés.', 'warning');
  }, [clearSettings, disconnectAll, pushSystemMessage]);

  const clearMessages = useCallback(() => {
    twitch.clearMessages();
    tiktok.clearMessages();
    setAppMessages([createSystemMessage('Flux vidé.', 'info')]);
  }, [tiktok, twitch]);

  const twitchStatus = getStatus(twitch);
  const tiktokStatus = getStatus(tiktok);
  const isAnyConnected = twitch.isConnected || tiktok.isConnected;
  const isAnyConnecting = twitch.isConnecting || tiktok.isConnecting || !isHydrated;

  return (
    <div className="app-shell min-h-screen bg-slate-950 text-slate-100">
      <div className="flex h-screen min-h-[620px] flex-col overflow-hidden">
        <Header
          twitchStatus={twitchStatus}
          tiktokStatus={tiktokStatus}
          isAnyConnected={isAnyConnected}
          isAnyConnecting={isAnyConnecting}
          onConnectAll={() => connectAll()}
          onDisconnectAll={disconnectAll}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <ChatWindow messages={visibleMessages} fontSize={settings.filters.fontSize} stats={stats} onClearMessages={clearMessages} />
      </div>

      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        storageError={storageError}
        twitch={twitch}
        tiktok={tiktok}
        onClose={() => setSettingsOpen(false)}
        onSave={save}
        onClearData={clearData}
        onConnectTwitch={connectTwitch}
        onDisconnectTwitch={twitch.disconnect}
        onConnectTikTok={connectTikTok}
        onDisconnectTikTok={tiktok.disconnect}
        onConnectAll={connectAll}
        onDisconnectAll={disconnectAll}
      />
    </div>
  );
}
