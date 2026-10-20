import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Lê o .env da raiz do projeto para saber em que porta a API está
  const env = loadEnv(mode, '..', '');
  const API = `http://localhost:${env.PORT || 3001}`;

  return {
    plugins: [react()],
    server: {
      host: true, // aceita acesso pelo IP da rede e mostra o endereço "Network" ao rodar
      port: Number(env.CLIENT_PORT) || 5173,
      proxy: {
        '/api': API,
        '/uploads': API,
        '/go': API,
      },
    },
  };
});
