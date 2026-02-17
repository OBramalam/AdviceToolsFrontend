# Financial Planning Frontend

A Next.js TypeScript frontend application for AI-powered financial planning.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your API configuration:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_API_PREFIX=/api
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - React components
- `lib/` - Utilities, hooks, API client, and context
- `types/` - TypeScript type definitions

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- React 18+
- Tailwind CSS
- React Query (TanStack Query)
- React Hook Form + Zod
- Axios

