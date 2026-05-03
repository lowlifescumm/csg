-- Content Calendar and Publishing Workflow Schema
-- For tracking blog post performance and managing content calendar

-- Content Calendar Table
CREATE TABLE IF NOT EXISTS content_calendar (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    target_keyword VARCHAR(255),
    target_url_slug VARCHAR(255),
    content_type VARCHAR(50) DEFAULT 'blog_post', -- blog_post, calculator, guide, etc.
    status VARCHAR(50) DEFAULT 'planned', -- planned, writing, editing, scheduled, published, archived
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    publish_date DATE,
    week_number INTEGER, -- Week 1-12 of the quarter
    month_number INTEGER, -- Month 1-3 of the quarter
    quarter INTEGER DEFAULT 2, -- Q2 2026
    year INTEGER DEFAULT 2026,
    assigned_to VARCHAR(255), -- agent or user name
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content Performance Tracking Table
CREATE TABLE IF NOT EXISTS content_performance (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    calendar_id INTEGER REFERENCES content_calendar(id) ON DELETE SET NULL,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Traffic Metrics
    organic_sessions INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    avg_time_on_page INTEGER DEFAULT 0, -- in seconds
    bounce_rate DECIMAL(5,2), -- percentage
    
    -- Conversion Metrics
    email_signups INTEGER DEFAULT 0,
    free_readings_triggered INTEGER DEFAULT 0,
    premium_conversions INTEGER DEFAULT 0,
    revenue_attributed DECIMAL(10,2) DEFAULT 0,
    
    -- SEO Metrics
    keyword_ranking INTEGER, -- position in search results
    search_impressions INTEGER DEFAULT 0,
    search_clicks INTEGER DEFAULT 0,
    search_ctr DECIMAL(5,2), -- click-through rate
    
    -- Social Metrics
    social_shares INTEGER DEFAULT 0,
    pinterest_pins INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, recorded_at)
);

