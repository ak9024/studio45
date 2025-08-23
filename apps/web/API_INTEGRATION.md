# API Integration Guide

This document outlines the complete API integration implementation for Studio45 frontend application.

## 🚀 Features Implemented

### Authentication System
- ✅ JWT-based authentication
- ✅ Login/Register with API integration
- ✅ Forgot/Reset password functionality
- ✅ Auto-redirect for authenticated users
- ✅ Protected routes with role-based access

### API Infrastructure
- ✅ Axios client with interceptors
- ✅ Automatic token attachment
- ✅ Auto-logout on 401 errors
- ✅ Error handling and retry logic

### Admin Features
- ✅ User management (CRUD operations)
- ✅ Role-based navigation visibility
- ✅ User search and filtering
- ✅ Delete user functionality

### UI/UX Enhancements
- ✅ Toast notifications system
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Avatar generation

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx      # Route protection
│   ├── layout/
│   │   ├── DashboardHeader.tsx     # Header with user info
│   │   ├── DashboardLayout.tsx     # Main layout
│   │   └── Sidebar.tsx             # Navigation with role filtering
│   └── ui/                         # Reusable UI components
├── contexts/
│   └── AuthContext.tsx             # Global auth state
├── hooks/
│   ├── useAuth.ts                  # Auth hook
│   └── useToast.tsx                # Toast notifications
├── services/api/
│   ├── client.ts                   # Axios configuration
│   ├── auth.service.ts             # Auth API calls
│   ├── admin.service.ts            # Admin API calls
│   ├── user.service.ts             # User profile API calls
│   └── index.ts                    # Service exports
├── types/
│   └── api.types.ts               # API response types
└── pages/                          # Application pages
```

## 🔧 Configuration

### Environment Variables
```env
VITE_APP_TITLE=Studio45
VITE_API_HOST=http://localhost:8080
```

### API Endpoints Integrated

**Authentication:**
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Reset password with token

**Protected Routes:**
- `GET /api/v1/protected/profile` - Get user profile
- `PUT /api/v1/protected/profile` - Update user profile

**Admin Routes:**
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/users/:id` - Get user details
- `PUT /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user
- `PUT /api/v1/admin/users/:id/roles` - Update user roles
- `GET /api/v1/admin/roles` - Get available roles
- `GET /api/v1/admin/users/:id/permissions` - Get user permissions

## 🔐 Authentication Flow

1. User enters credentials on login page
2. Frontend sends POST to `/api/v1/auth/login`
3. Backend returns JWT token and user data
4. Token stored in localStorage
5. Axios interceptor adds token to subsequent requests
6. On 401 error, user is automatically logged out

## 🛡️ Security Features

- JWT tokens automatically attached to requests
- Auto-logout on token expiration
- Protected routes with role validation
- CSRF protection ready
- Input validation with Zod schemas

## 📱 User Interface

### Navigation
- Role-based menu visibility
- Admin-only "Users" section
- Responsive sidebar with collapse

### Authentication Pages
- Modern card-based design
- Form validation with error messages
- Password visibility toggle
- Remember me functionality
- Toast notifications for feedback

### Admin Dashboard
- User management table
- Search and filter functionality
- Avatar generation
- Role badges
- Action menus with edit/delete

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   ```bash
   cp .env.example .env
   # Update VITE_API_HOST to your backend URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test API integration:**
   - Navigate to http://localhost:5174
   - Try registering a new user
   - Login with credentials
   - Access protected dashboard
   - Test admin features (if user has admin role)

## 📋 Testing Checklist

- [ ] User registration works
- [ ] User login works with correct credentials
- [ ] Login fails with incorrect credentials  
- [ ] Forgot password sends email
- [ ] Protected routes redirect to login when not authenticated
- [ ] Dashboard shows user info after login
- [ ] Users page shows for admin users only
- [ ] User search and filtering works
- [ ] Delete user functionality works
- [ ] Logout works and clears session
- [ ] Auto-logout works on token expiration
- [ ] Toast notifications appear for actions

## 🐛 Troubleshooting

**CORS Issues:**
- Ensure backend allows frontend origin
- Check VITE_API_HOST is correct

**Token Issues:**
- Check localStorage for auth_token
- Verify JWT format and expiration
- Check network tab for Authorization header

**Role Issues:**
- Verify user roles in backend response
- Check role-based route protection
- Ensure admin role is properly set

## 🔄 Future Enhancements

- Profile page with update functionality  
- User creation form in admin panel
- Bulk user operations
- Advanced filtering and sorting
- User activity logging
- Profile image upload
- Email verification
- Two-factor authentication