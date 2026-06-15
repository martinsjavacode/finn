-- Activity logs table for admin panel audit tracking
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (action_type IN (
    'migration', 'member_added', 'member_removed',
    'role_changed', 'account_created', 'account_deleted'
  )),
  actor_email text NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  account_name text,  -- denormalized for when account is deleted
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_account_id ON activity_logs(account_id);

-- RLS: only superadmins can read/write
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin full access" ON activity_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true)
  );
