-- PlantGuard Database Schema
-- D1 (SQLite) migration: core tables for diagnosis history, community forum,
-- AI chatbot conversations, and cached cultivation tips.

-- ============== DIAGNOSES ==============
-- Stores every AI-based plant disease diagnosis performed by a user.
CREATE TABLE IF NOT EXISTS diagnoses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,               -- anonymous browser session id (cookie)
  image_key TEXT,                         -- R2 object key of the uploaded leaf image
  plant_name TEXT,                        -- e.g. "Tomato"
  disease_name TEXT,                      -- e.g. "Early Blight" or "Healthy"
  is_healthy INTEGER NOT NULL DEFAULT 0,  -- 1 = healthy, 0 = disease detected
  confidence REAL,                        -- 0-100 confidence score from AI
  severity TEXT,                          -- Low | Moderate | High | Critical
  symptoms TEXT,                          -- JSON array (stringified)
  treatment TEXT,                         -- JSON array (stringified)
  prevention TEXT,                        -- JSON array (stringified)
  spread TEXT,                            -- JSON array (stringified)
  raw_ai_response TEXT,                   -- full AI JSON response for audit/debug
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_session ON diagnoses(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_created ON diagnoses(created_at);

-- ============== COMMUNITY POSTS ==============
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  author TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_key TEXT,                         -- optional R2 image key
  likes INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);

-- ============== COMMUNITY COMMENTS ==============
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

-- ============== POST LIKES (per-session, so a session can't like twice) ==============
CREATE TABLE IF NOT EXISTS post_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, session_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- ============== AI CHATBOT CONVERSATIONS ==============
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,                     -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id, created_at);

-- ============== CULTIVATION TIPS CACHE ==============
-- AI-generated cultivation guides are cached per plant name to save API calls.
CREATE TABLE IF NOT EXISTS cultivation_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_name TEXT NOT NULL UNIQUE,
  watering TEXT,
  sunlight TEXT,
  temperature TEXT,
  soil TEXT,
  fertilizer TEXT,
  spacing TEXT,
  extra_tips TEXT,                        -- JSON array (stringified)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============== DISEASE INFO CACHE ==============
-- AI-generated disease detail lookups (from the "Disease Library" browse page),
-- cached so repeated lookups of the same disease don't re-call the AI.
CREATE TABLE IF NOT EXISTS disease_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  disease_name TEXT NOT NULL UNIQUE,
  plant_name TEXT,
  symptoms TEXT,                          -- JSON array (stringified)
  treatment TEXT,                         -- JSON array (stringified)
  prevention TEXT,                        -- JSON array (stringified)
  spread TEXT,                            -- JSON array (stringified)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
