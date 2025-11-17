# 買取催事管理システム (Buyback Event Management System)

## Overview

A comprehensive data-driven event management system for planning, executing, and analyzing buyback events at retail stores across Japan. The application enables users to identify high-potential store locations, schedule events, track costs, and measure profitability through an AI-enhanced workflow. Built as a modern SaaS application with Japanese language support.

**Core Purpose**: Centralize the entire lifecycle of buyback events - from AI-powered store candidate discovery to post-event profit analysis - enabling data-driven decision making for maximizing event ROI.

**Key Features**:
- **Multi-tenant architecture** with organization-based data isolation using Supabase
- **User authentication** with email/password login and role-based access control (admin/member)
- Dashboard with KPI tracking and store performance analytics
- Store selection with potential scoring and Google Maps integration
- Calendar-based event scheduling with Google Calendar sync and in-place event editing
- Editable event details (manager, dates, cost, notes) with instant UI updates
- Repeated Google Calendar additions (no duplicate prevention)
- Comprehensive store database with CRUD operations
- Subtle neumorphism design for modern, refined appearance while maintaining enterprise formality

## Recent Changes (November 17, 2025)

**Super Admin Organization Management**:
- Removed public signup functionality (login-only authentication)
- Implemented super admin role system with `is_super_admin` flag in user_organizations
- Created super admin-only organization management (/settings page)
- Super admins can create, edit, and delete all organizations
- Each organization = 1 user (1:1 relationship)
- Admin creates organization accounts and distributes credentials
- Regular users cannot access organization management

**Schema Changes**:
- Added `is_super_admin` text column to user_organizations ('true'/'false')
- admin@example.com set as the first super admin

**API Changes**:
- GET /api/user/me - Returns user info including isSuperAdmin flag
- GET /api/admin/organizations - List all organizations (super admin only)
- POST /api/admin/organizations - Create organization with user account (super admin only)
- PATCH /api/admin/organizations/:id - Update organization name (super admin only)
- DELETE /api/admin/organizations/:id - Delete organization and user (super admin only)
- Removed member management APIs (organizations are now 1:1 with users)

**Frontend Changes**:
- AuthContext now includes userInfo with isSuperAdmin flag
- Sidebar shows "会社管理" only for super admins
- Organization Settings page redesigned for full organization CRUD
- Removed signup tab from authentication page

**Previous Changes (November 16, 2025)**:

**Authentication Flow Fixes**:
- Configured Supabase client with session persistence (`persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`)
- Implemented React Router (wouter) based navigation for login redirect instead of window.location
- Added useEffect in Auth.tsx to watch AuthContext user state and redirect when authenticated
- Fixed loading state management to prevent UI blocking during authentication
- Verified full auth flow: signup → dashboard → logout → login → dashboard

**Architecture Clarification**:
- Supabase Auth serves as identity provider (users in auth.users table)
- Local PostgreSQL (via Drizzle ORM) stores domain data (organizations, stores, events)
- user_organizations table links Supabase user_id to local organization data
- Backend middleware validates Supabase JWT tokens via supabaseAdmin.auth.getUser()

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool

**Routing**: Wouter for client-side routing - lightweight alternative to React Router

**UI Component System**: 
- Shadcn/ui components (New York style variant) - unstyled, accessible component library built on Radix UI
- Tailwind CSS for styling with custom design tokens
- Component path aliasing: `@/components`, `@/lib`, `@/hooks`

**Design System**:
- Japanese typography: Noto Sans JP and JetBrains Mono for numerical data
- Custom color system with light/dark mode support via CSS variables
- Elevation-based interaction states (hover/active) for modern feel
- Subtle neumorphism effects with dual-direction shadows for refined appearance
- Responsive grid layouts optimized for data-heavy displays

**State Management**:
- TanStack Query (React Query) for server state management and caching
- Local component state with React hooks
- No global state management library (Redux, Zustand, etc.)

**Key Design Patterns**:
- Page-level components in `/client/src/pages`
- Reusable UI components in `/client/src/components`
- Custom hooks in `/client/src/hooks`
- Shared TypeScript types and schemas in `/shared`

