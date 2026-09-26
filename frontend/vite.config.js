import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Actualiza el service worker automáticamente
      devOptions: {
        enabled: true // Permite probar la PWA mientras estás en modo desarrollo (npm run dev)
      },
      manifest: {
        name: 'Bóveda de Conocimiento',
        short_name: 'Bóveda',
        description: 'Gestor de conocimiento offline-first estilo Obsidian',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // Esto oculta la barra del navegador para que parezca app nativa
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})