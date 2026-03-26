-- =============================================
-- Admin Panel Additive Schema
-- Apply this after backend/schema.sql
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_id TEXT;

ALTER TABLE charities
  ADD COLUMN IF NOT EXISTS mission TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS impact_summary TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS founded TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS media_gallery JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#204e4a',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_type TEXT NOT NULL DEFAULT 'monthly' CHECK (draw_type IN ('weekly','monthly','major')),
  draw_date TIMESTAMPTZ NOT NULL,
  prize_description TEXT DEFAULT '',
  prize_value NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled')),
  winner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  winning_score_id UUID REFERENCES scores(id) ON DELETE SET NULL,
  charity_donation NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE draws
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS selection_mode TEXT DEFAULT 'random' CHECK (selection_mode IN ('random','algorithmic')),
  ADD COLUMN IF NOT EXISTS winner_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS entry_window_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS entry_window_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS simulation_runs INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS simulation_snapshot JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS result_snapshot JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS configured_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score_id UUID REFERENCES scores(id) ON DELETE SET NULL,
  selected_charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  rank INT DEFAULT 1,
  payout_amount NUMERIC(10,2) DEFAULT 0,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending','paid')),
  proof_status TEXT DEFAULT 'pending' CHECK (proof_status IN ('pending','approved','rejected')),
  proof_url TEXT DEFAULT '',
  proof_uploaded_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  charity_contribution NUMERIC(10,2) DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(draw_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_draws_date ON draws(draw_date DESC);
CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
CREATE INDEX IF NOT EXISTS idx_winners_draw ON winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_proof_status ON winners(proof_status);
CREATE INDEX IF NOT EXISTS idx_winners_payout_status ON winners(payout_status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_charities_updated'
  ) THEN
    CREATE TRIGGER trg_charities_updated
      BEFORE UPDATE ON charities
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_draws_updated'
  ) THEN
    CREATE TRIGGER trg_draws_updated
      BEFORE UPDATE ON draws
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

INSERT INTO users (
  email,
  password_hash,
  full_name,
  role,
  is_admin,
  subscription_status,
  subscription_tier,
  home_course
)
SELECT
  'admin@fairwaygives.com',
  '$2b$12$5GBrSpL38F0IO4OlD.FgN.ybHgrGFGprOIWhs40vdjiRq03k.a8wm',
  'FairwayGives Admin',
  'admin',
  true,
  'active',
  'albatross',
  'FairwayGives HQ'
WHERE NOT EXISTS (
  SELECT 1
  FROM users
  WHERE email = 'admin@fairwaygives.com'
);

INSERT INTO charities (
  name,
  slug,
  description,
  mission,
  impact_summary,
  icon,
  founded,
  category,
  website,
  total_raised,
  supporter_count,
  featured,
  active,
  theme_color
)
SELECT
  seed.name,
  seed.slug,
  seed.description,
  seed.mission,
  seed.impact_summary,
  seed.icon,          -- <--- FIXED: Added icon here
  seed.founded,       -- <--- FIXED: Added founded here
  seed.category,
  seed.website,
  seed.total_raised,
  seed.supporter_count,
  seed.featured,
  true,
  seed.theme_color
