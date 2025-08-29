import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { Conversation, Message } from '../models/Message.js';

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Sample data
const sampleStudents = [
  {
    name: 'Alice Johnson',
    email: 'alice.student@example.com',
    password: 'password123',
    role: 'student',
    academicBackground: 'Computer Science',
    currentLevel: 'intermediate',
    learningGoals: ['Web Development', 'Data Structures', 'System Design'],
    bio: 'Passionate computer science student looking to break into tech industry.',
    location: 'San Francisco, CA'
  },
  {
    name: 'Bob Chen',
    email: 'bob.student@example.com',
    password: 'password123',
    role: 'student',
    academicBackground: 'Information Technology',
    currentLevel: 'beginner',
    learningGoals: ['JavaScript', 'React', 'Node.js'],
    bio: 'New to programming, eager to learn modern web technologies.',
    location: 'New York, NY'
  }
];

const sampleMentors = [
  {
    name: 'Dr. Sarah Wilson',
    email: 'sarah.mentor@example.com',
    password: 'password123',
    role: 'mentor',
    expertise: ['Web Development', 'JavaScript', 'React', 'Node.js'],
    experience: 8,
    currentPosition: 'Senior Software Engineer',
    company: 'Google',
    hourlyRate: 150,
    bio: 'Experienced full-stack developer with passion for mentoring the next generation.',
    location: 'Mountain View, CA',
    availability: {
      isAvailable: true,
      schedule: [
        { day: 'monday', startTime: '09:00', endTime: '17:00' },
        { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
        { day: 'friday', startTime: '09:00', endTime: '17:00' }
      ]
    }
  },
  {
    name: 'Michael Rodriguez',
    email: 'michael.mentor@example.com',
    password: 'password123',
    role: 'mentor',
    expertise: ['Data Science', 'Python', 'Machine Learning', 'AI'],
    experience: 12,
    currentPosition: 'Principal Data Scientist',
    company: 'Microsoft',
    hourlyRate: 200,
    bio: 'Data science expert helping students navigate the world of AI and ML.',
    location: 'Seattle, WA',
    availability: {
      isAvailable: true,
      schedule: [
        { day: 'tuesday', startTime: '10:00', endTime: '18:00' },
        { day: 'thursday', startTime: '10:00', endTime: '18:00' },
        { day: 'saturday', startTime: '09:00', endTime: '15:00' }
      ]
    }
  }
];

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Create students
    const students = await User.create(sampleStudents);
    console.log(`👨‍🎓 Created ${students.length} students`);

    // Create mentors
    const mentors = await User.create(sampleMentors);
    console.log(`👨‍🏫 Created ${mentors.length} mentors`);

    return { students, mentors };
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

const seedSessions = async (students, mentors) => {
  try {
    // Clear existing sessions
    await Session.deleteMany({});
    console.log('🗑️  Cleared existing sessions');

    const sampleSessions = [
      {
        student: students[0]._id,
        mentor: mentors[0]._id,
        title: 'React Fundamentals Session',
        description: 'Learn the basics of React including components, props, and state management.',
        topic: 'React Basics',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        duration: 60,
        status: 'approved',
        agenda: [
          { item: 'Introduction to React', completed: false },
          { item: 'Components and JSX', completed: false },
          { item: 'Props and State', completed: false }
        ]
      },
      {
        student: students[0]._id,
        mentor: mentors[0]._id,
        title: 'JavaScript Deep Dive',
        description: 'Advanced JavaScript concepts including closures, promises, and async/await.',
        topic: 'Advanced JavaScript',
        scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        duration: 90,
        status: 'completed',
        actualStartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        actualEndTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        feedback: {
          studentFeedback: {
            rating: 5,
            comment: 'Excellent session! Sarah explained complex concepts very clearly.',
            submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        student: students[1]._id,
        mentor: mentors[1]._id,
        title: 'Python for Data Science',
        description: 'Introduction to Python libraries for data analysis and visualization.',
        topic: 'Data Science Basics',
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        duration: 120,
        status: 'pending'
      },
      {
        student: students[1]._id,
        mentor: mentors[0]._id,
        title: 'Web Development Career Guidance',
        description: 'Discussion about career paths in web development and industry insights.',
        topic: 'Career Guidance',
        scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        duration: 45,
        status: 'approved'
      }
    ];

    const sessions = await Session.create(sampleSessions);
    console.log(`📅 Created ${sessions.length} sessions`);

    // Update user statistics
    for (const mentor of mentors) {
      const mentorSessions = sessions.filter(s => s.mentor.toString() === mentor._id.toString());
      const completedSessions = mentorSessions.filter(s => s.status === 'completed');
      const ratings = completedSessions
        .filter(s => s.feedback?.studentFeedback?.rating)
        .map(s => s.feedback.studentFeedback.rating);
      
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      await User.findByIdAndUpdate(mentor._id, {
        'stats.totalSessions': mentorSessions.length,
        'stats.completedSessions': completedSessions.length,
        'stats.averageRating': Math.round(averageRating * 10) / 10,
        'stats.totalRatings': ratings.length
      });
    }

    console.log('📊 Updated user statistics');
    return sessions;
  } catch (error) {
    console.error('❌ Error seeding sessions:', error);
    throw error;
  }
};

const seedData = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting data seeding...');
    
    const { students, mentors } = await seedUsers();
    const sessions = await seedSessions(students, mentors);
    
    console.log('✅ Data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Mentors: ${mentors.length}`);
    console.log(`   - Sessions: ${sessions.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData();
}

export default seedData;
