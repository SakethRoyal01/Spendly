# Spendly deployment (Netlify + Supabase)

Spendly is a Vite single-page application. Netlify hosts the built frontend; Supabase provides authentication, PostgreSQL, row-level security, and per-user finance snapshots. The current architecture does not require a separate Node/Express server.

## 1. Build locally

```bash
npm install
npm run build
```

The production output is in `dist/`. The `public/_redirects` file is copied into the build and keeps React Router routes working on direct refresh.

## 2. Set the Supabase environment variables before building

The app reads these exact names in `src/core/supabase/client.ts`:

- `VITE_SUPABASE_URL`: Supabase Project URL (Project Settings → API).
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key (Project Settings → API Keys).

For a drag-and-drop deployment, create/update your local `.env` file before running the build:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Do not commit `.env`. Never put a Supabase secret or `service_role` key in the frontend. Vite embeds `VITE_*` values into the build output, so changing a hosting environment variable will not update an already-built `dist`.

## 3. Deploy the build

Deploy the generated `dist` folder using Netlify Drop. Upload the build output, not the source project.

## 4. Configure Supabase Auth after the first deployment

After Netlify gives you the public HTTPS URL:

1. Open Supabase → Authentication → URL Configuration.
2. Set **Site URL** to the exact deployed URL.
3. Add the URL to **Redirect URLs**, for example `https://YOUR-SITE.netlify.app/**`.
4. Save.

Add any future custom domain to Redirect URLs as well.

## 5. Production verification

- Sign up and sign in.
- Add an expense and wait for the save to complete.
- Refresh and sign in again.
- Sign in to the same account from another device.
- Confirm a second account cannot see the first account's data.
- Check browser DevTools Console and Network for failed Supabase requests.

## Important limitations

- Drag-and-drop deployment is a static snapshot. Rebuild and upload `dist` again after code changes.
- The current persistence design stores each user's full backup as one JSONB snapshot. Sequential access across devices is supported; simultaneous edits on multiple devices may overwrite one another.
- Existing local browser data is not automatically migrated to the cloud. Use Spendly's backup/import flow when ready to restore your backup.