-- Publishing Workflow Steps Table
CREATE TABLE IF NOT EXISTS publishing_workflow (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER REFERENCES content_calendar(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL, -- research, outline, draft, edit, seo_review, images, schedule, publish, promote
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, blocked
    assigned_to VARCHAR(255),
    due_date DATE,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content Briefs Table (stores detailed content requirements)
CREATE TABLE IF NOT EXISTS content_briefs (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER REFERENCES content_calendar(id) ON DELETE CASCADE,
    target_keyword VARCHAR(255) NOT NULL,
    secondary_keywords TEXT[], -- array of related keywords
    search_intent VARCHAR(50), -- informational, transactional, navigational
    target_word_count INTEGER,
    outline JSONB, -- structured outline
    key_points TEXT[], -- must-include points
    cta_strategy TEXT, -- call-to-action approach
    competitor_analysis JSONB, -- top 3 ranking competitors
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_publish_date ON content_calendar(publish_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_week ON content_calendar(week_number, year);
CREATE INDEX IF NOT EXISTS idx_content_performance_post_id ON content_performance(post_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_date ON content_performance(recorded_at);
CREATE INDEX IF NOT EXISTS idx_publishing_workflow_calendar ON publishing_workflow(calendar_id);

-- Insert 3-month content calendar (24 posts)
INSERT INTO content_calendar (title, target_keyword, target_url_slug, content_type, status, priority, publish_date, week_number, month_number, notes) VALUES
-- Month 1 (May 2026) - Calculators & Tools Focus
('How to Calculate Your Birth Chart in 5 Minutes', 'birth chart calculator', 'how-to-calculate-birth-chart', 'blog_post', 'planned', 'high', '2026-05-04', 1, 1, 'Comprehensive guide + calculator CTA'),
('The Complete Guide to Moon Phases (With Free Tracker)', 'moon phase today', 'moon-phases-guide-tracker', 'blog_post', 'planned', 'high', '2026-05-08', 1, 1, 'Include interactive moon phase widget'),
('Rising Sign vs Sun Sign: What''s the Difference?', 'rising sign calculator', 'rising-sign-vs-sun-sign', 'blog_post', 'planned', 'high', '2026-05-11', 2, 1, 'Explain big three with calculator links'),
('Venus Retrograde 2026: What It Means for Your Love Life', 'venus in retrograde', 'venus-retrograde-2026-love', 'blog_post', 'planned', 'high', '2026-05-15', 2, 1, 'Retrograde survival guide + compatibility tools'),
('Mercury Retrograde Survival Guide', 'mercury retrograde meaning', 'mercury-retrograde-survival-guide', 'blog_post', 'planned', 'high', '2026-05-18', 3, 1, 'Email capture for retrograde alerts'),
('North Node Meaning: Your Karmic Destiny', 'north node astrology', 'north-node-karmic-destiny', 'blog_post', 'planned', 'medium', '2026-05-22', 3, 1, 'Deep spiritual content'),
('Juno Sign Calculator: Find Your Soulmate Asteroid', 'juno sign calculator', 'juno-sign-soulmate-calculator', 'blog_post', 'planned', 'medium', '2026-05-25', 4, 1, 'Relationship-focused calculator'),
('Lilith in Astrology: Your Wild Side', 'lilith in astrology', 'lilith-astrology-wild-side', 'blog_post', 'planned', 'medium', '2026-05-29', 4, 1, 'Edgy content for engagement'),

-- Month 2 (June 2026) - Relationships & Compatibility
('Relationship Compatibility: Beyond Sun Signs', 'compatibility test', 'relationship-compatibility-beyond-sun', 'blog_post', 'planned', 'high', '2026-06-01', 5, 2, 'Feature compatibility calculator prominently'),
('Composite Chart Calculator: Your Relationship''s Soul', 'composite chart calculator', 'composite-chart-relationship-soul', 'blog_post', 'planned', 'high', '2026-06-05', 5, 2, 'Advanced relationship tool'),
('Synastry vs Composite: Which Chart to Use?', 'synastry chart', 'synastry-vs-composite-charts', 'blog_post', 'planned', 'medium', '2026-06-08', 6, 2, 'Educational comparison post'),
('Vertex in Synastry: Fated Connections', 'vertex astrology', 'vertex-synastry-fated-connections', 'blog_post', 'planned', 'medium', '2026-06-12', 6, 2, 'Niche but engaging topic'),
('Part of Fortune in Love & Career', 'part of fortune', 'part-fortune-love-career', 'blog_post', 'planned', 'medium', '2026-06-15', 7, 2, 'Dual-purpose content'),
('Transit Compatibility: When Timing Matters', 'transit astrology calculator', 'transit-compatibility-timing', 'blog_post', 'planned', 'medium', '2026-06-19', 7, 2, 'Time-sensitive tool integration'),
('Asteroid Astrology for Relationships', 'asteroid astrology', 'asteroid-astrology-relationships', 'blog_post', 'planned', 'low', '2026-06-22', 8, 2, 'Deep dive content'),
('Progressed Chart Calculator: Your Evolution', 'progressed chart calculator', 'progressed-chart-evolution', 'blog_post', 'planned', 'medium', '2026-06-26', 8, 2, 'Advanced feature highlight'),

-- Month 3 (July 2026) - Deep Astrology & Evergreen
('Solar Return Chart: Your Year Ahead', 'solar return chart', 'solar-return-year-ahead', 'blog_post', 'planned', 'medium', '2026-06-29', 9, 3, 'Birthday timing - high conversion potential'),
('Understanding Tarot Card Meanings', 'tarot card meanings', 'tarot-card-meanings-guide', 'blog_post', 'planned', 'high', '2026-07-03', 9, 3, 'Connect to tarot reading tool'),
('Tarot for Beginners: 5 Spreads to Start', 'tarot reading', 'tarot-beginners-5-spreads', 'blog_post', 'planned', 'high', '2026-07-06', 10, 3, 'Beginner-friendly + CTA'),
('Daily Horoscope: Why Yours Feels Off', 'daily horoscope', 'daily-horoscope-accuracy', 'blog_post', 'planned', 'high', '2026-07-10', 10, 3, 'Pitch personalized forecasts'),
('Zodiac Signs Explained (Complete Guide)', 'what is my zodiac sign', 'zodiac-signs-complete-guide', 'blog_post', 'planned', 'high', '2026-07-13', 11, 3, 'Evergreen cornerstone content'),
('The 12 Houses in Astrology', 'astrology houses', '12-houses-astrology-guide', 'blog_post', 'planned', 'medium', '2026-07-17', 11, 3, 'Educational pillar content'),
('Planetary Aspects Made Simple', 'astrology aspects', 'planetary-aspects-simple', 'blog_post', 'planned', 'medium', '2026-07-20', 12, 3, 'Technical but accessible'),
('Free Birth Chart Analysis: Step-by-Step', 'free birth chart', 'free-birth-chart-analysis', 'blog_post', 'planned', 'high', '2026-07-24', 12, 3, 'Ultimate conversion post');

-- Create default publishing workflow steps for each content item
INSERT INTO publishing_workflow (calendar_id, step_name, status, due_date)
SELECT 
    cc.id,
    step.step_name,
    'pending',
    cc.publish_date - (step.days_before::integer)
FROM content_calendar cc
CROSS JOIN (VALUES 
    ('research', 14),
    ('outline', 10),
    ('draft', 7),
    ('edit', 4),
    ('seo_review', 3),
    ('images', 2),
    ('schedule', 1),
    ('publish', 0),
    ('promote', -1)
) AS step(step_name, days_before);

-- Add content briefs for high-priority posts
INSERT INTO content_briefs (calendar_id, target_keyword, secondary_keywords, search_intent, target_word_count, cta_strategy)
SELECT 
    cc.id,
    cc.target_keyword,
    ARRAY['free birth chart', 'natal chart calculator', 'astrology chart'],
    'informational',
    1500,
    'Primary: Link to free birth chart calculator. Secondary: Email signup for personalized forecasts. Tertiary: Follow social media.'
FROM content_calendar cc
WHERE cc.target_keyword = 'birth chart calculator';

INSERT INTO content_briefs (calendar_id, target_keyword, secondary_keywords, search_intent, target_word_count, cta_strategy)
SELECT 
    cc.id,
    cc.target_keyword,
    ARRAY['love compatibility', 'zodiac compatibility test', 'relationship astrology'],
    'transactional',
    1200,
    'Primary: Embed compatibility calculator. Secondary: Free trial signup. Tertiary: Share results on social.'
FROM content_calendar cc
WHERE cc.target_keyword = 'compatibility test';

INSERT INTO content_briefs (calendar_id, target_keyword, secondary_keywords, search_intent, target_word_count, cta_strategy)
SELECT 
    cc.id,
    cc.target_keyword,
    ARRAY['tarot cards meaning', 'how to read tarot', 'tarot spreads'],
    'informational',
    2000,
    'Primary: Link to free tarot reading tool. Secondary: Email course signup. Tertiary: Downloadable tarot cheat sheet.'
FROM content_calendar cc
WHERE cc.target_keyword = 'tarot card meanings';
