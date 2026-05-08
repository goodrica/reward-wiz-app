ALTER TABLE public.reward_accounts
  ADD COLUMN IF NOT EXISTS last_sync_url text,
  ADD COLUMN IF NOT EXISTS last_sync_method text,
  ADD COLUMN IF NOT EXISTS last_sync_detail text,
  ADD COLUMN IF NOT EXISTS last_sync_confidence numeric;