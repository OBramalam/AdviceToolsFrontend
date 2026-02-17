# MVP Plan - Financial Planning Frontend

## Overview
A Next.js TypeScript frontend application for financial planning with AI-powered chat assistance. The MVP focuses on core authentication, dashboard with chat interface, and basic settings management.

## Technology Stack

### Core Framework
- **Next.js 14+** (App Router) - React framework with server-side rendering
- **TypeScript** - Type safety and better developer experience
- **React 18+** - UI library

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Tailwind CSS Forms Plugin** - Enhanced form styling
- **Lucide React** or **Heroicons** - Icon library

### State Management
- **React Context API** - For global auth state
- **React Query (TanStack Query)** - For server state management, caching, and API calls
- **Zustand** (optional) - Lightweight state management if needed for complex client state

### Authentication & API
- **Next-Auth** (optional) or custom JWT handling
- **Axios** or **Fetch API** - HTTP client with interceptors for token refresh
- **Server-Sent Events (SSE)** - For chat streaming responses

### Form Handling & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Utilities
- **date-fns** - Date formatting and manipulation
- **clsx** or **classnames** - Conditional class names

---

## Project Structure

```
AdviceToolsFrontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage
│   ├── (auth)/                  # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/             # Protected dashboard routes
│       ├── layout.tsx           # Dashboard layout with sidebar
│       ├── dashboard/
│       │   └── page.tsx         # Main dashboard with chat
│       └── settings/
│           └── page.tsx

├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── chat/
│   │   ├── ChatInterface.tsx    # Main chat component
│   │   ├── ChatMessage.tsx      # Individual message
│   │   ├── ChatInput.tsx        # Message input with send button
│   │   └── ChatSidebar.tsx      # Sidebar container
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx
│   │   └── ...
│   └── layout/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── ProtectedRoute.tsx
├── lib/
│   ├── api/
│   │   └── client.ts            # Base API client with interceptors
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth API calls + React Query hooks
│   │   ├── useChat.ts           # Chat API calls + React Query hooks
│   │   ├── useFinancialPlans.ts # Financial plans API + hooks
│   │   ├── useCashFlows.ts      # Cash flows API + hooks
│   │   └── useTokenRefresh.ts   # Token refresh utility hook
│   ├── utils/
│   │   ├── token.ts             # Token storage/retrieval
│   │   ├── validation.ts        # Validation schemas
│   │   └── constants.ts         # App constants
│   └── context/
│       └── AuthContext.tsx      # Auth context provider
├── types/
│   ├── api.ts                   # API types (User, FinancialPlan, etc.)
│   └── index.ts
├── styles/
│   └── globals.css              # Global styles + Tailwind imports
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── package.json
```

---

## Pages & Routes

### 1. Homepage (`/`)
**Purpose:** Landing page for unauthenticated users

**Features:**
- Hero section with value proposition
- Call-to-action buttons (Login/Signup)
- Brief feature overview
- Navigation to auth pages

**Access:** Public

---

### 2. Login Page (`/login`)
**Purpose:** User authentication

**Features:**
- Email and password input fields
- Form validation (email format, required fields)
- Error message display
- Link to signup page
- "Remember me" option (optional for MVP)
- Redirect to dashboard on success

**Access:** Public (redirect to dashboard if already authenticated)

**API Integration:**
- `POST /api/auth/login`
- Store access_token and refresh_token
- Handle 401/403 errors

---

### 3. Signup Page (`/signup`)
**Purpose:** New user registration

**Features:**
- Name, email, and password fields
- Password confirmation field
- Password strength indicator (optional)
- Form validation:
  - Email format
  - Password requirements (min 8 chars, uppercase, lowercase, number)
  - Password match
- Error message display
- Link to login page
- Redirect to dashboard on success

**Access:** Public (redirect to dashboard if already authenticated)

**API Integration:**
- `POST /api/auth/register`
- Store tokens on success

---

### 4. Dashboard Page (`/dashboard`)
**Purpose:** Main workspace with chat interface

**Layout:**
- Sidebar on the left (chat interface)
- Main content area on the right (future: plan visualization)
- Header with user info and navigation

