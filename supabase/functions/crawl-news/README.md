# crawl-news Edge Function

Crawls all active RSS feed sources, rewrites articles with AI, and inserts them into the Supabase `posts` table.

## Deploy

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set OPENAI_API_KEY=your_key

# Deploy the function
supabase functions deploy crawl-news
```

## Schedule with pg_cron

Run in Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'yup-crawl-every-30-min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/crawl-news',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Test manually

```bash
supabase functions serve crawl-news

curl -X POST http://localhost:54321/functions/v1/crawl-news
```