FROM (
  VALUES
    (
      'First Tee',
      'first-tee',
      'Building game changers by introducing young people to golf and its values.',
      'First Tee creates experiences that build character, instill life-enhancing values and promote healthy choices through the game of golf.',
      '10M+ young people served through youth golf and character development programs.',
      '🌱',
      '1997',
      'Youth Development',
      'https://firsttee.org',
      340000,
      1236,
      true,
      '#4A8B4A'
    ),
    (
      'Folds of Honor',
      'folds-of-honor',
      'Providing educational scholarships to spouses and children of fallen and disabled service members.',
      'Providing educational scholarships to spouses and children of America''s fallen and disabled service members.',
      '44,000+ scholarships awarded to military families.',
      '🇺🇸',
      '2007',
      'Military Families',
      'https://foldsofhonor.org',
      520000,
      1890,
      true,
      '#4A7B8B'
    ),
    (
      'PGA REACH',
      'pga-reach',
      'The charitable foundation of the PGA of America, focused on inclusion, impact, and community.',
      'The charitable foundation of the PGA of America, empowering youth and military to thrive through golf.',
      '100+ community programs funded across youth, military, and inclusion initiatives.',
      '⛳',
      '2014',
      'Community Outreach',
      'https://pgareach.org',
      280000,
      970,
      false,
      '#D4A030'
    ),
    (
      'Special Olympics Golf',
      'special-olympics-golf',
      'Providing year-round sports training and competition for people with intellectual disabilities.',
      'Providing year-round sports training and athletic competition for children and adults with intellectual disabilities.',
      '5M+ athletes reached globally through inclusive sports participation.',
      '🏅',
      '1968',
      'Adaptive Sports',
      'https://specialolympics.org',
      190000,
      740,
      false,
      '#8B4A4A'
    ),
    (
      'St. Jude Children''s',
      'st-jude-childrens',
      'Leading the way the world understands, treats and defeats childhood cancer.',
      'Leading the way the world understands, treats and defeats childhood cancer and other life-threatening diseases.',
      '80% survival rate achieved through world-class pediatric research and care.',
      '❤️',
      '1962',
      'Healthcare',
      'https://stjude.org',
      410000,
      1420,
      true,
      '#B23A3A'
    ),
    (
      'Golf Course Superintendents Environmental',
      'golf-course-superintendents-environmental',
      'Advancing environmentally sound golf course management through research and education.',
      'Advancing environmentally sound golf course management through research and education.',
      '10,000+ courses improved through environmental stewardship and education.',
      '🌿',
      '1955',
      'Environment',
      'https://www.gcsaa.org',
      150000,
      560,
      false,
      '#3A8B55'
    ),
    (
      'Veterans Golf Association',
      'veterans-golf-association',
      'Using golf to enhance veterans'' physical, mental, social, and emotional well-being.',
      'Dedicated to promoting the game of golf to veterans and their family members to enhance their physical and mental well-being.',
      '15,000+ veteran members supported through golf-based community programs.',
      '🎖️',
      '2014',
      'Military Families',
      'https://vgagolf.org',
      230000,
      880,
      false,
      '#2C3E50'
    ),
    (
      'Youth on Course',
      'youth-on-course',
      'Providing subsidized rounds for young golfers and support for career development.',
      'Providing youth with access to life-changing opportunities through golf with subsidized $5 rounds.',
      '2M+ subsidized rounds opened up for youth golfers nationwide.',
      '🧒',
      '2006',
      'Youth Development',
      'https://youthoncourse.org',
      175000,
      690,
      false,
      '#E67E22'
    ),
    (
      'Wounded Warrior Project',
      'wounded-warrior-project',
      'Serving veterans and service members who incurred a physical or mental injury.',
      'Honoring and empowering wounded warriors who incurred a physical or mental injury, illnesses, or wound.',
      '200,000+ warriors served with recovery and long-term support resources.',
      '💪',
      '2003',
      'Military Families',
      'https://woundedwarriorproject.org',
      380000,
      1310,
      true,
      '#5D6D7E'
    )
) AS seed(
  name,
  slug,
  description,
  mission,
  impact_summary,
  icon,
  founded,
  category,
  website,
  total_raised,
  supporter_count,
  featured,
  theme_color
)
WHERE NOT EXISTS (
  SELECT 1
  FROM charities existing
  WHERE existing.slug = seed.slug
);

INSERT INTO users (
  email,
  password_hash,
  full_name,
  handicap,
  home_course,
  role,
  is_admin,
  subscription_status,
  subscription_tier,
  selected_charity_id
)
SELECT
  seed.email,
  '$2b$12$5GBrSpL38F0IO4OlD.FgN.ybHgrGFGprOIWhs40vdjiRq03k.a8wm',
  seed.full_name,
  seed.handicap,
  seed.home_course,
  'subscriber',
  false,
  'active',
  seed.subscription_tier,
  charity.id
