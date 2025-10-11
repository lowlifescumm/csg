# Manual Database Setup for Render

Since there seems to be a DNS resolution issue with the hostname, you can set up the database manually using one of these methods:

## Method 1: Using Render Dashboard

1. Go to your Render dashboard
2. Navigate to your PostgreSQL database
3. Click on "Connect" or "Query"
4. Copy and paste the SQL commands from `init-render.sql`

## Method 2: Using a Database Client

Use any PostgreSQL client (like pgAdmin, DBeaver, or TablePlus) with the connection string:
```
postgresql://csg_data_user:U08IhiDLTiyTT1ypORqk6vj6tAkPgrFH@dpg-d3l9r8ruibrs73chae70-a/csg_data
```

## Method 3: Using psql from a different network

Try running the psql command from a different network or use a VPN if the hostname resolution is blocked.

## SQL Commands to Execute

Run these SQL commands in your database:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Readings table
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    question TEXT,
    result JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Birth charts table
CREATE TABLE IF NOT EXISTS birth_charts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    birth_date DATE NOT NULL,
    birth_time TIME,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    chart_data JSONB NOT NULL,
    interpretation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Horoscopes table
CREATE TABLE IF NOT EXISTS horoscopes (
    id SERIAL PRIMARY KEY,
    sign VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(sign, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_readings_user_id ON readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at);
CREATE INDEX IF NOT EXISTS idx_birth_charts_user_id ON birth_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_horoscopes_sign_date ON horoscopes(sign, date);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES (
    'admin@cosmicguide.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Admin', 
    'User', 
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert default credits for admin user
INSERT INTO credits (user_id, credits) 
SELECT id, 1000 FROM users WHERE email = 'admin@cosmicguide.com' 
ON CONFLICT DO NOTHING;
```

## Verification

After running the SQL commands, verify the setup by running:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check admin user
SELECT email, first_name, last_name, role FROM users WHERE email = 'admin@cosmicguide.com';

-- Check admin credits
SELECT u.email, c.credits FROM users u 
JOIN credits c ON u.id = c.user_id 
WHERE u.email = 'admin@cosmicguide.com';
```

## Default Admin Credentials

- **Email**: admin@cosmicguide.com
- **Password**: admin123
- **Credits**: 1000
- **Role**: admin

**Important**: Change the admin password immediately after first login!
