# 買取催事管理システム 仕様書
## Buyback Event Management System - Compressed Specification

---

### Overview
The Buyback Event Management System is a SaaS application designed to comprehensively manage "buyback events" (used goods purchase events) for retail stores in Japan. It targets businesses and individual proprietors operating these events, especially those managing events across multiple locations. The system focuses on high-value items like precious metals (gold, platinum) and brand-name goods (bags, watches, apparel). Its vision is to streamline the complex logistics of buyback events, enhance operational efficiency, and provide data-driven insights for strategic store selection and event planning. This includes evaluating market potential based on demographics, optimizing event scheduling, and improving profitability.

### User Preferences
The user prefers an iterative development approach, with regular communication and opportunities to provide feedback. They value clear, concise explanations and prefer that the agent asks for confirmation before implementing significant changes or making architectural decisions. The user expects the agent to prioritize robust, scalable solutions and adhere to best practices in coding and system design. They prefer detailed explanations when complex features are implemented or issues are encountered. The user wants the agent to focus on completing one task at a time, and not to make changes to the `Z` folder or the `Y` file.

### System Architecture
The system employs a modern full-stack architecture. The frontend is built with **React 18**, **TypeScript**, **Vite** for tooling, **Wouter** for routing, **Shadcn/ui** for UI components, and **Tailwind CSS** for styling. **TanStack Query** manages server-side state, and **Recharts** handles data visualization. The backend utilizes **Node.js** with **Express.js** for API services. **Drizzle ORM** manages database interactions, and **Zod** is used for data validation.

The database is **Supabase PostgreSQL**, leveraging **Row Level Security (RLS)** for multi-tenant data separation. Each table includes an `organizationId` for data isolation. Authentication is handled by **Supabase Auth**.

**Core Features and Design Patterns:**
- **Dashboard**: Displays key performance indicators (KPIs) like active stores, planned events, total gross profit, and estimated costs, scoped to the active organization.
- **Store Selection (Map Integration)**: Google Maps-based search for supermarkets, dynamic store acquisition based on viewport, ranking by senior female population density, and demographic data display (e-Stat + Gemini AI). Stores can be registered with a single click.
- **Registered Store Management**: Lists registered stores, displays detailed information (address, phone, hours, rank), includes AI-driven parking lot determination using Street View and Gemini Vision API, and manages sales history per store.
- **Calendar & Scheduling**: Provides month, week, and day views for events, allows event creation (store, duration, manager), synchronizes with Google Calendar, facilitates sales and item purchase input post-event, and manages event statuses (planned/in progress/completed/cancelled).
- **Sales Analytics**: Offers graphical representation of sales trends by store and period, integrates event sales with direct input sales, and allows filtering by period and store.
- **AI Region Analysis**: Provides AI-powered regional analysis for all municipalities in Japan, assessing buyback potential based on demographics (population, average age/income, senior/female ratios, housing characteristics).
- **Organization Settings**: Allows management of organizations (creation, editing, deletion by admins), member management (add, change role, remove), and displays API usage for Google Maps/Gemini.
- **Multi-tenancy**: Achieved through `organizationId` in all data tables and enforced via Supabase RLS and API filtering.
- **Authentication**: Utilizes Supabase Auth for login/signup, JWT for session management, and `user_organizations` table for user-organization mapping.

### External Dependencies
- **Supabase**: PostgreSQL (database), Supabase Auth (authentication), Row Level Security (RLS).
- **Google Maps Platform**: Google Maps API (map display, store search, geocoding), Google Street View (parking assessment images).
- **Google Calendar API**: Event schedule synchronization.
- **Google Gemini API**: AI analysis for regional potential and parking determination.
- **e-Stat API**: Official statistical data for demographics (e.g., population statistics).