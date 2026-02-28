-- tweet_log: tracks every article posted to Twitter via Late API
-- ensures we never tweet the same article twice regardless of how
-- many times the daily workflow is triggered.

create table if not exists tweet_log (
  id           bigserial primary key,
  post_id      text        not null,
  tweet_text   text,
  late_post_id text,
  tweet_url    text,
  tweeted_at   timestamptz default now()
);

create index if not exists tweet_log_post_id_idx   on tweet_log (post_id);
create index if not exists tweet_log_tweeted_at_idx on tweet_log (tweeted_at desc);
