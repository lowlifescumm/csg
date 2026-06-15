import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixGSTA502() {
  console.log('=== GSTA-502 Data Fix ===');
  console.log('Calendar ID: 11 - Synastry vs Composite: Which Chart to Use?');
  
  try {
    // Check if content_workflow table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'content_workflow'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('content_workflow table does not exist.');
      console.log('Checking for content_calendar table...');
      
      const calendarCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'content_calendar'
      `);
      
      if (calendarCheck.rows.length === 0) {
        console.log('Neither content_workflow nor content_calendar table exists.');
        console.log('This may be a different system. Checking blog_posts directly...');
        
        const blogCheck = await pool.query(`
          SELECT id, title, slug FROM blog_posts 
          WHERE title ILIKE '%synastry%' OR slug LIKE '%synastry%'
        `);
        console.log('Matching blog posts:', blogCheck.rows);
        return;
      }
    }
    
    // Check content_workflow for calendar_id 11
    console.log('\n--- Checking content_workflow for calendar_id 11 ---');
    const workflowResult = await pool.query(`
      SELECT * FROM content_workflow WHERE calendar_id = '11'
    `);
    
    if (workflowResult.rows.length === 0) {
      console.log('No content_workflow record found for calendar_id 11');
    } else {
      console.log('Found workflow record:', JSON.stringify(workflowResult.rows[0], null, 2));
    }
    
    // Check blog_posts for synastry post
    console.log('\n--- Checking blog_posts for synastry post ---');
    const blogResult = await pool.query(`
      SELECT id, title, slug, status FROM blog_posts 
      WHERE slug = 'synastry-vs-composite-charts'
    `);
    
    let blogPostId;
    
    if (blogResult.rows.length === 0) {
      console.log('No blog post found with slug synastry-vs-composite-charts');
      console.log('\nCreating blog post...');
      
      // Get an admin user for author_id
      const userResult = await pool.query(`
        SELECT id FROM users WHERE role = 'admin' LIMIT 1
      `);
      const authorId = userResult.rows[0]?.id || 1;
      
      const insertResult = await pool.query(`
        INSERT INTO blog_posts (
          title, slug, excerpt, content, author_id, status, 
          meta_title, meta_description, category, tags, reading_time
        ) VALUES (
          'Synastry vs Composite: Which Chart to Use?',
          'synastry-vs-composite-charts',
          'Learn the key differences between synastry and composite charts for relationship astrology readings.',
          '<h1>Synastry vs Composite: Which Chart to Use?</h1>
          <p>When exploring relationship astrology, two powerful tools emerge: synastry charts and composite charts. Each offers unique insights into relationship dynamics, but they serve different purposes.</p>
          <h2>Understanding Synastry Charts</h2>
          <p>A synastry chart overlays two birth charts to examine how planetary energies interact between partners. It reveals attraction, friction, and complementary energies.</p>
          <h2>Understanding Composite Charts</h2>
          <p>A composite chart creates a new chart by averaging both partners planetary positions, representing the relationship as a separate entity.</p>
          <h2>Which Should You Use?</h2>
          <p>Use synastry for understanding individual dynamics and composite for understanding the relationship as a whole.</p>',
          $1,
          'draft',
          'Synastry vs Composite: Which Chart to Use? - Cosmic Spiritual Guide',
          'Learn when to use synastry vs composite charts for relationship astrology readings. Understand the differences and which chart reveals what about your relationship.',
          'compatibility',
          ARRAY['astrology', 'relationships', 'synastry', 'composite'],
          5
        )
        RETURNING id
      `, [authorId]);
      
      blogPostId = insertResult.rows[0].id;
      console.log('Created blog_post with ID:', blogPostId);
    } else {
      blogPostId = blogResult.rows[0].id;
      console.log('Found existing blog_post with ID:', blogPostId);
    }
    
    // Link blog_post to content_workflow
    console.log('\n--- Linking blog_post to content_workflow ---');
    
    if (workflowResult.rows.length === 0) {
      // Create workflow record
      await pool.query(`
        INSERT INTO content_workflow (calendar_id, blog_post_id, current_step, step_status)
        VALUES ('11', $1, 'edit', 'completed')
      `, [blogPostId]);
      console.log('Created content_workflow record with blog_post_id:', blogPostId);
    } else {
      // Update existing workflow record
      await pool.query(`
        UPDATE content_workflow 
        SET blog_post_id = $1, updated_at = NOW()
        WHERE calendar_id = '11'
      `, [blogPostId]);
      console.log('Updated content_workflow record with blog_post_id:', blogPostId);
    }
    
    // Verify the fix
    console.log('\n--- Verification ---');
    const verifyResult = await pool.query(`
      SELECT cw.calendar_id, cw.blog_post_id, cw.current_step, cw.step_status,
             bp.title, bp.slug, bp.status
      FROM content_workflow cw
      JOIN blog_posts bp ON bp.id = cw.blog_post_id
      WHERE cw.calendar_id = '11'
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('SUCCESS! Linked record:');
      console.log(JSON.stringify(verifyResult.rows[0], null, 2));
    } else {
      console.log('WARNING: Could not verify link');
    }
    
    console.log('\n=== GSTA-502 Fix Complete ===');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixGSTA502();
