# 買取催事管理システム (Buyback Event Management System)

## Overview
A comprehensive SaaS application for managing retail buyback events in Japan. It leverages AI for identifying high-potential store locations, schedules events, tracks costs, and analyzes profitability to maximize ROI. The system features a multi-tenant architecture, role-based access control, KPI dashboards, AI-powered store selection, calendar-based scheduling with Google Calendar sync, and extensive store database management. Its core purpose is to centralize event management and facilitate data-driven decision-making for retail buyback operations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
Built with React 18, TypeScript, and Vite, using Wouter for routing and Shadcn/ui (New York style) with Tailwind CSS for styling. Features Japanese typography (Noto Sans JP, JetBrains Mono), custom color schemes, light/dark mode, neumorphism, and responsive grid layouts. State management uses TanStack Query for server state and React hooks for local component state. Design patterns emphasize page-level and reusable UI components, and custom hooks.

### Backend
Node.js with Express.js provides a RESTful API. It utilizes a storage abstraction via an `IStorage` interface, implemented by `DbStorage` using Drizzle ORM. Development uses Vite for HMR, while production builds leverage Vite for frontend and esbuild for backend.

### Database
Supabase PostgreSQL is the database, managed with Drizzle ORM for type-safe queries. A multi-tenant architecture is enforced via `organizationId` and Row Level Security (RLS) across tables for organizations, user_organizations, stores, events, and costs, all using UUIDs. Zod schemas generated from Drizzle tables provide validation, and Drizzle Kit handles migrations.

### System Design Choices
- **Multi-tenancy**: Achieved with Supabase RLS and `organizationId` for data isolation.
- **Role-Based Access Control**: Supports 'admin', 'member', and 'super_admin' roles.
- **AI-Enhanced Workflow**: AI assists in store candidate discovery and demographic data enrichment.
- **API Usage Tracking**: Logs and estimates costs for Google Places and Gemini APIs.
- **Dynamic Map-Based Supermarket Discovery**: Automatic supermarket search based on map viewport with intelligent throttling and radius adjustment.
- **Regional Demographics Data**: Hybrid approach using e-Stat official data and Google Gemini AI for enrichment, with graceful degradation.
- **Authentication**: Supabase Auth integrated with a `user_organizations` table for linking users to organizations.
- **UI/UX**: Consistent design language across dashboards, store selection, calendar views, and administrative interfaces, focusing on intuitive user flows and data visualization.

## External Dependencies

- **AI Service**: Google Gemini API (`@google/genai`) for demographic analysis.
- **Official Statistics**: e-Stat API (Statistics Bureau of Japan) for primary demographic data.
- **Maps Integration**: Google Maps API (`@react-google-maps/api`) for geocoding, visualization, and searches.
- **Calendar Integration**: Google Calendar for event scheduling.
- **Data Visualization**: Recharts library for KPIs and performance analysis.
- **Date Handling**: `date-fns` and `react-big-calendar`.
- **Database**: Supabase PostgreSQL.