**Chat Sidebar Features:**
- Chat message history (scrollable)
- Message input at bottom
- Send button
- Loading indicator during streaming
- Clear chat button
- Export chat button (triggers parser)
- Auto-scroll to latest message

**Main Content Area (MVP):**
- Welcome message
- Placeholder for future plan visualization
- Quick actions (optional)

**Access:** Protected (requires authentication)

**API Integration:**
- `GET /api/chat/history` - Load chat history on mount
- `POST /api/chat/message` - Send message (SSE stream)
- `DELETE /api/chat/history` - Clear chat
- `POST /api/chat/export` - Export and parse chat

---

### 5. Settings Page (`/settings`)
**Purpose:** User account settings

**Features:**
- Display current user info (name, email)
- Edit name (optional for MVP)
- Change password (optional for MVP)
- Logout button
- Account deletion (optional for MVP)

**Access:** Protected

**API Integration:**
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- Update user (if endpoint available)

---

## Core Components

### Authentication Components

#### `LoginForm`
- Email and password inputs
- Submit handler
- Error state management
- Loading state during submission

#### `SignupForm`
- Name, email, password, confirm password inputs
- Validation logic
- Submit handler
- Error state management

### Chat Components

#### `ChatInterface` (Main Container)
- Manages chat state (messages, loading, error)
- Handles SSE connection
- Renders message list and input
- Handles export/clear actions

#### `ChatMessage`
- Displays individual message
- Different styling for user vs assistant
- Timestamp (optional)
- Markdown rendering for assistant messages (optional)

#### `ChatInput`
- Text input field
- Send button
- Enter key to send
- Disabled state during streaming

#### `ChatSidebar`
- Container for chat interface
- Fixed positioning
- Responsive width
- Collapsible (optional for MVP)

### Layout Components

#### `Navbar`
- Logo/brand
- Navigation links
- User menu (dropdown with logout)
- Responsive mobile menu

#### `Sidebar`
- Navigation items
- Active route highlighting
- Collapsible on mobile

#### `ProtectedRoute` / `AuthGuard`
- Wrapper component or middleware
- Checks authentication status
- Redirects to login if not authenticated
- Handles token refresh

### UI Components

#### `Button`
- Variants (primary, secondary, danger)
- Sizes (sm, md, lg)
- Loading state
- Disabled state

#### `Input`
- Text, email, password types
- Error state
- Label and helper text

#### `Card`
- Container component
- Variants for different use cases

---

## State Management

### Authentication State
**Context:** `AuthContext`
- Current user data
- Access token
- Refresh token
- Login/logout functions
- Token refresh logic
- Loading states

**Storage:**
- Access token: localStorage (or memory for better security)
- Refresh token: localStorage or httpOnly cookie (if backend supports)
- User data: Context state

### Chat State
**React Query:** `useChatHistory()`, `useSendMessage()`, etc.
- Messages array (from `useChatHistory()`)
- Loading state (from React Query)
- Error state (from React Query)
- Send message mutation (`useSendMessage()`)
- Clear chat mutation (`useClearChat()`)
- Export chat mutation (`useExportChat()`)

**Local State:**
- Current input value
- Streaming state
- Scroll position

### API State
**React Query (via hooks):**
- Financial plans queries (`useFinancialPlans()`, `useFinancialPlan()`)
- Cash flows queries (`useCashFlows()`, `useCashFlow()`)
- User data queries (`useCurrentUser()`)
- Automatic caching and refetching

---

## API Integration

### API Client Setup
**File:** `lib/api/client.ts`

**Features:**
- Base URL configuration (from env)
- Request interceptors:
  - Add Authorization header with access token
  - Handle token refresh on 401
- Response interceptors:
  - Handle 401 errors (token expired)
  - Handle 403 errors (inactive account)
  - Handle network errors
- Automatic token refresh logic
- Exported `apiClient` instance used by all hooks

### Authentication Hooks
**File:** `lib/hooks/useAuth.ts`

**Contains:**
- API functions (used internally):
  - `login(email, password)` - POST /api/auth/login
  - `register(name, email, password)` - POST /api/auth/register
  - `logout(refreshToken)` - POST /api/auth/logout
  - `refreshToken(refreshToken)` - POST /api/auth/refresh
  - `getCurrentUser()` - GET /api/auth/me

