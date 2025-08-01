# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "Harbor Parking" - a Resident Parking Spot Sharing Platform built with Next.js. The application enables residents in residential buildings to share unused parking spots, set availability windows, and coordinate guest parking efficiently. It replaces informal WhatsApp group coordination with a professional web application.

The project is currently in early development stage with a fresh Next.js 15 setup using TypeScript and Tailwind CSS.

## Technology Stack

- **Frontend**: Next.js 15.4.5 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 with PostCSS
- **Fonts**: Geist Sans and Geist Mono
- **Linting**: ESLint with Next.js configuration
- **Planned Backend**: Supabase with Row Level Security (per business requirements)
- **Planned Deployment**: Vercel

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Environment Setup

1. Copy `.env.local.template` to `.env.local`
2. Fill in your Supabase project credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
   - Optional: `SUPABASE_SERVICE_ROLE_KEY` for admin operations

## Project Architecture

Based on the business requirements, the application will implement:

### Core Features
- **User Management**: Registration with admin approval workflow
- **Parking Spot Management**: Spot ownership declaration and verification
- **Availability System**: Time-windowed spot sharing
- **Claim Management**: "Call dibs" system with conflict prevention
- **Admin Interface**: User approval and spot ownership verification
- **API Documentation**: Public API docs with Mintlify or ReadMe.io

### Database Schema (Planned)
- Users/Profiles with approval status and roles
- Parking Spots with ownership metadata
- Availabilities with time windows
- Claims with reservations and status tracking

### Security Features (Planned)
- Row Level Security with Supabase
- Authentication middleware and session management
- Input validation using Zod
- Role-based access control

## File Structure

- `app/` - Next.js App Router directory
  - `layout.tsx` - Root layout with Geist fonts
  - `page.tsx` - Home page (currently default Next.js template)
  - `globals.css` - Global styles
- `components/` - React components organized by feature
  - `ui/` - Reusable UI components
  - `auth/` - Authentication components
  - `parking/` - Parking-related components
- `lib/` - Library code and configurations
  - `supabase/` - Supabase client configurations and auth helpers
  - `validations/` - Zod validation schemas
- `types/` - TypeScript type definitions
  - `database.ts` - Generated Supabase database types
  - `index.ts` - Application-specific types
- `utils/` - Utility functions (e.g., `cn` for className merging)
- `hooks/` - Custom React hooks (e.g., `useAuth`)
- Configuration files: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `middleware.ts`
- `BUSINESS_REQUIREMENTS.md` - Detailed business requirements and technical specifications

## Development Guidelines

- Uses strict TypeScript configuration
- Path aliases configured: `@/*` maps to project root
- ESLint extends Next.js core-web-vitals and TypeScript rules
- Follow Next.js App Router patterns for new pages and components
- Mobile-first responsive design approach
- Real-time updates and sub-second response times for critical operations

## Business Context

The application addresses coordination challenges in residential buildings where parking is limited. Key user types:
- **Primary**: Building residents sharing/claiming spots
- **Secondary**: Building administrators managing approvals
- **Tertiary**: Developers integrating with the platform API

Success metrics include user adoption percentage, usage frequency, and reduction in WhatsApp group parking coordination messages.