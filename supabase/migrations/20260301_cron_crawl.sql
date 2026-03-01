-- cron_crawl: schedule crawl-news edge function to fire every minute
-- via pg_cron + pg_net — runs directly inside Supabase, not GitHub Actions.
-- GitHub Actions minimum interval is 5 min (but realistically 30–60 min delayed).
-- This replaces that unreliable schedule with a guaranteed 1-min database cron.

-- 1. Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Remove any previously scheduled jobs with these names (safe no-op if absent)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'crawl-news') then
    perform cron.unschedule('crawl-news');
  end if;
  if exists (select 1 from cron.job where jobname = 'crawl-news-every-minute') then
    perform cron.unschedule('crawl-news-every-minute');
  end if;
  if exists (select 1 from cron.job where jobname = 'crawl-news-every-5min') then
    perform cron.unschedule('crawl-news-every-5min');
  end if;
end $$;

-- 3. Schedule: every 5 minutes, POST to the crawl-news edge function
select cron.schedule(
  'crawl-news-every-5min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://clxwyydoeodozndyfkkv.supabase.co/functions/v1/crawl-news',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseHd5eWRvZW9kb3puZHlma2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjk2OTIsImV4cCI6MjA4NzcwNTY5Mn0.JvjyT0BuH7gYzqpYo_2kFGrSFtDRNy_A2CbCCbs3Z94'
    ),
    body    := '{}'::jsonb
  );
  $$
);
