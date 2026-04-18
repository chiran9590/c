# 🚀 Production Deployment Guide

## HealthMaps Authentication System

This guide covers deploying the production-ready authentication system with React, Tailwind CSS, and Supabase.

---

## 📋 Prerequisites

### Development Environment:
- Node.js 18+ 
- npm or yarn
- Git
- Supabase account

### Production Environment:
- Vercel, Netlify, or similar hosting platform
- Supabase project
- Custom domain (recommended)

---

## 🔧 Step 1: Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and anon key

### 2. Database Configuration
Run these SQL files in Supabase SQL Editor:

```sql
-- 1. Main auth setup
-- Run auth-setup.sql

-- 2. Additional profile configurations  
-- Run profiles-table-setup.sql
```

### 3. Authentication Settings
In Supabase Dashboard → Authentication → Settings:

```bash
# Configure these settings:
Site URL: https://your-domain.com
Redirect URLs: 
  - https://your-domain.com/**
  - http://localhost:5173/** (for development)

Email Templates: Customize as needed
```

### 4. Create Admin Account
```sql
-- Create first admin manually
INSERT INTO profiles (id, full_name, email, role)
VALUES (
  'uuid_from_auth_users', 
  'Admin User', 
  'admin@yourdomain.com', 
  'admin'
);
```

---

## 🔧 Step 2: Application Configuration

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Configure with your Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Build Application
```bash
npm run build
# or  
yarn build
```

---

## 🚀 Step 3: Deployment Options

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI
```bash
npm i -g vercel
```

#### 2. Deploy
```bash
# From project root
vercel

# Follow prompts:
# - Link to existing project or create new
# - Import environment variables
# - Deploy to production
```

#### 3. Environment Variables in Vercel
```bash
# Set environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

### Option 2: Netlify

#### 1. Build Configuration
Create `netlify.toml`:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 2. Deploy
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### 3. Environment Variables
Set in Netlify dashboard: Site settings → Build & deploy → Environment

---

## 🔒 Step 4: Production Security

### 1. Domain Configuration
```bash
# Configure custom domain
# Set up SSL certificate
# Update Supabase auth settings
```

### 2. Security Headers
Add security headers in your hosting platform:

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

### 3. Monitoring Setup
- Enable error tracking (Sentry, etc.)
- Set up uptime monitoring
- Configure security alerts

---

## ✅ Step 5: Post-Deployment Checklist

### Functionality Testing:
- [ ] User registration works
- [ ] Email verification received
- [ ] Client login redirects to `/dashboard`
- [ ] Admin login redirects to `/admin`
- [ ] Role-based access control working
- [ ] Logout functionality works
- [ ] Password reset works

### Security Testing:
- [ ] RLS policies active
- [ ] Admin accounts not accessible via registration
- [ ] Unauthorized routes properly redirect
- [ ] Environment variables secure
- [ ] No sensitive data in client bundles

### Performance Testing:
- [ ] Page load times acceptable
- [ ] Authentication flows responsive
- [ ] Mobile experience optimized

---

## 🔄 Step 6: Maintenance

### Regular Tasks:
1. **Security Updates**
   ```bash
   npm audit fix
   npm update
   ```

2. **Database Maintenance**
   - Monitor user growth
   - Clean up expired sessions
   - Backup regularly

3. **Monitoring**
   - Check error logs
   - Monitor authentication metrics
   - Review security alerts

### Scaling Considerations:
- Database performance optimization
- CDN configuration for static assets
- Load balancing for high traffic
- Caching strategies

---

## 🆘 Troubleshooting

### Common Deployment Issues:

**Issue**: Authentication not working in production
**Solution**: 
- Check environment variables
- Verify Supabase URL configuration
- Ensure redirect URLs match domain

**Issue**: CORS errors
**Solution**:
- Update Supabase CORS settings
- Check API configuration
- Verify domain setup

**Issue**: Build failures
**Solution**:
- Check Node.js version compatibility
- Verify all dependencies installed
- Review build logs for errors

---

## 📞 Support Resources

### Documentation:
- [Supabase Documentation](https://supabase.com/docs)
- [React Router Documentation](https://reactrouter.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)

### Security:
- [OWASP Authentication Guidelines](https://owasp.org/www-community/controls/Authentication)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)

---

## 🎯 Success Metrics

Monitor these metrics post-deployment:
- User registration conversion rate
- Login success rate
- Session duration
- Error rates
- Page load performance

---

*Deploy with confidence! This authentication system is production-ready with comprehensive security measures.*
