import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: parseInt(process.env.PORT || "5173"),
    proxy: {
      "/auth": "http://localhost:8000",
      "/profiles": "http://localhost:8000",
      "/universities": "http://localhost:8000",
      "/recommendations": "http://localhost:8000",
      "/favourites": "http://localhost:8000",
      "/scholarships": "http://localhost:8000",
      "/applications": "http://localhost:8000",
      "/instructors": "http://localhost:8000",
      "/instructor-messages": "http://localhost:8000",
      "/instructor-posts": "http://localhost:8000",
      "/learning": "http://localhost:8000",
      "/announcements": "http://localhost:8000",
      "/notifications": "http://localhost:8000",
      "/ai-chat": "http://localhost:8000",
      "/ai-recommendations": "http://localhost:8000",
      "/users": "http://localhost:8000",
      "/user-languages": "http://localhost:8000",
      "/subscription-plans": "http://localhost:8000",
      "/support": "http://localhost:8000",
      "/admin": "http://localhost:8000",
      "/uploads": "http://localhost:8000",
      "/ielts": "http://localhost:8000",
      "/health": "http://localhost:8000",
      "/pipeline": "http://localhost:8000",
      "/student-documents": "http://localhost:8000",
      "/motivation-letters": "http://localhost:8000",
      "/application-guides": "http://localhost:8000",
      "/course-chat": "http://localhost:8000",
      "/email-integration": "http://localhost:8000",
      "/calendar": "http://localhost:8000",
    }
  }
})
