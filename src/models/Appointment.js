const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  businessId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Businesses',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'scheduled', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  purpose: {
    type: DataTypes.STRING,
    allowNull: false
  },
  meetingTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in minutes'
  },
  attendeeEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attendeeName: {
    type: DataTypes.STRING,
    allowNull: true
  },

  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'Appointments'
});

module.exports = Appointment;