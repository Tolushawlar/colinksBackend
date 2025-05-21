const User = require('./User');
const Business = require('./Business');
const BusinessPost = require('./BusinessPost');
const Appointment = require('./Appointment');
const ChatMessage = require('./ChatMessage');
const Post = require('./Post');

// Define relationships after tables are created
const defineRelationships = () => {
  // User relationships
  User.hasMany(Business, { foreignKey: 'ownerId', as: 'businesses' });
  Business.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

  // Business relationships
  Business.hasMany(BusinessPost, { foreignKey: 'businessId', as: 'posts' });
  BusinessPost.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

  // Appointment relationships
  User.hasMany(Appointment, { foreignKey: 'userId', as: 'appointments' });
  Appointment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Business.hasMany(Appointment, { foreignKey: 'businessId', as: 'appointments' });
  Appointment.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

  // Chat relationships
  User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });
  ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
  User.hasMany(ChatMessage, { foreignKey: 'recipientId', as: 'receivedMessages' });
  ChatMessage.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

  // Post relationships
  User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
  Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });
};

module.exports = {
  User,
  Business,
  BusinessPost,
  Appointment,
  ChatMessage,
  Post,
  defineRelationships
};