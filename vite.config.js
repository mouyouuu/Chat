import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { env } from 'node:process';

const repoName = env.GITHUB_REPOSITORY?.split('/')[1];
const base = env.GITHUB_PAGES === 'true' && repoName ? `/${repoName}/` : '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
  },
});
