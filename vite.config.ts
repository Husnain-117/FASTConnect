import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';
import type { ConfigEnv, UserConfig } from 'vite';

export default ({ mode }: ConfigEnv): UserConfig => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = parseInt(env.VITE_PORT || '5173');
  
  return defineConfig({
    plugins: [
      react(),
      mkcert() // enables HTTPS with auto-generated certificates
    ],
    server: {
      host: '0.0.0.0',
      port,
      strictPort: true,
      https: {
        // mkcert will automatically generate and use a certificate
      },
      hmr: {
        host: 'localhost',
        port: port,
        protocol: 'wss' // Use WebSocket Secure for HMR
      }
    }
  });
};