# Unified Stream Chat

Dashboard React pour agréger Twitch Chat et TikTok Live dans un flux chronologique unique, pensé pour une scène d’accueil, une overlay navigateur ou un second écran de stream.

## Fonctionnalités

- Chat unifié Twitch + TikTok avec badges plateforme.
- Format message : `[PLATEFORME] @Pseudo - Message - HH:MM`.
- Connexion Twitch via `tmi.js` et token OAuth.
- Connexion TikTok via WebSocket TikTool `wss://api.tik.tools`.
- Auto-scroll, responsive desktop/mobile, thème sombre gaming.
- Panneau paramètres avec connect/disconnect, sauvegarde locale et oubli des identifiants.
- Stockage local chiffré côté navigateur avec Web Crypto quand disponible.
- Reconnexion Twitch gérée par `tmi.js`; reconnexion TikTool avec backoff.
- Filtres Twitch/TikTok, filtre mot-clé, taille de police et son optionnel.

## Installation locale

```bash
npm install
npm run dev
```

Ouvre ensuite `http://localhost:5173`.

## Configuration

Copie le modèle d’environnement :

```bash
cp .env.example .env
```

Variables utiles :

```env
VITE_TIKTOOL_API_KEY=example_key_here
VITE_TWITCH_CLIENT_ID=your_twitch_client_id
VITE_TWITCH_REDIRECT_URI=http://localhost:5173/callback
VITE_STORAGE_SECRET=replace_with_a_local_secret_for_settings_encryption
```

Tu peux aussi saisir les identifiants directement dans le panneau de paramètres.

### Twitch

1. Crée ou utilise un compte Twitch bot.
2. Génère un token OAuth avec le scope chat via `https://twitchapps.com/tmi/` ou ton flow OAuth Twitch.
3. Renseigne :
   - `Channel Twitch`
   - `Pseudo bot Twitch`
   - `OAuth token`

`tmi.js` accepte les tokens au format `oauth:xxxx`. L’app ajoute automatiquement le préfixe si tu le colles sans.

### TikTok / TikTool

1. Crée une clé API sur TikTool.
2. Renseigne le pseudo TikTok Live sans `@`.
3. Renseigne une clé API ou un JWT TikTool.

Pour une vraie prod publique, préfère un JWT généré serveur-side ou un petit proxy backend, car une clé API intégrée dans une app frontend reste visible dans le navigateur.

## Scripts

```bash
npm run dev      # serveur local Vite
npm run build    # build production
npm run preview  # prévisualisation du build
npm run lint     # vérification ESLint
```

## Structure

```txt
src/
  components/
    ChatWindow.jsx
    Header.jsx
    MessageItem.jsx
    SettingsPanel.jsx
  hooks/
    useLocalStorage.js
    useTikTokChat.js
    useTwitchChat.js
  utils/
    api.js
    formatters.js
    storage.js
  App.jsx
  App.css
  main.jsx
```

## Déploiement

### Vercel / Netlify

- Build command : `npm run build`
- Output directory : `dist`
- Ajoute les variables `.env` dans le dashboard du provider.

### GitHub Pages

Un workflow GitHub Actions est déjà inclus dans `.github/workflows/deploy.yml`. Après chaque push sur `main`, il build l’app et publie le dossier `dist` dans la branche `gh-pages`.

Pour activer l’URL publique la première fois :

1. Va dans `Settings > Pages`.
2. Choisis `Build and deployment > Source: Deploy from a branch`.
3. Sélectionne `Branch: gh-pages` et le dossier `/root`.
4. Le site sera publié sur `https://TON_USER.github.io/NOM_DU_REPO/`.

## Troubleshooting

- Twitch ne connecte pas : vérifie que le pseudo bot correspond au token OAuth et que le channel est bien le nom de la chaîne.
- TikTool ferme la connexion : vérifie que le compte TikTok est actuellement en live, que la clé est valide et que les limites du plan ne sont pas atteintes.
- Aucun son : les navigateurs bloquent parfois l’audio avant une interaction utilisateur.
- Paramètres illisibles après changement de `VITE_STORAGE_SECRET` : clique sur `Oublier` puis sauvegarde à nouveau.

## Sources techniques

- [tmi.js documentation](https://tmijs.com/)
- [TikTool WebSocket API](https://tik.tools/websocket)
- [TikTool docs](https://tik.tools/docs)

## Roadmap

- OAuth Twitch complet avec callback.
- Proxy backend optionnel pour ne jamais exposer la clé TikTool.
- Export des messages en JSON/CSV.
- Modération live avec blacklist et suppression locale.
- Layout overlay transparent pour OBS Browser Source.
