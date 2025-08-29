# 🚀 Deployment Guide - Mentor Connect

Complete guide to deploy the Mentor Connect platform to production.

## 📋 Pre-deployment Checklist

### ✅ **Environment Setup**
- [ ] MongoDB Atlas account created
- [ ] Cloudinary account configured
- [ ] Domain name registered (optional)
- [ ] SSL certificate ready
- [ ] Environment variables documented

### ✅ **Code Preparation**
- [ ] All features tested locally
- [ ] Environment variables configured
- [ ] Database seeded with test data
- [ ] API endpoints documented
- [ ] Frontend build optimized

## 🗄️ Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Account
```bash
# Visit: https://www.mongodb.com/atlas
# Create free tier cluster
# Get connection string
```

### 2. Configure Database
```javascript
// Connection string format:
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mentor-connects
```

### 3. Set Up Collections
```bash
# Collections will be created automatically:
- users
- sessions  
- messages
- conversations
```

## ☁️ Cloudinary Setup

### 1. Create Cloudinary Account
```bash
# Visit: https://cloudinary.com
# Get API credentials from dashboard
```

### 2. Configure Upload Presets
```javascript
// Create upload presets:
- profile-pictures (200x200, face detection)
- session-materials (auto optimization)
- general-files (format auto, quality auto)
```

## 🖥️ Backend Deployment

### Option 1: Railway (Recommended)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and initialize
railway login
railway init

# 3. Set environment variables
railway variables set NODE_ENV=production
railway variables set MONGODB_URI=your-mongodb-connection-string
railway variables set JWT_SECRET=your-super-secret-key
railway variables set CLOUDINARY_CLOUD_NAME=your-cloud-name
railway variables set CLOUDINARY_API_KEY=your-api-key
railway variables set CLOUDINARY_API_SECRET=your-api-secret

# 4. Deploy
railway up
```

### Option 2: Heroku
```bash
# 1. Install Heroku CLI
# 2. Create app
heroku create mentor-connects-api

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-connection-string
heroku config:set JWT_SECRET=your-super-secret-key
heroku config:set CLOUDINARY_CLOUD_NAME=your-cloud-name
heroku config:set CLOUDINARY_API_KEY=your-api-key
heroku config:set CLOUDINARY_API_SECRET=your-api-secret

# 4. Deploy
git push heroku main
```

### Option 3: DigitalOcean App Platform
```yaml
# app.yaml
name: mentor-connects-api
services:
- name: api
  source_dir: /backend
  github:
    repo: your-username/mentor-connects
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: MONGODB_URI
    value: your-mongodb-connection-string
  - key: JWT_SECRET
    value: your-super-secret-key
```

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Build and deploy
cd frontend
npm run build
vercel

# 3. Set environment variables in Vercel dashboard
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Option 2: Netlify
```bash
# 1. Build project
cd frontend
npm run build

# 2. Deploy to Netlify
# - Drag and drop dist folder to Netlify
# - Or connect GitHub repository

# 3. Set environment variables
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Option 3: GitHub Pages
```bash
# 1. Install gh-pages
npm install --save-dev gh-pages

# 2. Add to package.json
"homepage": "https://yourusername.github.io/mentor-connects",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# 3. Deploy
npm run deploy
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mentor-connects

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRE=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend (.env)
```env
# API Configuration
VITE_API_BASE_URL=https://your-api-domain.com/api

# App Configuration
VITE_APP_NAME=Mentor Connect
VITE_APP_VERSION=1.0.0
```

## 🔒 Security Configuration

### 1. CORS Setup
```javascript
// backend/server.js
const corsOptions = {
  origin: [
    'https://your-frontend-domain.com',
    'https://www.your-frontend-domain.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 2. Rate Limiting
```javascript
// Already configured in server.js
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### 3. Security Headers
```javascript
// Add helmet for security headers
const helmet = require('helmet');
app.use(helmet());
```

## 📊 Monitoring & Analytics

### 1. Error Tracking
```bash
# Add Sentry for error tracking
npm install @sentry/node @sentry/react
```

### 2. Performance Monitoring
```bash
# Add performance monitoring
npm install @sentry/tracing
```

### 3. Analytics
```bash
# Add Google Analytics
npm install react-ga4
```

## 🧪 Production Testing

### 1. API Testing
```bash
# Test all endpoints
curl https://your-api-domain.com/api/health
curl -X POST https://your-api-domain.com/api/auth/login
```

### 2. Frontend Testing
```bash
# Test all pages
- Authentication flow
- Dashboard functionality
- File uploads
- Real-time messaging
- Session booking
```

### 3. Performance Testing
```bash
# Use tools like:
- Google PageSpeed Insights
- GTmetrix
- WebPageTest
- Lighthouse
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Railway
      run: |
        npm install -g @railway/cli
        railway login --token ${{ secrets.RAILWAY_TOKEN }}
        railway up

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Vercel
      run: |
        npm install -g vercel
        vercel --token ${{ secrets.VERCEL_TOKEN }} --prod
```

## 📈 Scaling Considerations

### 1. Database Optimization
- Index frequently queried fields
- Implement database connection pooling
- Consider read replicas for high traffic

### 2. CDN Setup
- Use Cloudinary CDN for images
- Consider CloudFlare for static assets
- Implement browser caching

### 3. Load Balancing
- Use multiple server instances
- Implement session clustering
- Consider Redis for session storage

## 🚨 Troubleshooting

### Common Issues

#### 1. CORS Errors
```javascript
// Ensure frontend URL is in CORS whitelist
const corsOptions = {
  origin: ['https://your-frontend-domain.com'],
  credentials: true
};
```

#### 2. Environment Variables
```bash
# Check all required variables are set
echo $MONGODB_URI
echo $JWT_SECRET
echo $CLOUDINARY_CLOUD_NAME
```

#### 3. Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📞 Support

### Resources
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)

### Monitoring
- Set up uptime monitoring
- Configure error alerts
- Monitor performance metrics
- Track user analytics

---

**Your Mentor Connect platform is now ready for production! 🎉**

Remember to:
- ✅ Test thoroughly before going live
- ✅ Set up monitoring and alerts
- ✅ Have a backup and recovery plan
- ✅ Document any custom configurations
- ✅ Plan for regular updates and maintenance
