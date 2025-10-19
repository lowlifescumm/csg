-- Blog posts table for SEO content
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags TEXT[],
    category VARCHAR(100),
    reading_time INTEGER DEFAULT 5,
    view_count INTEGER DEFAULT 0
);

-- Blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Blog tags table
CREATE TABLE IF NOT EXISTS blog_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Blog post views tracking
CREATE TABLE IF NOT EXISTS blog_post_views (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_post_id ON blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_viewed_at ON blog_post_views(viewed_at);

-- Insert default categories
INSERT INTO blog_categories (name, slug, description) VALUES 
('Astrology', 'astrology', 'Articles about astrology, birth charts, and planetary influences'),
('Tarot', 'tarot', 'Tarot card meanings, spreads, and reading techniques'),
('Spirituality', 'spirituality', 'General spiritual guidance and wisdom'),
('Moon Phases', 'moon-phases', 'Lunar cycles and their spiritual significance'),
('Compatibility', 'compatibility', 'Relationship and compatibility insights')
ON CONFLICT (slug) DO NOTHING;

-- Insert default tags
INSERT INTO blog_tags (name, slug) VALUES 
('beginner', 'beginner'),
('advanced', 'advanced'),
('daily-guidance', 'daily-guidance'),
('love', 'love'),
('career', 'career'),
('spiritual-growth', 'spiritual-growth'),
('meditation', 'meditation'),
('manifestation', 'manifestation')
ON CONFLICT (slug) DO NOTHING;
