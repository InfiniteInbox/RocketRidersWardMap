import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Project site: https://infiniteinbox.github.io/RocketRidersWardMap/
  // Local dev stays at /. GitHub Actions sets GITHUB_ACTIONS during the Pages build.
  base: process.env.GITHUB_ACTIONS ? '/RocketRidersWardMap/' : '/',
});