FROM (
  VALUES
    ('sarah.mitchell@example.com', 'Sarah Mitchell', 4.2, 'Pine Valley GC', 'eagle', 'first-tee'),
    ('james.chen@example.com', 'James Chen', 8.1, 'Pebble Beach Links', 'birdie', 'folds-of-honor'),
    ('maria.rodriguez@example.com', 'Maria Rodriguez', 6.5, 'Torrey Pines South', 'eagle', 'pga-reach'),
    ('david.park@example.com', 'David Park', 12.3, 'Shadow Creek', 'birdie', 'special-olympics-golf'),
    ('emily.watson@example.com', 'Emily Watson', 3.8, 'Whistling Straits', 'albatross', 'st-jude-childrens'),
    ('robert.kim@example.com', 'Robert Kim', 15.2, 'Bethpage Black', 'birdie', 'golf-course-superintendents-environmental'),
    ('lisa.thompson@example.com', 'Lisa Thompson', 9.7, 'Bandon Dunes', 'eagle', 'veterans-golf-association'),
    ('michael.brown@example.com', 'Michael Brown', 5.6, 'Kiawah Island', 'albatross', 'youth-on-course'),
    ('jennifer.lee@example.com', 'Jennifer Lee', 11.0, 'TPC Sawgrass', 'birdie', 'wounded-warrior-project'),
    ('andrew.davis@example.com', 'Andrew Davis', 7.4, 'Oakmont Country Club', 'eagle', 'first-tee')
) AS seed(email, full_name, handicap, home_course, subscription_tier, charity_slug)
JOIN charities charity ON charity.slug = seed.charity_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM users existing
  WHERE existing.email = seed.email
);

INSERT INTO scores (user_id, stableford_points, course_name, played_at, notes)
SELECT
  users.id,
  seed.stableford_points,
  seed.course_name,
  seed.played_at::timestamptz,
  seed.notes
