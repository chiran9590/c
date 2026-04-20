# Health Maps Deployment Guide

## Overview
Health Maps is a complete web application with role-based authentication, club management, and file upload system using React.js, Supabase, and Cloudflare R2 storage.

## Tech Stack
- **Frontend**: React.js with TypeScript, Tailwind CSS
- **Backend**: Supabase (Authentication + Database)
- **Storage**: Cloudflare R2 (via Cloudflare Worker)
- **State Management**: React Context API
- **Routing**: React Router DOM

## Database Schema

### 1. Enable UUID Support
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2. Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Clubs Table
```sql
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Club Members (Mapping Table)
```sql
CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, club_id)
);
```

### 5. Uploads Table
```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Application Features

### Authentication System
- **User Registration**: Name, email, phone, password, role selection
- **Login**: Email/password authentication
- **Role-based Access**: Admin and Client roles
- **Automatic Profile Creation**: Trigger creates profile on user signup

### Client Dashboard
- Display assigned clubs from `club_members` table
- View uploaded files for each club
- Download/view files
- User profile information

### Admin Dashboard
- **User Management**: View all users, roles, and creation dates
- **Club Management**: Create clubs, assign users to clubs
- **File Upload System**: Upload files to specific clubs, manage all uploads
- **Role-based Access Control**: Only admins can access admin features

### File Upload System
- Cloudflare R2 integration via Worker
- Automatic folder creation per club
- File metadata storage in Supabase
- File deletion functionality

## Setup Instructions

### 1. Database Setup
1. Run the complete schema: `complete_health_maps_schema.sql`
2. Verify all tables are created with proper relationships
3. Check RLS policies are enabled

### 2. Environment Variables
Create `.env` file with:
```
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudflare R2 Configuration
VITE_CLOUDFLARE_WORKER_URL=your_cloudflare_worker_url
```

### 3. Cloudflare Worker Setup
Create a Cloudflare Worker with the following endpoints:
- `POST /upload` - Upload files to R2
- `POST /delete` - Delete files from R2
- `GET /files/:path` - Serve files from R2

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Development Server
```bash
npm run dev
```

## Routing Flow
1. **Register** → **Login** → **Role-based Redirect**
   - Admin → `/admin` (Admin Dashboard)
   - Client → `/dashboard` (Client Dashboard)

2. **Protected Routes**:
   - `/admin` - Admin only
   - `/dashboard` - Client only
   - Unauthenticated users redirected to `/login`

## Key Components

### Authentication Services
- `healthMapsAuthService.ts` - User authentication and profile management
- `HealthMapsAuthContext.tsx` - Authentication state management

### Business Logic Services
- `clubsService.ts` - Club and membership management
- `uploadService.ts` - File upload and Cloudflare integration

### UI Components
- `HealthMapsLogin.tsx` - Login page
- `HealthMapsRegister.tsx` - Registration page
- `HealthMapsClientDashboard.tsx` - Client dashboard
- `HealthMapsAdminDashboard.tsx` - Admin dashboard
- `HealthMapsRoleBasedRoutes.tsx` - Route protection

## Database Relationships

### Proper Normalization
- ✅ No duplicate tables (single clubs table)
- ✅ Mapping table for user-club relationships
- ✅ No club_id in users table
- ✅ Proper foreign key constraints

### Relationships
1. `profiles` ← `auth.users` (1:1)
2. `profiles` → `clubs` (1:many - created_by)
3. `profiles` ← `club_members` → `clubs` (many:many)
4. `clubs` ← `uploads` (1:many)
5. `profiles` → `uploads` (1:many - uploaded_by)

## Error Handling
- Form validation on registration and login
- Duplicate user prevention
- File upload error handling
- Network error handling
- User-friendly error messages

## Security Features
- Row Level Security (RLS) on all tables
- Role-based access control
- Input validation and sanitization
- Secure file upload handling
- Proper authentication state management

## Production Deployment
1. Build the application: `npm run build`
2. Deploy to your preferred hosting platform
3. Ensure environment variables are properly configured
4. Test all authentication flows
5. Verify file upload functionality

## Testing Checklist
- [ ] User registration works for both roles
- [ ] Login redirects correctly based on role
- [ ] Admin can create clubs and assign users
- [ ] Client can see assigned clubs and files
- [ ] File upload and download work correctly
- [ ] All RLS policies are working
- [ ] Error handling is comprehensive

## Troubleshooting
1. **Authentication Issues**: Check Supabase configuration and RLS policies
2. **Database Errors**: Verify schema and relationships
3. **Upload Issues**: Check Cloudflare Worker configuration
4. **Routing Problems**: Verify role-based route protection
