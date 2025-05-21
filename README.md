# Colinks Backend API

A Node.js backend API for the Colinks application, providing user profiles, business profiles, appointments, business directory, and chat functionality.

## Features

- User authentication and profile management
- Business profile creation and management
- Appointment scheduling and management
- Business directory with search and filtering
- Real-time chat between users and businesses

## Tech Stack

- Node.js
- Express.js
- MySQL
- Sequelize ORM
- JWT Authentication
- bcrypt for password hashing

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middlewares/    # Custom middleware functions
├── models/         # Database models
├── routes/         # API routes
├── utils/          # Utility functions
├── app.js          # Express app setup
└── server.js       # Server entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=colinks_db
   DB_PORT=3306
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   PORT=3000
   ```
4. Create the MySQL database:
   ```
   CREATE DATABASE colinks_db;
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user

### User Profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password

### Business Profile
- `POST /api/businesses` - Create a business profile
- `GET /api/businesses` - List businesses with filtering
- `GET /api/businesses/:id` - Get business by ID
- `PUT /api/businesses/:id` - Update business profile
- `DELETE /api/businesses/:id` - Delete business profile
- `GET /api/businesses/user/my-businesses` - Get user's businesses

### Appointments
- `POST /api/appointments` - Create an appointment
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id/status` - Update appointment status
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `GET /api/appointments/user/my-appointments` - Get user's appointments
- `GET /api/appointments/business/:businessId` - Get business appointments

### Chat
- `POST /api/chats` - Create or get a chat
- `GET /api/chats/user` - Get user's chats
- `GET /api/chats/business/:businessId` - Get business chats
- `POST /api/chats/message` - Send a message
- `GET /api/chats/:chatId/messages` - Get chat messages

## License

This project is licensed under the ISC License.