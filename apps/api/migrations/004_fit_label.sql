-- A name per saved fit ("Mijn nieuwe darts"), and when an address was confirmed through its link.
ALTER TABLE fits ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at timestamptz;
-- Existing accounts that signed in through a link, or hold a session, count as confirmed.
UPDATE users u SET verified_at = now()
 WHERE verified_at IS NULL
   AND (EXISTS (SELECT 1 FROM login_tokens l WHERE l.email = u.email AND l.used_at IS NOT NULL)
        OR EXISTS (SELECT 1 FROM sessions s WHERE s.user_id = u.id));
