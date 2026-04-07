# Jellywatch Frontend

React + TypeScript web application for tracking your Jellyfin watch activity with metadata enrichment from TMDB.

## Tech Stack

- **React 19** with TypeScript
- **Redux Toolkit** for state management
- **React Router** for navigation
- **i18next** for internationalization (EN/ES)
- **Vite** for bundling
- **SCSS** for styling

## Development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies API calls to `http://localhost:5011`.

## Build

```bash
npm run build
```

Output is in the `dist/` directory.

## Docker

```bash
docker build -t jellywatch-web .
docker run -p 80:80 jellywatch-web
```

Set the `API_BASE_URL` environment variable to point to the Jellywatch API.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Backend API URL | `http://localhost:5011` |

## License

MIT