FROM (
  VALUES
    ('sarah.mitchell@example.com', 39, 'Pine Valley GC', '2026-01-12T08:30:00Z', 'Winter medal round'),
    ('sarah.mitchell@example.com', 37, 'Pine Valley GC', '2026-02-09T08:20:00Z', 'Club points event'),
    ('sarah.mitchell@example.com', 40, 'Merion East', '2026-03-14T09:00:00Z', 'Spring invitational'),
    ('james.chen@example.com', 34, 'Pebble Beach Links', '2026-01-18T10:00:00Z', 'Charity scramble'),
    ('james.chen@example.com', 35, 'Spyglass Hill', '2026-02-21T09:15:00Z', 'Weekend medal'),
    ('james.chen@example.com', 36, 'Pebble Beach Links', '2026-03-08T10:10:00Z', 'Member qualifier'),
    ('maria.rodriguez@example.com', 38, 'Torrey Pines South', '2026-01-10T07:45:00Z', 'Monthly stableford'),
    ('maria.rodriguez@example.com', 37, 'Torrey Pines North', '2026-02-15T08:05:00Z', 'Club tournament'),
    ('maria.rodriguez@example.com', 39, 'Torrey Pines South', '2026-03-11T08:40:00Z', 'Captain''s day'),
    ('david.park@example.com', 31, 'Shadow Creek', '2026-01-05T11:00:00Z', 'Opening round'),
    ('david.park@example.com', 33, 'TPC Summerlin', '2026-02-11T10:30:00Z', 'Midseason event'),
    ('david.park@example.com', 32, 'Shadow Creek', '2026-03-07T10:45:00Z', 'Friendly match'),
    ('emily.watson@example.com', 41, 'Whistling Straits', '2026-01-09T08:15:00Z', 'Major prep round'),
    ('emily.watson@example.com', 40, 'Whistling Straits', '2026-02-13T08:10:00Z', 'Charity cup'),
    ('emily.watson@example.com', 42, 'Erin Hills', '2026-03-16T08:25:00Z', 'Season best'),
    ('robert.kim@example.com', 29, 'Bethpage Black', '2026-01-20T09:50:00Z', 'Tough conditions'),
    ('robert.kim@example.com', 30, 'Bethpage Red', '2026-02-22T09:40:00Z', 'Practice round'),
    ('robert.kim@example.com', 31, 'Bethpage Black', '2026-03-17T09:30:00Z', 'Improved finish'),
    ('lisa.thompson@example.com', 35, 'Bandon Dunes', '2026-01-25T08:05:00Z', 'Coastal challenge'),
    ('lisa.thompson@example.com', 34, 'Pacific Dunes', '2026-02-26T08:20:00Z', 'Windy conditions'),
    ('lisa.thompson@example.com', 36, 'Bandon Trails', '2026-03-18T08:00:00Z', 'Strong back nine'),
    ('michael.brown@example.com', 38, 'Kiawah Island', '2026-01-14T09:10:00Z', 'Member major'),
    ('michael.brown@example.com', 39, 'Ocean Course', '2026-02-16T09:00:00Z', 'Charity qualifier'),
    ('michael.brown@example.com', 37, 'Kiawah Island', '2026-03-20T09:20:00Z', 'Solid finish'),
    ('jennifer.lee@example.com', 33, 'TPC Sawgrass', '2026-01-28T10:00:00Z', 'Island green survived'),
    ('jennifer.lee@example.com', 34, 'TPC Sawgrass', '2026-02-24T10:15:00Z', 'Stable scoring'),
    ('jennifer.lee@example.com', 35, 'Sawgrass Country Club', '2026-03-22T10:10:00Z', 'Personal best'),
    ('andrew.davis@example.com', 36, 'Oakmont Country Club', '2026-01-30T08:40:00Z', 'Tough greens'),
    ('andrew.davis@example.com', 37, 'Oakmont Country Club', '2026-02-27T08:35:00Z', 'Winter event'),
    ('andrew.davis@example.com', 38, 'Oakmont Country Club', '2026-03-24T08:45:00Z', 'Spring medal')
) AS seed(email, stableford_points, course_name, played_at, notes)
JOIN users ON users.email = seed.email
WHERE NOT EXISTS (
  SELECT 1
  FROM scores existing
  WHERE existing.user_id = users.id
    AND existing.played_at = seed.played_at::timestamptz
);

INSERT INTO impact_log (user_id, charity_id, amount, source, description)
SELECT
  users.id,
  charity.id,
  seed.amount,
  'subscription',
  seed.description
FROM (
  VALUES
    ('sarah.mitchell@example.com', 'first-tee', 1240.00, 'Season donations'),
    ('james.chen@example.com', 'folds-of-honor', 980.00, 'Season donations'),
    ('maria.rodriguez@example.com', 'pga-reach', 1120.00, 'Season donations'),
    ('david.park@example.com', 'special-olympics-golf', 870.00, 'Season donations'),
    ('emily.watson@example.com', 'st-jude-childrens', 1350.00, 'Season donations'),
    ('robert.kim@example.com', 'golf-course-superintendents-environmental', 760.00, 'Season donations'),
    ('lisa.thompson@example.com', 'veterans-golf-association', 640.00, 'Season donations'),
    ('michael.brown@example.com', 'youth-on-course', 1050.00, 'Season donations'),
    ('jennifer.lee@example.com', 'wounded-warrior-project', 890.00, 'Season donations'),
    ('andrew.davis@example.com', 'first-tee', 920.00, 'Season donations')
) AS seed(email, charity_slug, amount, description)
JOIN users ON users.email = seed.email
JOIN charities charity ON charity.slug = seed.charity_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM impact_log existing
  WHERE existing.user_id = users.id
    AND existing.charity_id = charity.id
    AND existing.description = seed.description
);
