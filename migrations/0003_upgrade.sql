-- PlantGuard Upgrade Migration (Phases 1-16)
-- Adds: fallback/tool-call observability columns, diagnosis confidence/secondary
-- possibilities/validation columns, AI feedback loop, curated grounded knowledge
-- base, AI evaluation harness run log, and community post tags.
-- All additive/backward-compatible (existing rows get sensible defaults).

-- ============== AI OBSERVABILITY EXTENSIONS (Phase 7, 11) ==============
ALTER TABLE ai_call_logs ADD COLUMN fallback_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_call_logs ADD COLUMN fallback_model TEXT;
ALTER TABLE ai_call_logs ADD COLUMN tool_calls_used INTEGER NOT NULL DEFAULT 0;

-- ============== DIAGNOSIS EXTENSIONS (Phase 4, 6, 8) ==============
ALTER TABLE diagnoses ADD COLUMN confidence_level TEXT;              -- 'high' | 'medium' | 'low'
ALTER TABLE diagnoses ADD COLUMN secondary_possibilities TEXT;       -- JSON array of {disease_name, confidence}
ALTER TABLE diagnoses ADD COLUMN image_quality_warnings TEXT;        -- JSON array of strings
ALTER TABLE diagnoses ADD COLUMN validation_status TEXT NOT NULL DEFAULT 'ok'; -- 'ok' | 'recovered' | 'failed'
ALTER TABLE diagnoses ADD COLUMN prompt_version TEXT;

-- ============== AI FEEDBACK LOOP (Phase 3) ==============
-- Lightweight thumbs up/down on AI outputs. No free-text/private content stored.
CREATE TABLE IF NOT EXISTS ai_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_type TEXT NOT NULL,        -- 'diagnosis' | 'chat'
  target_type TEXT NOT NULL,         -- 'diagnosis' | 'chat_message'
  target_id INTEGER NOT NULL,        -- diagnoses.id or chat_messages.id
  session_id TEXT,
  feedback TEXT NOT NULL,            -- 'helpful' | 'not_helpful'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(target_type, target_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_target ON ai_feedback(target_type, target_id);

-- ============== GROUNDED / CURATED DISEASE KNOWLEDGE (Phase 12) ==============
-- Verified PlantGuard knowledge base -- curated once, reused every time.
-- Distinct from disease_cache (AI-generated, general model knowledge).
CREATE TABLE IF NOT EXISTS knowledge_base (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_name TEXT,
  disease_name TEXT NOT NULL UNIQUE,
  symptoms TEXT,          -- JSON array
  causes TEXT,            -- JSON array
  treatment TEXT,         -- JSON array
  prevention TEXT,        -- JSON array
  source TEXT NOT NULL DEFAULT 'PlantGuard curated agronomy reference',
  verified INTEGER NOT NULL DEFAULT 1,
  last_updated TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============== AI EVALUATION HARNESS (Phase 13) ==============
CREATE TABLE IF NOT EXISTS eval_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  prompt_version TEXT,
  model TEXT,
  total_cases INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  failed INTEGER NOT NULL,
  pass_rate REAL NOT NULL,
  metrics_json TEXT
);

-- ============== COMMUNITY TAGS (Phase 14) ==============
ALTER TABLE posts ADD COLUMN tags TEXT; -- JSON array e.g. ["plant:Tomato","disease:Early Blight"]
