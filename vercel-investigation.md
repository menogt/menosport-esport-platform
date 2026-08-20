# Vercel settings investigation

The Vercel project is `meno-arena` under `menogts-projects`. The Build and Deployment page shows a warning that the current production deployment differs from current Project Settings.

Production Overrides currently show:

- Build Command: `pnpm build`
- Output Directory: `dist/public`
- Install Command: `pnpm install --frozen-lockfile`

These values match the repository `vercel.json` configuration.

Project Settings currently show explicit overrides that differ:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Development Command: `vite` (override disabled)
- Root Directory: `./`

The repository itself uses `vercel.json` with `pnpm install --frozen-lockfile`, `pnpm build`, and `dist/public`; package.json declares `pnpm@9.15.9`. The screenshot therefore reflects a real settings mismatch, but the production deployment override currently matches the repository and is the configuration actually used by the shown production deployment. The project settings are risky because a future redeploy or manual “use project settings” action could switch to npm and the wrong output directory, recreating the earlier frozen-lockfile/build problems or serving the wrong artifact.
