# Mentor Connect: MERN + Vite Project

## 📌 Overview
**Mentor Connect** is a web-based platform built with the **MERN stack (MongoDB, Express.js, React.js, Node.js) and Vite** to provide structured academic and career mentorship.  
The platform bridges the gap between students and mentors by enabling connections based on domain expertise, academic background, or project needs.  

The project focuses on delivering a **Minimum Viable Product (MVP)** that provides essential mentorship functionalities while ensuring scalability for future enhancements.

---

## 🎯 Problem Statement
Students often face challenges in finding the right academic or career mentors. Traditional communication platforms are either generic or lack features tailored to structured mentorship.  
There is a need for a dedicated platform where students can connect with qualified mentors, request sessions, exchange messages, and receive personalized guidance.

---

## 🎯 Objectives
1. Enable **role-based authentication** for students and mentors.  
2. Provide **mentor discovery** with profiles based on domain expertise.  
3. Allow students to **book/request mentorship sessions** with mentors.  
4. Offer a **chat feature** for mentor-student communication.  
5. Track mentorship **progress and feedback** in a structured way.  
6. Ensure fast, responsive UI with **React + Vite** and scalable backend with **Node.js + Express + MongoDB**.

---

## ⚡ MVP Features
### 🔐 Authentication
- Login & Signup for students and mentors.
- Role-based dashboards.

### 👤 User Profiles
- Student: name, email, academic background, enrolled sessions.  
- Mentor: name, email, domain expertise, availability.  

### 📅 Session Management
- Students can request/book sessions with mentors.  
- Mentors can accept/reject requests.  
- Track upcoming & past sessions.  

### 💬 Messaging
- Real-time student-mentor chat (text-based).  
- Conversation history.  

### 📊 Feedback & Tracking
- Students can rate & give feedback after sessions.  
- Mentors can provide progress notes.  

---

## 📑 Pages & Navigation

### 1. Authentication Pages
- **Login Page**: Email/password login, role-based redirect.  
- **Signup Page**: Student & Mentor signup with relevant details.  

### 2. Dashboard
- **Student Dashboard**: View mentors, request sessions, chat, progress.  
- **Mentor Dashboard**: Manage requests, set availability, chat.  

### 3. Mentor Directory
- Search/filter mentors by expertise.  
- View mentor profile & request mentorship.  

### 4. Session Management
- Track booked sessions.  
- Approve/reject requests.  
- Simple session calendar.  

### 5. Chat Page
- Real-time chat (student ↔ mentor).  
- Notifications for new messages.  

### 6. Feedback & Progress
- Student feedback after session.  
- Mentor progress notes.  

### 7. Profile & Settings
- Update user details.  
- Manage availability (mentor).  
- Change password / account settings.  

---

## 🛠 Tech Stack
- **Frontend**: React.js (with Vite for fast bundling)  
- **Backend**: Node.js + Express.js  
- **Database**: MongoDB (Atlas or local)  
- **Authentication**: JWT (JSON Web Token)  
- **Styling**: Tailwind CSS  
- **Real-time Chat**: Socket.IO (or Firebase, optional for MVP)  

---

## 🚀 Future Scope
- Video/audio mentorship sessions.  
- AI-powered mentor recommendation engine.  
- Group mentorship sessions & forums.  
- Calendar integration (Google/Outlook).  
- Certificate of mentorship completion.  
- Mobile app version (React Native).  

---

## 📂 Project Flow (Sitemap)

```
Login → Role Check
   ├── Student Dashboard
   │      ├── Mentor Directory → Mentor Profile → Request Session
   │      ├── My Sessions (upcoming/past)
   │      ├── Chat with Mentor
   │      └── Feedback & Progress
   │
   └── Mentor Dashboard
          ├── Session Requests (approve/reject)
          ├── My Availability
          ├── Chat with Students
          └── Feedback & Notes
```

---

## ✅ MVP Goal
Deliver a **functional, role-based mentorship platform** where:  
- Students can discover mentors, request sessions, and chat.  
- Mentors can manage requests and communicate with students.  
- Feedback and progress tracking ensure structured mentorship.