- React Query hooks:
  - `useLogin()` - Mutation for login
  - `useRegister()` - Mutation for registration
  - `useLogout()` - Mutation for logout
  - `useCurrentUser()` - Query for current user data
  - `useRefreshToken()` - Mutation for token refresh

### Chat Hooks
**File:** `lib/hooks/useChat.ts`

**Contains:**
- API functions (used internally):
  - `sendMessage(message)` - POST /api/chat/message (SSE stream)
  - `getChatHistory()` - GET /api/chat/history
  - `clearChatHistory()` - DELETE /api/chat/history
  - `exportChat(triggerParser)` - POST /api/chat/export

- React Query hooks:
  - `useChatHistory()` - Query for chat history
  - `useSendMessage()` - Mutation for sending messages (handles SSE)
  - `useClearChat()` - Mutation for clearing chat
  - `useExportChat()` - Mutation for exporting chat

**SSE Implementation:**
- Use EventSource or fetch with ReadableStream
- Handle streaming chunks
- Parse SSE format (`data: <chunk>\n\n`)
- Handle `[DONE]` and `[ERROR]` markers
- Update UI incrementally

### Financial Plans Hooks
**File:** `lib/hooks/useFinancialPlans.ts`

**Contains:**
- API functions (used internally):
  - `getFinancialPlans()` - GET /api/financial-plans
  - `getFinancialPlan(id)` - GET /api/financial-plans/{id}
  - `createFinancialPlan(data)` - POST /api/financial-plans
  - `updateFinancialPlan(id, data)` - PUT /api/financial-plans/{id}
  - `deleteFinancialPlan(id)` - DELETE /api/financial-plans/{id}

- React Query hooks:
  - `useFinancialPlans()` - Query for all plans
  - `useFinancialPlan(id)` - Query for single plan
  - `useCreateFinancialPlan()` - Mutation for creating plan
  - `useUpdateFinancialPlan()` - Mutation for updating plan
  - `useDeleteFinancialPlan()` - Mutation for deleting plan

### Cash Flows Hooks
**File:** `lib/hooks/useCashFlows.ts`

**Contains:**
- API functions (used internally):
  - `getCashFlows(planId)` - GET /api/cashflows/plan/{planId}
  - `getCashFlow(id)` - GET /api/cashflows/{id}
  - `createCashFlow(planId, data)` - POST /api/cashflows/plan/{planId}
  - `updateCashFlow(id, data)` - PUT /api/cashflows/{id}
  - `deleteCashFlow(id)` - DELETE /api/cashflows/{id}

- React Query hooks:
  - `useCashFlows(planId)` - Query for plan's cash flows
  - `useCashFlow(id)` - Query for single cash flow
  - `useCreateCashFlow()` - Mutation for creating cash flow
  - `useUpdateCashFlow()` - Mutation for updating cash flow
  - `useDeleteCashFlow()` - Mutation for deleting cash flow

---

## Authentication Flow

### Login Flow
1. User enters credentials
2. Submit → Call login API
3. On success:
   - Store tokens (access + refresh)
   - Store user data in context
   - Redirect to `/dashboard`
4. On error:
   - Display error message
   - Keep user on login page

### Token Refresh Flow
1. API call receives 401 (token expired)
2. Interceptor catches 401
3. Attempt refresh using refresh token
4. If refresh succeeds:
   - Update access token
   - Retry original request
5. If refresh fails:
   - Clear tokens
   - Redirect to login

### Logout Flow
1. User clicks logout
2. Call logout API with refresh token
3. Clear tokens from storage
4. Clear user data from context
5. Redirect to homepage

### Protected Route Flow
1. User navigates to protected route
2. Check if access token exists
3. If no token → redirect to login
4. If token exists → verify with `/api/auth/me`
5. If verification fails → attempt refresh
6. If refresh fails → redirect to login
7. If verified → render page

---

## Chat Interface Design

### Layout
- **Sidebar Style:** Fixed left sidebar (or right, based on preference)
- **Width:** ~400px on desktop, full width on mobile
- **Height:** Full viewport height
- **Responsive:** Collapsible/drawer on mobile

