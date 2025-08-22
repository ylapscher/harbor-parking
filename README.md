# Harbor Parking 🅿️

A modern resident parking spot sharing platform that transforms chaotic WhatsApp group coordination into a streamlined web application. Harbor Parking enables residents in residential buildings to efficiently share unused parking spots, set availability windows, and coordinate guest parking.

## ✨ Features

- **Smart Spot Sharing**: Register your parking spots and set availability windows
- **Real-time Dashboard**: View available spots and claim them instantly  
- **Admin Management**: Building administrators can approve users and verify spot ownership
- **Mobile Responsive**: Optimized for mobile-first usage with dark theme
- **Secure & Private**: Row-level security with Supabase authentication
- **API-First**: Complete REST API with OpenAPI 3.0 specification

## 🚀 Live Demo

[Visit Harbor Parking](https://parking.lapscher.com) (if deployed)

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.4.5 with App Router & TypeScript
- **Styling**: Tailwind CSS v4 with PostCSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Authentication**: Supabase Auth with email/password
- **Deployment**: Vercel
- **Documentation**: OpenAPI 3.0 specification

## 📱 Screenshots

### Dashboard
The main hub where users manage their spots and find available parking.

### Spot Management  
Easy registration and availability scheduling for your parking spots.

### Admin Interface
Streamlined approval workflow for new users and spot verification.

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ylapscher/harbor-parking.git
   cd harbor-parking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.template .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional)
   ```

4. **Set up the database**
   
   Run the SQL scripts in your Supabase dashboard to create the required tables and RLS policies. See [Database Setup](#database-setup) below.

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗄️ Database Setup

The application requires the following Supabase tables with Row Level Security:

### Tables
- `profiles` - User profile data with approval status
- `parking_spots` - Parking spot ownership and details  
- `availabilities` - Time windows when spots are available
- `claims` - Reservation system for spot claiming

### Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the database migration scripts (contact for setup scripts)
4. Enable Row Level Security on all tables
5. Configure authentication policies

## 🔐 Authentication

The app uses Supabase Auth with the following flow:

1. **Sign Up**: Users register with email/password
2. **Email Verification**: Users verify their email address
3. **Profile Creation**: System creates a profile record
4. **Admin Approval**: Building admin approves new users
5. **Full Access**: Approved users can use all features

## 📊 User Roles

- **Resident**: Can register spots, set availability, and claim spots
- **Admin**: Can approve users, verify spot ownership, and access admin dashboard
- **Super Admin**: Full system access (configured via database)

## 🏗️ Architecture

### Frontend Structure
```
app/
├── auth/          # Authentication pages
├── dashboard/     # Main user dashboard
├── profile/       # User profile management  
├── admin/         # Admin interface
└── layout.tsx     # Root layout

components/
├── auth/          # Login/signup forms
├── parking/       # Spot cards, modals
├── dashboard/     # Dashboard components
└── layout/        # Navigation, layout
```

### API Design
- RESTful API following OpenAPI 3.0 specification
- JWT authentication with Supabase
- Real-time updates via Supabase subscriptions
- Comprehensive error handling and validation

## 🧪 Development

### Available Scripts

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server  
npm start

# Run ESLint
npm run lint

# Type checking
npm run type-check
```

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js configuration
- Prettier for code formatting
- Path aliases: `@/*` maps to project root

## 📚 API Documentation

Complete API documentation is available via OpenAPI 3.0 specification:

- **JSON Format**: `/openapi.json`
- **YAML Format**: `/openapi.yaml`  
- **Generated Types**: `/types/api.ts`

### Example API Usage

```javascript
// Claim a parking spot
const response = await fetch('/api/claims', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    availability_id: 'uuid-here',
    notes: 'Need spot for meeting'
  })
})
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💡 Background

Harbor Parking was created to solve the common problem of parking coordination in residential buildings. Instead of chaotic WhatsApp group messages, residents now have a professional platform to:

- **Share spots efficiently** when traveling or not using their car
- **Find parking quickly** when having guests or needing temporary spots  
- **Coordinate fairly** with transparent availability and claiming system
- **Reduce conflicts** through structured approval and verification workflows

## 📞 Support

- **Documentation**: See [CLAUDE.md](CLAUDE.md) for development guidance
- **Business Requirements**: See [BUSINESS_REQUIREMENTS.md](BUSINESS_REQUIREMENTS.md)
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Email**: Contact your building administrator for account approval

---

Built with ❤️ for residential communities