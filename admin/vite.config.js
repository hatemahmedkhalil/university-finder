import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/admin",
  resolve: {
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  server: {
    port: parseInt(process.env.PORT || "5173"),
    proxy: {
      "/auth": "http://localhost:8000",
      "/admin/stats": "http://localhost:8000",
      "/admin/students": "http://localhost:8000",
      "/users": "http://localhost:8000",
      "/universities": "http://localhost:8000",
      "/scholarships": "http://localhost:8000",
      "/learning": "http://localhost:8000",
      "/instructors": "http://localhost:8000",
      "/announcements": "http://localhost:8000",
      "/applications": "http://localhost:8000",
      "/instructor-messages": "http://localhost:8000",
    }
  }
})