### Message Display
- **User Messages:**
  - Right-aligned or distinct styling
  - User avatar (optional)
  - Timestamp (optional)
  
- **Assistant Messages:**
  - Left-aligned or distinct styling
  - Assistant avatar/icon
  - Streaming indicator during response
  - Markdown support (optional for MVP)

### Input Area
- **Position:** Fixed at bottom of sidebar
- **Features:**
  - Multi-line text input
  - Send button (icon or text)
  - Character count (optional)
  - Disabled during streaming

### Streaming Implementation
1. User sends message
2. Add user message to UI immediately
3. Create SSE connection
4. Show loading indicator
5. Stream chunks and append to assistant message
6. On `[DONE]` → hide loading, enable input
7. On `[ERROR]` → show error message

---

## Styling Approach

### Tailwind Configuration
- Custom color palette (primary, secondary, etc.)
- Custom spacing scale
- Typography settings
- Dark mode support (optional for MVP)

### Design System
- **Colors:**
  - Primary: Blue/Teal for actions
  - Secondary: Gray for neutral elements
  - Success: Green for positive actions
  - Danger: Red for errors/destructive actions
  - Background: Light gray/white
  - Text: Dark gray/black

- **Typography:**
  - Headings: Bold, larger sizes
  - Body: Regular weight, readable size
  - Code/Monospace: For technical content

- **Spacing:**
  - Consistent spacing scale (4px base)
  - Generous padding for readability

- **Components:**
  - Rounded corners (consistent radius)
  - Subtle shadows for elevation
  - Smooth transitions for interactions

### Responsive Design
- **Mobile First:** Design for mobile, enhance for desktop
- **Breakpoints:**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

---

## Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_API_PREFIX=/api

# App Configuration
NEXT_PUBLIC_APP_NAME=Financial Planning App
```

---

## Development Phases

### Phase 1: Project Setup
- Initialize Next.js project with TypeScript
- Configure Tailwind CSS
- Set up project structure
- Configure ESLint and Prettier
- Set up environment variables

### Phase 2: Authentication
- Create auth context and hooks
- Build login page and form
- Build signup page and form
- Implement API client with interceptors
- Implement token refresh logic
- Create protected route wrapper

### Phase 3: Layout & Navigation
- Create root layout
- Build navbar component
- Build sidebar component
- Create dashboard layout
- Implement navigation logic

### Phase 4: Chat Interface
- Build chat components (message, input, interface)
- Implement SSE streaming
- Integrate chat API
- Add chat history loading
- Add clear/export functionality

### Phase 5: Dashboard
- Create dashboard page
- Integrate chat sidebar
- Add placeholder content
- Implement responsive design

### Phase 6: Settings
- Create settings page
- Display user information
- Implement logout functionality
- Add basic settings UI

### Phase 7: Polish & Testing
- Error handling improvements
- Loading states
- Form validation
- Responsive design refinements
- User experience improvements

---

## Key Considerations

### Security
- Never expose refresh tokens in client-side code unnecessarily
- Use httpOnly cookies for refresh tokens if possible
- Validate all user inputs
- Sanitize data before display
- Use HTTPS in production

### Performance
- Implement code splitting
- Lazy load components where appropriate
- Optimize images
- Use React Query caching effectively
- Minimize API calls

### User Experience
- Clear error messages
- Loading indicators for async operations
- Optimistic UI updates where appropriate
- Smooth transitions and animations
- Accessible forms and navigation

### Error Handling
- Network errors
- API errors (400, 401, 403, 404, 500)
- Token expiration
- Invalid form inputs
- SSE connection failures

---

## Future Enhancements (Post-MVP)

- Financial plan visualization (charts, graphs)
- Cash flow management UI
- Plan editing interface
- Simulation results display
- File upload interface
- Dark mode
- Notifications
- Plan sharing
- Export/import functionality
- Advanced settings

---

## Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.2.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

---

## Notes

- This plan focuses on MVP features only
- Chat interface is the core feature for financial plan creation
- Financial plan visualization can be added in future iterations
- The design should be clean and professional for financial planning context
- Consider accessibility (WCAG guidelines) from the start
- Mobile responsiveness is crucial

