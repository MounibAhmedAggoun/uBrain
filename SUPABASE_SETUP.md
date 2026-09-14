# Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Enable an authentication provider in Supabase Auth.
6. Install the client when registry access is available:

```bash
npm install @supabase/supabase-js
```

The optional cloud service currently lives in `src/lib/cloud.ts`. Local IndexedDB mode remains the default when environment variables are absent. Do not commit `.env.local` or service-role keys.

## AI generation

Set `VITE_AI_ENDPOINT` to a server-side endpoint that accepts `{ "goal": "..." }` and returns a roadmap-shaped JSON object. Keep AI provider keys on that server; never put them in Vite environment variables exposed to the browser.
