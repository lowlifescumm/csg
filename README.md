# Cosmic Spiritual Guide

A modern web application for AI-powered tarot readings, astrology insights, and spiritual guidance.

## Features

- 🔮 **AI-Powered Tarot Readings** - Get personalized interpretations using OpenAI
- 🌟 **Birth Chart Analysis** - Detailed astrological birth chart generation
- 💕 **Compatibility Reports** - Relationship compatibility analysis
- 🌙 **Moon Phase Tracking** - Current moon phase information
- 📅 **Daily Horoscopes** - Personalized daily astrological insights
- 💳 **Stripe Integration** - Secure payment processing
- 👤 **User Management** - Registration, authentication, and profile management
- 🎯 **Credit System** - Flexible credit-based usage model

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL
- **Payments**: Stripe
- **AI**: OpenAI GPT-4
- **Authentication**: JWT
- **Deployment**: Render

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cosmic-spiritual-guide
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env.local
   ```
   Edit `.env.local` with your actual values.

4. **Set up the database**
   - Create a PostgreSQL database
   - Run the SQL script in `database/init.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000)

### Production Deployment on Render

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `NEXT_PUBLIC_BASE_URL` | Your app's public URL | Yes |
| `CRON_SECRET` | Secret for cron job security | Yes |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Tarot & Readings
- `POST /api/tarot` - Get tarot reading
- `GET /api/readings` - Get user's readings

### Astrology
- `POST /api/birth-chart` - Generate birth chart
- `POST /api/compatibility` - Check compatibility
- `GET /api/transits` - Get current transits
- `GET /api/horoscope` - Get daily horoscope

### Payments
- `POST /api/create-payment-intent` - Create payment intent
- `POST /api/create-subscription` - Create subscription
- `POST /api/stripe-webhook` - Stripe webhook handler

### Health Check
- `GET /api/health` - Application health status

## Database Schema

The application uses the following main tables:

- **users** - User accounts and profiles
- **credits** - User credit balances
- **readings** - Tarot and astrology readings
- **birth_charts** - Generated birth charts
- **subscriptions** - Stripe subscription data
- **horoscopes** - Daily horoscope content

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- HTTPS enforcement in production
- Secure headers configuration
- Input validation and sanitization
- Rate limiting on API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@cosmicguide.com or create an issue in the repository.

## Changelog

### v1.0.0
- Initial release
- Core tarot and astrology features
- Stripe payment integration
- User management system
- Responsive design
