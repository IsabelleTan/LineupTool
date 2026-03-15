# Lineup Tool — Frontend

React/TypeScript SPA built with Vite.

## Stack

- React 19, TypeScript
- React Router v7
- shadcn/ui (Tailwind CSS v4 + Radix UI)
- Vitest + React Testing Library

## Commands

```bash
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Type check + build
npm run lint       # Run ESLint
npm run test       # Run tests (once)
npm run test:watch # Run tests in watch mode
npm run preview    # Preview production build
```

## Adding shadcn components

```bash
npx shadcn@latest add <component-name>
```

Generated files land in `src/components/ui/` — do not edit them manually.
