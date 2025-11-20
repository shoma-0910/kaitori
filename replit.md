# 買取催事管理システム (Buyback Event Management System)

## Overview
A comprehensive, data-driven SaaS application designed to manage the entire lifecycle of buyback events at retail stores across Japan. It enables users to identify high-potential store locations using AI, schedule events, track costs, and analyze profitability. The system centralizes event management from AI-powered store discovery to post-event profit analysis, facilitating data-driven decision-making to maximize ROI. Key capabilities include multi-tenant architecture, user authentication with role-based access, KPI tracking dashboards, store selection with potential scoring, calendar-based event scheduling with Google Calendar sync, and comprehensive store database management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18, TypeScript, and Vite. It uses Wouter for routing and Shadcn/ui components (New York style) with Tailwind CSS for styling. The design system features Japanese typography (Noto Sans JP, JetBrains Mono), custom color schemes with light/dark mode, subtle neumorphism, and responsive grid layouts. State management relies on TanStack Query for server state and React hooks for local component state. Key design patterns include page-level components, reusable UI components, and custom hooks.

### Backend Architecture
The backend uses Node.js with Express.js, providing a RESTful API. It employs a storage abstraction via an `IStorage` interface, implemented by `DbStorage` using Drizzle ORM. The development setup integrates Vite for HMR, while production builds involve Vite for the frontend and esbuild for the backend.

### Database Layer
The system utilizes Supabase PostgreSQL as the database provider, managed via Drizzle ORM for type-safe queries. A multi-tenant architecture is enforced through `organizationId` in all tables and Row Level Security (RLS), ensuring data isolation. The schema defines tables for organizations, user_organizations (for multi-user support with roles), stores, events, and costs, with UUIDs as primary keys. Zod schemas generated from Drizzle tables provide schema validation, and Drizzle Kit manages migrations.

### System Design Choices
- **Multi-tenant architecture**: Data isolation per organization using Supabase RLS.
- **Role-Based Access Control**: 'admin' and 'member' roles with 'super_admin' for system-wide management.
- **AI-Enhanced Workflow**: AI assists in store candidate discovery and demographic data enrichment.
- **API Usage Tracking**: Comprehensive logging and cost estimation for Google Places and Gemini APIs.
- **Dynamic Map-Based Supermarket Discovery**: Automatic supermarket search based on map viewport with intelligent throttling.
- **Regional Demographics Data**: Hybrid approach using e-Stat official data and Google Gemini AI for enrichment, with graceful degradation and source attribution.
- **Authentication**: Supabase Auth for user management, with `user_organizations` table linking Supabase users to local organization data.

## External Dependencies

- **AI Service**: Google Gemini API (`@google/genai`) for regional demographic analysis and data enrichment.
- **Official Statistics**: e-Stat API (Statistics Bureau of Japan) for primary demographic data, with graceful degradation if not configured.
- **Maps Integration**: Google Maps API (`@react-google-maps/api`) for geocoding, store visualization, and nearby store searches.
- **Calendar Integration**: Google Calendar for event scheduling via public calendar URLs.
- **Data Visualization**: Recharts library for dashboard KPIs and store performance analysis.
- **Date Handling**: `date-fns` for date manipulation and `react-big-calendar` for calendar views.
- **Database**: Supabase PostgreSQL for managed database services.