const app = require('./app');
const supabase = require('./config/supabase');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection failed:', error.message);
      console.log('Please check your SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
    } else {
      console.log('✅ Supabase connected successfully');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Database: Supabase`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

startServer();