# Proof of Trend ($POT)

## Overview

Proof of Trend is a web platform for early trend discovery and price intelligence in the dropshipping/e-commerce space. The application provides:

1. **Proof of Trend** - AI-powered early trend detection for winning products
2. **Proof of Price** - Historical pricing intelligence with market analytics
3. **Proof of Execution** - Verifiable execution logging with blockchain anchoring

The platform uses Algorand blockchain for hash anchoring, timestamp verification, and wallet identity (not for financial transactions). It follows a production-grade MVP architecture with proprietary data isolation to protect algorithms and AI logic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite bundler (not Next.js despite initial planning)
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom dark theme (cyber/crypto aesthetic)
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Charts**: Recharts for price history visualization
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript throughout
- **API Style**: REST API with typed routes defined in `shared/routes.ts`
- **Build**: Custom build script using esbuild for server, Vite for client

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Authentication
- **Provider**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions stored in PostgreSQL
- **User Model**: Extended with wallet address and role fields

### Private Data Isolation Layer
The application implements a proprietary data protection pattern:
- **Location**: `server/private/` directory contains all proprietary logic
- **Files**: `trendScoring.ts`, `priceNormalization.ts`, `aiHeuristics.ts`, `sourceWeights.ts`
- **Pattern**: Private modules are only imported by service layer (`server/services/`), never by controllers or frontend
- **Purpose**: Protects scoring algorithms, weights, and AI prompts from API exposure

### Service Layer
- `trendService.ts` - Applies proprietary trend scoring before returning data
- `priceService.ts` - Normalizes price data with private algorithms
- `aiService.ts` - Sanitizes data before sending to AI, never exposes raw prompts

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries and schema management

### AI/ML Services
- **OpenAI API**: Via Replit AI Integrations for chat, image generation, and audio
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Blockchain
- **Algorand SDK** (`algosdk`): For wallet identity and hash anchoring (simulated in MVP)

### External APIs
- **CoinGecko API**: Market ticker data for crypto assets (via `/api/market/top-assets`)

### Replit Integrations
Located in `server/replit_integrations/`:
- **Auth**: Replit OpenID Connect authentication
- **Chat**: AI chat with conversation persistence
- **Image**: Image generation via gpt-image-1
- **Audio**: Voice chat with speech-to-text and text-to-speech
- **Batch**: Rate-limited batch processing utilities

### Key NPM Packages
- `express` - Web server framework
- `drizzle-orm` / `drizzle-zod` - Database ORM with Zod validation
- `@tanstack/react-query` - Server state management
- `zod` - Runtime type validation
- `recharts` - Data visualization
- `date-fns` - Date formatting
- `passport` / `openid-client` - Authentication