### Backend Architecture

**Runtime**: Node.js with Express.js server

**API Design**: RESTful API with conventional HTTP methods
- `GET /api/stores` - List all stores
- `POST /api/stores` - Create store
- `PATCH /api/stores/:id` - Update store
- `DELETE /api/stores/:id` - Delete store
- Similar patterns for `/api/events` and `/api/costs`

**Data Layer**: 
- Storage abstraction via `IStorage` interface in `server/storage.ts`
- Concrete implementation: `DbStorage` class using Drizzle ORM
- Separation allows for easy testing and potential storage backend changes

**Development Mode**:
- Vite development server integrated as Express middleware
- HMR (Hot Module Replacement) for rapid development
- Custom logging for API requests

**Production Build**:
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server to `dist/index.js`
- Static file serving in production mode

### Database Layer

**ORM**: Drizzle ORM - lightweight TypeScript ORM with type-safe queries

**Database Provider**: Supabase PostgreSQL
- Managed PostgreSQL with built-in authentication
- Row Level Security (RLS) for multi-tenant data isolation
- Configured via `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables

**Multi-Tenant Architecture**:
- All tables include `organizationId` for data isolation
- Row Level Security policies ensure users only access their organization's data
- Helper functions in database to get user's organization from JWT tokens

**Schema Design** (`shared/schema.ts`):

```
organizations
- id (UUID, primary key)
- name (text)
- createdAt (timestamp)

user_organizations
- id (UUID, primary key)
- userId (UUID, foreign key to auth.users)
- organizationId (UUID, foreign key to organizations)
- role (text) - 'admin' or 'member'
- createdAt (timestamp)

stores
- id (UUID, primary key)
- organizationId (UUID, foreign key to organizations)
- name, address (text)
- population, averageAge (integer)
- averageIncome, averageRent (real)
- potentialScore (integer) - AI-calculated viability score

events
- id (UUID, primary key)
- organizationId (UUID, foreign key to organizations)
- storeId (foreign key to stores)
- manager, status (text)
- startDate, endDate (timestamp)
- estimatedCost, actualProfit (integer)
- googleCalendarEventId (text, optional)

costs
- id (UUID, primary key)
- organizationId (UUID, foreign key to organizations)
- eventId (foreign key to events)
- category, item (text) - e.g., "固定費", "会場費"
- amount (integer)

registered_stores
- id (UUID, primary key)
- organizationId (UUID, foreign key to organizations)
- placeId, name, address (text)
- latitude, longitude (real)
- phoneNumber, website (text, optional)
- openingHours (text array)
- registeredAt (timestamp)
```

**Schema Validation**: Zod schemas auto-generated from Drizzle tables using `drizzle-zod`
- Type-safe insert operations
- Runtime validation on API endpoints

**Migrations**: Drizzle Kit manages schema migrations in `/migrations` directory

### External Dependencies

**AI Service**: Google Gemini API (`@google/genai`)
- Used in AI Crawling feature for analyzing regional demographics
- Suggests store candidates based on location queries
- Requires `GOOGLE_AI_API_KEY` environment variable (currently mocked in UI)

**Maps Integration**: Google Maps API (`@react-google-maps/api`)
- Geocoding for address lookups
- Store location visualization with interactive markers
- Nearby store search using Places API
- Requires `VITE_GOOGLE_MAPS_API_KEY` environment variable

**Calendar Integration**: Google Calendar
- Event URLs auto-generated for one-click calendar additions
- Format: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...`
- No OAuth - uses public calendar URL scheme

**Data Visualization**: Recharts library
- Bar charts for store performance analysis
- Responsive containers for dashboard KPIs
- Custom styling to match design system

**Date Handling**: 
- `date-fns` for date formatting and manipulation (Japanese locale support)
- `react-big-calendar` for calendar view component

**Development Tools**:
- Replit-specific plugins for runtime error overlay and dev banner
- TypeScript with strict mode enabled
- ESLint/Prettier configuration via Tailwind and PostCSS

**Session Management**: `connect-pg-simple` for PostgreSQL-backed session storage (configured but authentication not yet implemented)