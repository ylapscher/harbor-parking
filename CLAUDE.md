# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "Harbor Parking" - a Resident Parking Spot Sharing Platform built with Next.js. The application enables residents in residential buildings to share unused parking spots, set availability windows, and coordinate guest parking efficiently. It replaces informal WhatsApp group coordination with a professional web application.

**Current Status**: The application is now fully functional with a complete authentication system, dashboard, parking spot management, availability scheduling, and claim system. The core MVP features are implemented and working.

## Technology Stack

- **Frontend**: Next.js 15.4.5 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 with PostCSS
- **Fonts**: Geist Sans and Geist Mono
- **Linting**: ESLint with Next.js configuration
- **Backend**: Supabase with Row Level Security and authentication
- **Database**: PostgreSQL with Supabase managed hosting
- **Authentication**: Supabase Auth with email/password
- **Deployment**: Vercel (ready for production)

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

The application implements all core business requirements:

### Core Features ✅ IMPLEMENTED
- **User Management**: Complete registration with admin approval workflow
- **Parking Spot Management**: Spot registration, ownership verification
- **Availability System**: Time-windowed spot sharing with scheduling
- **Claim Management**: "Call dibs" system with conflict prevention
- **Admin Interface**: User approval and spot ownership verification
- **API Documentation**: Comprehensive OpenAPI 3.0 specification

### Database Schema ✅ IMPLEMENTED
- **Profiles**: User data with approval status and admin roles
- **Parking Spots**: Spot ownership with verification system
- **Availabilities**: Time windows for spot sharing
- **Claims**: Reservation system with status tracking

### Security Features ✅ IMPLEMENTED
- Row Level Security policies enforced in Supabase
- Authentication middleware with session management
- Input validation throughout the application
- Role-based access control (admin/user permissions)

## File Structure

- `app/` - Next.js App Router pages
  - `auth/` - Authentication pages (login, signup, verify)
  - `dashboard/` - Main user dashboard
  - `profile/` - User profile management
  - `admin/` - Admin interface for user/spot management
- `components/` - React components organized by feature
  - `ui/` - Reusable UI components
  - `auth/` - Authentication components (LoginForm, SignupForm, LogoutButton)
  - `parking/` - Parking-related components (ParkingSpotCard, AvailabilityToggle, SpotClaimModal)
  - `layout/` - Layout components (Navigation)
  - `dashboard/` - Dashboard-specific components
- `lib/` - Library code and configurations
  - `supabase/` - Supabase client and auth utilities
  - `utils.ts` - Utility functions
- `types/` - TypeScript type definitions
  - `database.ts` - Supabase generated types
  - `index.ts` - Application types
  - `api.ts` - API types from OpenAPI spec
- `hooks/` - Custom React hooks
  - `useAuth.ts` - Authentication state management
- `middleware.ts` - Next.js middleware for auth protection
- `openapi.json` & `openapi.yaml` - Complete API specification
- `BUSINESS_REQUIREMENTS.md` - Business requirements and specs

## Development Guidelines

- Uses strict TypeScript configuration with comprehensive type safety
- Path aliases configured: `@/*` maps to project root
- ESLint extends Next.js core-web-vitals and TypeScript rules
- Follow Next.js App Router patterns for all pages and components
- Mobile-first responsive design with dark theme
- Real-time updates and optimistic UI patterns
- Error handling with user-friendly feedback
- Form validation and loading states throughout

## Recent Updates

- **Dashboard Error Handling**: Fixed parking spot addition with proper error messages and success feedback
- **OpenAPI Documentation**: Complete API specification with TypeScript types
- **Consolidated Navigation**: Removed standalone browse spots page, integrated into dashboard
- **Enhanced User Experience**: Improved loading states, error handling, and responsive design

## Business Context

The application addresses coordination challenges in residential buildings where parking is limited. Key user types:
- **Primary**: Building residents sharing/claiming spots
- **Secondary**: Building administrators managing approvals
- **Tertiary**: Developers integrating with the platform API

Success metrics include user adoption percentage, usage frequency, and reduction in WhatsApp group parking coordination messages.