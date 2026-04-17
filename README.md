# Ella App

App móvil de coaching integral personal — entrenamiento, nutrición, bienestar y ciclo.

**Stack:** React 19 · Vite 8 · Tailwind CSS 3.4 · Claude AI · WHOOP API

---

## Instalación local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env y añade tus keys (Claude API, WHOOP)

# 3. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:5173
```

## Deploy en Vercel

1. Sube el repositorio a GitHub
2. En Vercel → New Project → selecciona el repo
3. En **Settings → Environment Variables** añade:
   - `VITE_CLAUDE_API_KEY` → tu key de Anthropic
   - `VITE_WHOOP_CLIENT_ID` → tu client ID de WHOOP
   - `VITE_WHOOP_REDIRECT_URI` → `https://tu-dominio.vercel.app`
   - `WHOOP_CLIENT_SECRET` → tu client secret (solo servidor, sin prefijo VITE_)
4. Click **Deploy**

## Variables de entorno

Ver `.env.example` para la lista completa con instrucciones.

## Módulos

| Módulo | Descripción |
|--------|-------------|
| Dashboard | Recomendación diaria personalizada con Claude AI |
| Running | Plan de entrenamiento para 10K |
| Fuerza | Rutinas de gimnasio |
| Carreras | Historial de carreras y tiempos |
| WHOOP | Recovery, HRV, strain y sueño |
| InBody | Composición corporal |
| Nutrición | Macros, hidratación y registro de comidas |
| Ciclo | Seguimiento menstrual y fases |
| Hitos | Metas y progreso |
| Hábitos | Rutinas diarias |
| Diario | Notas personales |
| Índice Ella | Score de bienestar general |
| Coach IA | Chat con Claude con memoria persistente |

## Tecnologías

- **Frontend:** React 19 + Vite 8
- **Estilos:** Tailwind CSS 3.4
- **Persistencia:** localStorage
- **IA:** Anthropic Claude API (claude-sonnet-4-6)
- **Gráficos:** Recharts
- **PDF:** pdfjs-dist
- **OAuth:** WHOOP OAuth 2.0 con PKCE
