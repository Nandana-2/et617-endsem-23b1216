# Adaptive English Tenses Tutor

A Class 9 Olympiad practice app for distinguishing the simple past from the present perfect.

## Template

This project uses **Vite + React** (plain JavaScript, no TypeScript, router, UI library, or Redux).

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Deployment

Import the repository into Vercel. Vercel should detect Vite automatically; use `npm run build` as the build command and `dist` as the output directory.

## Integration notes

The app shell expects the assigned engine, store, AI, and presentation-component modules to be added at the import paths in `src/App.jsx`. API routes are expected at `api/generate.js` and `api/evaluate.js`.
