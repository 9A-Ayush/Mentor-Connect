# 🧪 Mentor Connect - Complete Testing Guide

This guide will help you test all the features of the Mentor Connect platform to ensure everything is working properly.

## 🚀 Quick Start Testing

### 1. **Access the Application**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### 2. **Test Accounts (Pre-seeded)**
```
Students:
- alice.student@example.com / password123
- bob.student@example.com / password123

Mentors:
- sarah.mentor@example.com / password123
- john.mentor@example.com / password123
- emily.mentor@example.com / password123
```

## 📋 Feature Testing Checklist

### ✅ **Authentication System**
- [ ] **Sign Up** - Create new student and mentor accounts
- [ ] **Login** - Test with seeded accounts
- [ ] **Logout** - Ensure proper session cleanup
- [ ] **Role-based Access** - Students can't access mentor-only pages
- [ ] **Protected Routes** - Redirects to login when not authenticated

### ✅ **Student Dashboard**
- [ ] **Statistics Display** - Shows session count, mentors, progress
- [ ] **Recent Sessions** - Displays upcoming and past sessions
- [ ] **Top Mentors** - Shows mentor recommendations
- [ ] **Quick Actions** - All buttons work and navigate correctly
- [ ] **Book Session Button** - Opens booking modal
- [ ] **Navigation Links** - All sidebar links work

### ✅ **Mentor Dashboard**
- [ ] **Performance Metrics** - Shows earnings, ratings, sessions
- [ ] **Session Management** - Recent sessions display
- [ ] **Availability Toggle** - Can update availability status
- [ ] **Quick Actions** - All action buttons functional
- [ ] **Student Overview** - Shows recent student interactions

### ✅ **Profile Management**
- [ ] **Profile Settings Page** - Accessible via /profile
- [ ] **Basic Info Editing** - Name, bio, location updates
- [ ] **Profile Picture Upload** - Drag & drop image upload
- [ ] **Role-specific Fields** - Different forms for students/mentors
- [ ] **Save Changes** - Updates persist after refresh

### ✅ **Session Management**
- [ ] **Sessions Page** - Accessible via /sessions
- [ ] **Session Tabs** - All, Upcoming, Completed, Cancelled
- [ ] **Session Cards** - Display all session information
- [ ] **Session Actions** - Join, message, reschedule, cancel
- [ ] **Session Status** - Proper status indicators and colors

### ✅ **Mentor Directory**
- [ ] **Browse Mentors** - Accessible via /mentors
- [ ] **Search Functionality** - Search by name, skills, company
- [ ] **Filter System** - Price, experience, availability filters
- [ ] **Mentor Cards** - Complete mentor information display
- [ ] **Book Session** - Opens booking modal from mentor card
- [ ] **Send Message** - Initiates conversation with mentor

### ✅ **Messaging System**
- [ ] **Chat Page** - Accessible via /chat
- [ ] **Conversation List** - Shows all conversations
- [ ] **Start New Chat** - Search and start conversations
- [ ] **Real-time Messaging** - Send and receive messages
- [ ] **Message Features** - Reply, delete, file sharing
- [ ] **Unread Indicators** - Shows unread message counts

### ✅ **Session Requests (Mentors Only)**
- [ ] **Requests Page** - Accessible via /session-requests
- [ ] **Request Tabs** - Pending, Accepted, Rejected, All
- [ ] **Request Cards** - Complete request information
- [ ] **Accept/Reject** - Respond to session requests
- [ ] **Response Modal** - Send messages and propose times

### ✅ **File Upload System**
- [ ] **Profile Pictures** - Upload and display avatars
- [ ] **Drag & Drop** - Intuitive file upload interface
- [ ] **File Validation** - Proper error handling for invalid files
- [ ] **Image Optimization** - Multiple sizes generated
- [ ] **File Management** - Delete and replace files

## 🔧 **API Testing**

### Test API Endpoints Manually:

```bash
# Health Check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice.student@example.com","password":"password123"}'

# Get Dashboard (replace TOKEN with actual JWT)
curl http://localhost:5000/api/users/dashboard \
  -H "Authorization: Bearer TOKEN"

# Get Mentors
curl http://localhost:5000/api/users/mentors \
  -H "Authorization: Bearer TOKEN"
```

## 🎯 **User Flow Testing**

### **Student Journey:**
1. **Sign up** as a new student
2. **Complete profile** with academic background
3. **Browse mentor directory** and use filters
4. **Book a session** with a mentor
5. **Send a message** to the mentor
6. **View dashboard** to see session status
7. **Upload profile picture**

### **Mentor Journey:**
1. **Sign up** as a new mentor
2. **Set up profile** with expertise and rates
3. **Set availability** status
4. **View session requests** from students
5. **Accept/reject requests** with messages
6. **View dashboard** metrics
7. **Manage sessions** and communicate with students

## 🐛 **Common Issues & Solutions**

### **Frontend Issues:**
- **White screen**: Check browser console for errors
- **API errors**: Ensure backend is running on port 5000
- **Login issues**: Verify test account credentials
- **Upload errors**: Check Cloudinary configuration

### **Backend Issues:**
- **Database connection**: Ensure MongoDB is running
- **Missing data**: Run the seed script: `node scripts/seedData.js`
- **CORS errors**: Check frontend URL in CORS configuration
- **File upload errors**: Verify Cloudinary credentials

### **Network Issues:**
- **API not responding**: Check if backend server is running
- **Slow responses**: Check database connection and queries
- **Upload failures**: Verify Cloudinary account limits

## 📊 **Performance Testing**

### **Load Testing:**
- [ ] **Multiple users** - Test with several concurrent users
- [ ] **File uploads** - Upload multiple files simultaneously
- [ ] **Database queries** - Check response times for large datasets
- [ ] **Real-time messaging** - Test chat with multiple conversations

### **Browser Testing:**
- [ ] **Chrome** - Primary testing browser
- [ ] **Firefox** - Cross-browser compatibility
- [ ] **Safari** - macOS compatibility
- [ ] **Mobile browsers** - Responsive design testing

## 🔍 **Security Testing**

### **Authentication:**
- [ ] **JWT expiration** - Test token expiry handling
- [ ] **Role permissions** - Verify role-based access control
- [ ] **Password security** - Ensure passwords are hashed
- [ ] **Input validation** - Test with malicious inputs

### **File Upload Security:**
- [ ] **File type validation** - Try uploading executable files
- [ ] **File size limits** - Test with oversized files
- [ ] **Malicious files** - Ensure proper file scanning

## ✅ **Final Verification**

### **All Systems Working:**
- [ ] Authentication system functional
- [ ] Both dashboards displaying data
- [ ] Profile management working
- [ ] Session booking operational
- [ ] Messaging system active
- [ ] File uploads successful
- [ ] All navigation working
- [ ] API endpoints responding
- [ ] Database operations successful
- [ ] Error handling graceful

## 🎉 **Success Criteria**

**The platform is fully functional when:**
1. ✅ All test accounts can login successfully
2. ✅ Dashboards display real data and statistics
3. ✅ Session booking workflow completes end-to-end
4. ✅ Real-time messaging works between users
5. ✅ File uploads work with proper optimization
6. ✅ All navigation and routing functions correctly
7. ✅ API endpoints return expected responses
8. ✅ Error states are handled gracefully
9. ✅ Mobile responsive design works properly
10. ✅ Performance is acceptable for typical usage

---

## 🚀 **Ready for Production!**

When all tests pass, the Mentor Connect platform is ready for:
- **Production deployment**
- **Real user testing**
- **Marketing and launch**
- **Scaling and optimization**

**Happy Testing! 🎯**
