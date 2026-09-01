-- AI Observability: log every AI (LLM) call made by the app so latency,
-- reliability, token usage, and estimated cost can be tracked and later
-- used for AI evaluation, feedback correlation, and cost analytics.
--
-- Deliberately does NOT store any user-provided content (no image data,
-- no chat message text, no diagnosis text) -- only call metadata.

CREATE TABLE IF NOT EXISTS ai_call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_type TEXT NOT NULL,        -- 'diagnosis' | 'chat' | 'library_cultivation' | 'library_disease'
  model TEXT NOT NULL,               -- e.g. 'gpt-5'
  prompt_version TEXT,               -- version tag of the system prompt used
  session_id TEXT,                   -- anonymous session id, NULL for calls not tied to one user
  success INTEGER NOT NULL,          -- 1 = call succeeded, 0 = call failed
  error_type TEXT,                   -- e.g. 'network_error', 'http_502', 'empty_content'
  error_message TEXT,                -- truncated (<=300 chars), safe -- never raw user content
  latency_ms INTEGER,                 -- total time for the API call
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  estimated_cost_usd REAL,           -- best-effort estimate, not a billing-accurate figure
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_type ON ai_call_logs(request_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_session ON ai_call_logs(session_id);
