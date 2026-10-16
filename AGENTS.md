<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Pamasahe Cabanatuan

A fare calculator for Cabanatuan City commuters: jeep fares, tricycle fares, a TODA directory and a page for reporting overcharging. People will quote these numbers in real disputes with drivers, so a wrong fare is the worst bug this project can ship.

Before you touch fares, routes, TODAs or page structure, read the product brief and data status in `data/pamasahe-handoff/CLAUDE.md`.

## Simplicity

Simplicity governs every other rule here. Write the plainest code that solves today's problem:

- Build what the current task asks for. Add an abstraction when a second real caller needs it, not before.
- Three similar lines are fine. Extract a helper once a pattern repeats and has a clear name.
- Prefer deleting code to adding it. When two approaches work, pick the one with fewer moving parts.
- Use what is already installed (shadcn/ui in `src/components/ui`, Tailwind, lucide icons) before adding a dependency.

## Next.js

- **Server Components by default.** Add `'use client'` only to the smallest leaf that needs state, effects or browser APIs, such as a calculator form or the language toggle. Pass server-rendered content into it as `children`. See `01-app/01-getting-started/05-server-and-client-components.md`.
- **Static by default.** All fare data is JSON in `data/`, so every page should prerender at build time. Read the JSON in Server Components and compute anything you can on the server. Before using cookies, headers, `searchParams` or an uncached fetch, read `01-app/02-guides/keeping-pages-static.md`.
- **Client-side rendering only for interaction.** Run fare math in the browser when the user changes an input. Data the server can render is never fetched from the client.
- **SEO on every route.** Export `metadata` (or `generateMetadata` for dynamic routes like `/toda/[id]`) with a unique title and description. Keep `app/sitemap.ts`, `app/robots.ts` and an Open Graph image current. Set `lang` on `<html>` to match the active language. See `01-app/01-getting-started/14-metadata-and-og-images.md`.
- **Semantic HTML.** One `<h1>` per page, landmark elements (`header`, `nav`, `main`, `footer`), `next/link` for navigation and `<button>` for actions. Every input has a `<label>`.
- Use `next/image` for images and `next/font` for fonts.

## React

- **Components are pure.** The same props give the same output. Compute derived values during render, not with state plus `useEffect`. Use `useEffect` only to sync with something outside React.
- **State lives in the lowest common owner.** Lift it only when siblings share it. Keep it minimal: store the inputs (route, km, passengers), never the computed fare.
- **Small components with one job.** Split a component when it handles two concerns, not when it passes a line count.
- **Lists use stable keys** from the data (`route.id`), never the array index.
- Use the React 19 APIs this project ships with. Skip `useMemo`/`useCallback` unless a measured slowdown calls for them.

## TypeScript

- **`const` for every binding.** Build values with `map`, `filter` and `reduce`, or with a returned expression, instead of a `let` that gets reassigned. Use `let` only when reassignment is clearly simpler, and never use `var`.
- **`strict` stays on.** Type unknown input as `unknown` and narrow it. Treat a type assertion (`as`) as a last resort and say why in a comment.
- **Type the data files.** Each JSON file in `data/` gets one exported type in `src/lib/`. Validate the JSON against it at the build boundary so a bad pull request fails the build instead of shipping a wrong fare.
- Use `satisfies` and `as const` for config objects, and string-literal unions instead of `enum`.
- Give exported functions explicit return types. Use named exports.

## Fare logic

- All fare math lives in `src/lib/fare.ts`, as pure functions with no React or Next.js imports.
- **Money in centavos.** Do all arithmetic on integer centavos and format to pesos only for display. Floating-point pesos produce wrong totals.
- Fare amounts, distances and discount rates come from `data/`. Components never contain fare numbers.
- Every rule has a unit test: minimum fare, per-km charges, each discount, rounding, and solo vs. shared tricycle rates. Test against worked examples from the official matrix whenever one exists.

## Clean code

- **Domain names.** Name things the way the fare data does (`baseFare`, `baseKm`, `perSucceedingKm`, `discountRate`) so code and JSON read the same.
- **Functions do one thing** and fit on a screen. Return early instead of nesting conditionals.
- **Comments explain why.** The code already says what: a comment records the reason, the source (ordinance number, LTFRB memo) or the gotcha.
- Files are kebab-case (`fare-breakdown.tsx`). Import from the `@/` alias.
- Before you finish, run `npm run lint` and the build, and fix what they report.

## Git: Conventional Commits

Format: `<type>(<scope>): <summary>`

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Scopes:** the area changed: `jeep`, `tricycle`, `toda`, `report`, `fare`, `data`, `ui`, `seo`, `i18n`.
- **Summary:** imperative mood, lowercase, no trailing period, 72 characters or fewer.
- **Body:** explains why the change was made and cites the source for any fare data change.
- **Breaking changes:** add `!` after the scope and a `BREAKING CHANGE:` footer.
- Each commit holds one logical change. Fare data changes go in their own commit, separate from code.
- Work on a branch named `<type>/<short-description>` (`feat/jeep-calculator`) and merge into `main` through a pull request.

Examples:

```
feat(jeep): add distance-based fare calculator
fix(data): set modern jeep per-km rate to ₱2.40 per LTFRB advisory
test(fare): cover shared tricycle rate for three passengers
```
