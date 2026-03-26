-- =============================================
-- FairwayGives — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  handicap REAL,
  home_course TEXT DEFAULT '',
  role TEXT DEFAULT 'subscriber' CHECK (role IN ('subscriber','admin')),
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active','inactive','past_due','cancelled')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free','birdie','eagle','albatross')),
  selected_charity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== CHARITIES ====================
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  website TEXT DEFAULT '',
  total_raised NUMERIC(12,2) DEFAULT 0,
  supporter_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK constraint after both tables exist
ALTER TABLE users
  ADD CONSTRAINT fk_users_charity
  FOREIGN KEY (selected_charity_id) REFERENCES charities(id)
  ON DELETE SET NULL;

-- ==================== SCORES ====================
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stableford_points INT NOT NULL CHECK (stableford_points >= 0 AND stableford_points <= 45),
  course_name TEXT DEFAULT '',
  played_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scores_user ON scores(user_id);
CREATE INDEX idx_scores_played ON scores(played_at DESC);

-- ==================== SUBSCRIPTIONS ====================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('birdie','eagle','albatross')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled','trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== DRAWS ====================
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_type TEXT NOT NULL CHECK (draw_type IN ('weekly','monthly','major')),
  draw_date TIMESTAMPTZ NOT NULL,
  prize_description TEXT DEFAULT '',
  prize_value NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled')),
  winner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  winning_score_id UUID REFERENCES scores(id) ON DELETE SET NULL,
  charity_donation NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== DRAW ENTRIES ====================
CREATE TABLE IF NOT EXISTS draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(draw_id, user_id)
);

-- ==================== WINNER VERIFICATIONS ====================
CREATE TABLE IF NOT EXISTS winner_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scorecard_url TEXT DEFAULT '',
  selfie_url TEXT DEFAULT '',
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  admin_notes TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- ==================== IMPACT LOG ====================
CREATE TABLE IF NOT EXISTS impact_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  source TEXT DEFAULT 'subscription' CHECK (source IN ('subscription','draw','bonus')),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_impact_user ON impact_log(user_id);
CREATE INDEX idx_impact_charity ON impact_log(charity_id);

-- ==================== LEADERBOARD RPC ====================
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INT DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  avg_score NUMERIC,
  total_rounds INT,
  best_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.user_id,
    u.full_name,
    u.avatar_url,
    ROUND(AVG(s.stableford_points)::numeric, 1) AS avg_score,
    COUNT(s.id)::INT AS total_rounds,
    MAX(s.stableford_points) AS best_score
  FROM scores s
  JOIN users u ON u.id = s.user_id
  GROUP BY s.user_id, u.full_name, u.avatar_url
  ORDER BY avg_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ==================== AUTO-UPDATE TIMESTAMP ====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
