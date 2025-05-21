const sequelize = require('../config/database');
const { defineRelationships } = require('../models');

// Function to initialize database
const initializeDatabase = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Check if this is the first run
    try {
      // Try to query the Users table to see if it exists
      await sequelize.query('SELECT 1 FROM Users LIMIT 1');
      console.log('Database tables already exist, skipping initialization');
      
      // Define relationships for existing tables
      defineRelationships();
      
      return true;
    } catch (error) {
      // Tables don't exist, create them
      console.log('Creating database tables...');
      
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Create tables in dependency order
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`Users\` (
          \`id\` CHAR(36) BINARY PRIMARY KEY,
          \`email\` VARCHAR(255) NOT NULL UNIQUE,
          \`password\` VARCHAR(255) NOT NULL,
          \`displayName\` VARCHAR(255),
          \`bio\` TEXT,
          \`avatarUrl\` VARCHAR(255),
          \`website\` VARCHAR(255),
          \`industry\` VARCHAR(255),
          \`interests\` JSON,
          \`accountType\` ENUM('partnership', 'sponsorship'),
          \`role\` ENUM('user', 'business_owner', 'admin') DEFAULT 'user',
          \`isActive\` TINYINT(1) DEFAULT true,
          \`createdAt\` DATETIME NOT NULL,
          \`updatedAt\` DATETIME NOT NULL
        ) ENGINE=InnoDB;
      `);
      
      // Create other tables...
      
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      // Define relationships
      defineRelationships();
      
      console.log('All tables were created successfully.');
      return true;
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

module.exports = { initializeDatabase };
