import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({
    babel: {
      overrides: [{
        // App.tsx supera el umbral automático de Babel; mantener su salida compacta sin el aviso.
        test: /[/\\]src[/\\]App\.tsx$/,
        compact: true
      }]
    }
  })],
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
});
