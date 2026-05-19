# Jellywatch Front

React SPA for Jellywatch — a personal watch tracking dashboard for Jellyfin.

## Features

- **Dashboard** — Upcoming episodes with drag-to-scroll, recent activity
- **Series & Movies** — Browse, sort (title, release, rating, grade), filter by state
- **Watch Tracking** — Toggle episode/movie states, bulk season actions, custom watched dates
- **User Ratings** — 5-star rating system for series, seasons, episodes, and movies
- **Statistics** — Year-in-review Wrapped with charts, genre breakdown, calendar view
- **Person Pages** — Cast credits sorted by rating, linked to library items
- **Media Search** — Add new series/movies from TMDB
- **Import** — CSV/Trakt data import wizard
- **Multilingual** — English and Spanish (i18next)
- **Responsive** — Mobile-friendly layout
- **Dark Theme** — Consistent dark UI with CSS custom properties

## Tech Stack

- **React 19** + TypeScript 5.8
- **Vite 7** — Build tool
- **Redux Toolkit** — State management with redux-persist
- **React Router 7** — Client-side routing
- **i18next** — Internationalization (EN/ES)
- **SCSS** — Modular styling with BEM naming
- **SVG Icons** — via vite-plugin-svgr

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- Running Jellywatch API instance

## Installation

```bash
cd Jellywatch.Front
npm install
```

## Development

```bash
npm run dev
# Available at http://localhost:5173
```

The dev and preview servers proxy `/api/*` requests to the Jellywatch API.
By default the proxy target is `http://localhost:5011`; override it with
`VITE_PROXY_API_URL` when your API is running elsewhere.

## Production Build

```bash
npm run build
# Output in dist/
```

The production Docker image serves the SPA with nginx and proxies `/api/*`
requests to the `jellywatch-api:8080` container.

## Project Structure

```
Jellywatch.Front/
├── public/              # Static assets
└── src/
    ├── assets/          # SVG icons, images
    ├── components/
    │   ├── Dashboard/   # Main dashboard
    │   ├── Series/      # Series list & detail
    │   ├── Movies/      # Movie list & detail
    │   ├── Wrapped/     # Year-in-review
    │   ├── Person/      # Actor/crew pages
    │   ├── Admin/       # Admin panel
    │   ├── Auth/        # Login/register
    │   └── elements/    # Shared components (MediaPoster, StarRating, CastSection...)
    ├── environments/    # API base URL config
    ├── hooks/           # Custom React hooks
    ├── i18n/
    │   └── locales/     # en.json, es.json
    ├── layouts/         # App layout wrapper
    ├── models/
    │   └── api/         # TypeScript interfaces matching API DTOs
    ├── navigation/      # React Router config
    ├── services/        # API service layer
    ├── store/           # Redux slices & selectors
    └── utils/           # Utility functions
```

## Available Scripts

| Script            | Description                   |
| ----------------- | ----------------------------- |
| `npm run dev`     | Start dev server              |
| `npm run build`   | Type-check + production build |
| `npm run lint`    | ESLint                        |
| `npm run preview` | Preview production build      |

## License

Proprietary — All rights reserved.

```bash
docker build -t jellywatch-web .
docker run -p 80:80 jellywatch-web
```

Keep the frontend and API containers on the same Docker network, or set
`API_BASE_URL` to a full reachable API origin without a trailing `/api`.

## Environment Variables

| Variable             | Description                                                        | Default                 |
| -------------------- | ------------------------------------------------------------------ | ----------------------- |
| `API_BASE_URL`       | Runtime backend API origin. Leave empty to use nginx `/api/` proxy. | empty                   |
| `VITE_PROXY_API_URL` | Local Vite dev/preview proxy target.                               | `http://localhost:5011` |

## License

MIT
