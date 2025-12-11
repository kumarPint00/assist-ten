# AI Learning Assessment Platform - Frontend (Next.js)

## 🔧 Migration from Vite to Next.js - COMPLETED ✅

This project has been successfully migrated from Vite + React Router to **Next.js 14 with App Router**.

## 🏗️ Architecture Changes

### **Routing Migration**
- **Before**: React Router with `BrowserRouter`, `Routes`, `Route`
- **After**: Next.js App Router with file-based routing in `/app` directory

### **Navigation Migration**
- **Before**: `useNavigate`, `useLocation`, `useParams` from `react-router-dom`
- **After**: Custom hooks in `/src/hooks/navigation.ts` that wrap Next.js navigation
- **Before**: `<NavLink>` from `react-router-dom`
- **After**: Custom `<NavLink>` component in `/src/components/NavLink/`

### **Layout Migration**
- **Before**: `<Outlet>` components for nested routing
- **After**: `children` prop in layout components (`layout.tsx` files)

### **Environment Variables**
- **Before**: `import.meta.env.VITE_API_BASE_URL`
- **After**: `process.env.NEXT_PUBLIC_API_BASE_URL`

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📁 New Project Structure

```
FE/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page (/)
│   ├── ClientLayout.tsx         # Client-side providers
│   ├── login/page.tsx           # /login
│   ├── signup/page.tsx          # /signup
│   ├── app/                     # /app/* routes
│   │   ├── layout.tsx           # App layout with sidebar
│   │   ├── dashboard/page.tsx   # /app/dashboard
│   │   ├── profile-setup/page.tsx
│   │   ├── streak/page.tsx
│   │   └── settings/page.tsx
│   ├── admin/                   # /admin/* routes
│   │   ├── layout.tsx           # Admin layout
│   │   ├── dashboard/page.tsx   # /admin/dashboard
│   │   ├── assessment/page.tsx  # /admin/assessment
│   │   ├── assessment/[id]/
│   │   │   ├── view/page.tsx    # /admin/assessment/[id]/view
│   │   │   └── edit/page.tsx    # /admin/assessment/[id]/edit
│   │   ├── add-candidate/page.tsx
│   │   ├── requirement/page.tsx
│   │   └── settings/page.tsx
│   ├── quiz/page.tsx            # /quiz
│   ├── candidate-assessment/[assessmentId]/page.tsx
│   ├── candidate-quiz/page.tsx
│   └── logout/page.tsx
├── src/                         # Existing components (mostly unchanged)
│   ├── components/
│   ├── containers/
│   ├── hooks/
│   │   └── navigation.ts        # Next.js navigation hooks
│   ├── theme/
│   │   └── theme.ts            # Material-UI theme
│   ├── API/
│   ├── types/
│   └── utils/
├── next.config.js              # Next.js configuration
├── tsconfig.json               # Updated TypeScript config
└── package.json                # Updated dependencies
```

## 🔄 Migration Details

### **Route Mapping**
| Vite Route | Next.js Route |
|------------|---------------|
| `/` | `/app/page.tsx` |
| `/login` | `/app/login/page.tsx` |
| `/signup` | `/app/signup/page.tsx` |
| `/app/dashboard` | `/app/app/dashboard/page.tsx` |
| `/admin/*` | `/app/admin/*/page.tsx` |
| `/quiz` | `/app/quiz/page.tsx` |

### **Key Changes Made**

1. **Package.json**: Updated to Next.js dependencies, removed Vite
2. **Routing**: Converted all routes to Next.js App Router structure
3. **Navigation**: Created compatibility layer for React Router hooks
4. **Protected Routes**: Updated to use Next.js navigation
5. **Layouts**: Converted `<Outlet>` to `children` prop pattern
6. **Environment**: Updated API base URL handling
7. **TypeScript**: Updated configuration for Next.js
8. **Components**: Added `'use client'` directive where needed

### **Compatibility Hooks**
The migration maintains compatibility with existing component code through custom hooks in `/src/hooks/navigation.ts`:

- `useNavigate()` - Wraps Next.js `useRouter()`
- `useLocation()` - Wraps Next.js `usePathname()` and `useSearchParams()`
- `useParams()` - Re-exports Next.js `useParams()`

### **Protected Routes**
All protected route components updated to use Next.js navigation:
- `ProtectedRoute` - Requires authentication
- `ProtectedAuthRoute` - Redirects authenticated users
- `ProtectedProfileQuizRoute` - Requires profile completion
- `AdminProtectedRoute` - Requires admin role

## 🔧 Configuration

### **Environment Variables**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/
```

### **Next.js Configuration**
- API proxy rewrites configured in `next.config.js`
- Material-UI SSR support
- TypeScript strict mode enabled

## 🎯 Benefits of Next.js Migration

✅ **Better SEO** - Server-side rendering out of the box  
✅ **Improved Performance** - Automatic code splitting and optimization  
✅ **Built-in Routing** - File-based routing system  
✅ **API Routes** - Can add backend endpoints directly in Next.js  
✅ **Image Optimization** - Built-in `next/image` component  
✅ **Production Ready** - Optimized builds and caching strategies  

## 🚨 Breaking Changes

- Remove any direct usage of `react-router-dom` - use compatibility hooks instead
- Update any custom `Link` components to use `next/link`
- Environment variables must be prefixed with `NEXT_PUBLIC_` for client access
- SSR considerations - ensure localStorage access is wrapped in `useEffect`

## 🔄 Future Optimizations

1. **Server Components** - Convert static components to Server Components
2. **API Routes** - Consider moving some API calls to Next.js API routes
3. **Image Optimization** - Replace `<img>` tags with `next/image`
4. **Font Optimization** - Use `next/font` for Google Fonts
5. **Metadata API** - Add dynamic metadata for better SEO
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
