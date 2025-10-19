const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

async function setupBlog() {
  try {
    console.log('🚀 Setting up blog database schema...');
    
    // Read and execute the blog schema SQL
    const schemaPath = path.join(__dirname, '../database/add-blog-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schemaSQL);
    console.log('✅ Blog database schema created successfully!');
    
    // Create a sample blog post for testing
    console.log('📝 Creating sample blog post...');
    
    const samplePost = {
      title: 'Welcome to Our Spiritual Blog',
      slug: 'welcome-to-our-spiritual-blog',
      excerpt: 'Discover the power of cosmic guidance through our comprehensive spiritual blog covering astrology, tarot, and spiritual wisdom.',
      content: `
        <h2>Welcome to Our Spiritual Journey</h2>
        <p>We're excited to share our knowledge and insights about the mystical world of spirituality, astrology, and tarot with you.</p>
        
        <h3>What You'll Find Here</h3>
        <ul>
          <li><strong>Astrology Insights:</strong> Learn about planetary influences and how they affect your daily life</li>
          <li><strong>Tarot Wisdom:</strong> Discover the meanings behind tarot cards and how to use them for guidance</li>
          <li><strong>Spiritual Growth:</strong> Tips and techniques for personal development and spiritual awakening</li>
          <li><strong>Moon Phases:</strong> Understanding lunar cycles and their spiritual significance</li>
        </ul>
        
        <h3>Our Mission</h3>
        <p>Our mission is to provide you with authentic, insightful content that helps you navigate your spiritual journey with confidence and clarity.</p>
        
        <p>Stay tuned for regular updates and new articles that will deepen your understanding of the cosmic forces that shape our lives.</p>
      `,
      featured_image: null,
      author_id: 1, // Assuming admin user has ID 1
      status: 'published',
      published_at: new Date().toISOString(),
      meta_title: 'Welcome to Our Spiritual Blog - Cosmic Spiritual Guide',
      meta_description: 'Discover spiritual insights, astrology guidance, and tarot wisdom through our comprehensive blog. Learn about cosmic influences and spiritual growth.',
      tags: ['spirituality', 'beginner', 'welcome'],
      category: 'spirituality',
      reading_time: 3
    };
    
    await pool.query(`
      INSERT INTO blog_posts (
        title, slug, excerpt, content, featured_image, author_id, 
        status, published_at, meta_title, meta_description, 
        tags, category, reading_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (slug) DO NOTHING
    `, [
      samplePost.title,
      samplePost.slug,
      samplePost.excerpt,
      samplePost.content,
      samplePost.featured_image,
      samplePost.author_id,
      samplePost.status,
      samplePost.published_at,
      samplePost.meta_title,
      samplePost.meta_description,
      samplePost.tags,
      samplePost.category,
      samplePost.reading_time
    ]);
    
    console.log('✅ Sample blog post created successfully!');
    console.log('🎉 Blog setup complete! You can now:');
    console.log('   - Visit /blog to see the blog listing');
    console.log('   - Visit /admin/blog to manage posts');
    console.log('   - Create new posts for SEO content');
    
  } catch (error) {
    console.error('❌ Error setting up blog:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupBlog();
