# 🎓 Mentor Connect - Complete Mentoring Platform

> Empowering learning through meaningful mentorship connections 🚀

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green?logo=mongodb)
![Chakra UI](https://img.shields.io/badge/Chakra_UI-2.x-blue?logo=chakraui)

---

## 📚 Table of Contents
- [✨ Features](#-features)
- [🚀 Tech Stack](#-tech-stack)
- [📦 Installation](#-installation)
- [🎯 Usage](#-usage)
- [📱 Key Pages](#-key-pages)
- [🔧 API Endpoints](#-api-endpoints)
- [🎨 Design System](#-design-system)
- [🔒 Security Features](#-security-features)
- [📊 Database Schema](#-database-schema)
- [🚀 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [📈 Performance](#-performance)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🎉 Acknowledgments](#-acknowledgments)

---

## ✨ Features

### 🔐 Authentication & User Management
- Secure **JWT-based authentication**
- **Role-based access control** (Student/Mentor)
- Profile management with **photo uploads**
- Password encryption & security

### 📊 Enhanced Dashboards
- **Student Dashboard**: Sessions, mentor discovery, progress analytics
- **Mentor Dashboard**: Metrics, earnings, availability management
- Real-time statistics & quick actions

### 💬 Real-time Messaging
- Instant messaging, conversation history, unread indicators
- File sharing & user search

### 📅 Session Management
- Booking workflow, status tracking, calendar integration
- Feedback & rating system

### 👥 Mentor Directory
- Advanced search & filters (expertise, price, availability)
- Ratings & reviews, direct booking

### 📁 File Management
- Cloudinary-powered uploads, secure handling, image optimization

### 🎨 Modern UI/UX
- Responsive design, dark/light mode, animations
- Built with **Chakra UI** components

---

## 🚀 Tech Stack

**Backend:**  
`Node.js` · `Express.js` · `MongoDB` · `Mongoose` · `JWT` · `Cloudinary` · `bcrypt`

**Frontend:**  
`React` · `Chakra UI` · `React Router` · `Axios` · `React Dropzone`

---

## 📦 Installation

### Prerequisites
- Node.js (v14+)
- MongoDB
- Cloudinary account

### Backend Setup
```bash
cd backend
npm install
```
Create `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mentor-connects
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
Run backend:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 Usage

### For Students
1. Sign up as **Student**
2. Complete profile
3. Browse mentors
4. Book sessions
5. Chat in real-time
6. Track progress

### For Mentors
1. Sign up as **Mentor**
2. Set expertise & rates
3. Manage availability
4. Receive session requests
5. Conduct sessions
6. Track earnings

---

## 📱 Key Pages

| Page | Path | Description |
|------|------|-------------|
| Student Dashboard | `/dashboard` | Overview, sessions, mentors, progress |
| Mentor Dashboard | `/dashboard` | Metrics, requests, earnings |
| Profile Settings | `/profile` | Edit profile, upload photo |
| Chat | `/chat` | Real-time messaging |
| Sessions | `/sessions` | Manage sessions |
| Mentor Directory | `/mentors` | Browse/book mentors |

---

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` → Register user
- `POST /api/auth/login` → Login user
- `PUT /api/auth/profile` → Update profile

### Sessions
- `GET /api/sessions` → Get sessions
- `POST /api/sessions/book` → Book session
- `PUT /api/sessions/:id/status` → Update status

### Messages
- `GET /api/messages/conversations` → Get conversations
- `POST /api/messages/send` → Send message
- `POST /api/messages/start-conversation` → Start chat

### File Uploads
- `POST /api/upload/profile-picture` → Upload avatar
- `POST /api/upload/file` → Upload file
- `DELETE /api/upload/:publicId` → Delete file

---

## 🎨 Design System

**Colors:**  
Primary: `#3182CE` | Secondary: `#805AD5` | Accent: `#319795` | Success: `#38A169` | Warning: `#D69E2E` | Error: `#E53E3E`

**Components:**  
Card-based layouts, professional forms, interactive buttons, responsive grid, modals

---

## 🔒 Security Features
- JWT authentication
- Bcrypt password hashing
- Input validation
- File upload security
- Rate limiting
- CORS config
- Role-based access

---

## 📊 Database Schema

**User Model**
```js
{
  name: String,
  email: String,
  password: String,
  role: ['student', 'mentor'],
  avatar: { url: String, publicId: String, variants: Object }
}
```

**Session Model**
```js
{
  student: ObjectId,
  mentor: ObjectId,
  topic: String,
  scheduledDate: Date,
  duration: Number,
  status: ['pending', 'confirmed', 'completed', 'cancelled'],
  price: Number,
  feedback: Object
}
```

---

## 🚀 Deployment

**Backend:** MongoDB Atlas + Heroku/Railway/DigitalOcean  
**Frontend:** Vercel/Netlify  
Set production `.env` and API base URL

---

## 🧪 Testing
- Authentication flow
- Profile updates
- Booking sessions
- Messaging
- File uploads

Test accounts:  
- Student → `alice.student@example.com` / `password123`  
- Mentor → `john.mentor@example.com` / `password123`

---

## 📈 Performance
- Cloudinary CDN for images
- React code splitting
- API caching
- Minified bundles

---

## 🤝 Contributing
1. Fork repo
2. Create feature branch
3. Commit & push
4. Submit PR

---

## 📄 License
MIT License — see [LICENSE](LICENSE) file

---

## 🎉 Acknowledgments
- Chakra UI
- Cloudinary
- MongoDB
- React community
