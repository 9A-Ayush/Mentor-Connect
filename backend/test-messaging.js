import mongoose from 'mongoose';
import User from './models/User.js';
import { Message, Conversation } from './models/Message.js';
import dotenv from 'dotenv';

dotenv.config();

const testMessaging = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Get test users
    const student = await User.findOne({ role: 'student' });
    const mentor = await User.findOne({ role: 'mentor' });

    if (!student || !mentor) {
      console.log('❌ No test users found. Run seed script first.');
      return;
    }

    console.log('📊 Test Users:');
    console.log(`Student: ${student.name} (${student._id})`);
    console.log(`Mentor: ${mentor.name} (${mentor._id})`);

    // Test conversation creation
    console.log('\n🔄 Testing conversation creation...');

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      $and: [
        { 'participants.user': student._id },
        { 'participants.user': mentor._id }
      ]
    });

    if (conversation) {
      console.log('✅ Conversation already exists:', conversation._id);
    } else {
      // Create new conversation
      conversation = new Conversation({
        participants: [
          { user: student._id, role: student.role },
          { user: mentor._id, role: mentor.role }
        ],
        title: `${student.name} & ${mentor.name}`,
        isActive: true
      });

      await conversation.save();
      console.log('✅ New conversation created:', conversation._id);
    }

    // Test message creation
    console.log('\n💬 Testing message creation...');

    const testMessage = new Message({
      conversation: conversation._id,
      sender: student._id,
      content: 'Hello! This is a test message.',
      messageType: 'text',
      readBy: [{ user: student._id, readAt: new Date() }]
    });

    await testMessage.save();
    console.log('✅ Test message created:', testMessage._id);

    // Update conversation with last message
    conversation.lastMessage = {
      content: testMessage.content,
      sender: student._id,
      timestamp: testMessage.createdAt,
      messageType: 'text'
    };
    await conversation.save();

    console.log('✅ Conversation updated with last message');

    // Test population
    console.log('\n🔄 Testing data population...');

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email avatar role');

    console.log('✅ Populated conversation:', {
      id: populatedConversation._id,
      title: populatedConversation.title,
      participants: populatedConversation.participants.map(p => ({
        name: p.user.name,
        role: p.user.role
      }))
    });

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    console.log('✅ Messages found:', messages.length);
    messages.forEach(msg => {
      console.log(`  - ${msg.sender.name}: ${msg.content}`);
    });

    console.log('\n🎉 All messaging tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the test
testMessaging();
