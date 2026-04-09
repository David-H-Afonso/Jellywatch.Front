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

The dev server proxies API requests. Configure the API URL in `src/environments/`.

## Production Build

```bash
npm run build
# Output in dist/
```

The built files are served by the API's static file middleware in production.

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

Set the `API_BASE_URL` environment variable to point to the Jellywatch API.

## Environment Variables

| Variable       | Description     | Default                 |
| -------------- | --------------- | ----------------------- |
| `API_BASE_URL` | Backend API URL | `http://localhost:5011` |

## License

MIT
