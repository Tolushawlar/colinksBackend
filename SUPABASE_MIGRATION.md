# Supabase Migration Guide

## Backend Refactored to Use Supabase

### **What Changed:**
- ✅ Replaced Sequelize ORM with Supabase client
- ✅ Updated appointment controller for Supabase
- ✅ Updated user controller for Supabase
- ✅ Added UUID generation for primary keys
- ✅ Updated database field naming (camelCase → snake_case)

### **Required Supabase Tables:**

#### **users table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  display_name VARCHAR,
  bio TEXT,
  avatar_url VARCHAR,
  website VARCHAR,
  industry VARCHAR,
  interests TEXT,
  account_type VARCHAR DEFAULT 'partnership',
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **appointments table:**
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  creator_id UUID REFERENCES users(id),
  business_id UUID REFERENCES businesses(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR,
  status VARCHAR DEFAULT 'scheduled',
  purpose VARCHAR NOT NULL,
  meeting_title VARCHAR,
  description TEXT,
  duration INTEGER DEFAULT 60,
  attendee_email VARCHAR,
  attendee_name VARCHAR,
  meeting_link TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **businesses table:**
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  name VARCHAR NOT NULL,
  location VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  website VARCHAR,
  industry VARCHAR,
  description TEXT,
  logo VARCHAR,
  partnership_offers JSONB DEFAULT '[]',
  sponsorship_offers JSONB DEFAULT '[]',
  gallery JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **posts table:**
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR DEFAULT 'service',
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **chat_messages table:**
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Environment Variables:**
Add to `.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Key Changes:**

#### **Field Naming:**
- `displayName` → `display_name`
- `avatarUrl` → `avatar_url`
- `accountType` → `account_type`
- `userId` → `user_id`
- `creatorId` → `creator_id`
- `businessId` → `business_id`
- `attendeeEmail` → `attendee_email`
- `attendeeName` → `attendee_name`
- `meetingTitle` → `meeting_title`
- `meetingLink` → `meeting_link`

#### **API Methods:**
- `Model.findAll()` → `supabase.from().select()`
- `Model.findByPk()` → `supabase.from().select().eq().single()`
- `Model.create()` → `supabase.from().insert()`
- `Model.update()` → `supabase.from().update()`

### **Controllers Updated:**
- ✅ `appointmentController.js` - Full Supabase integration
- ✅ `userController.js` - Full Supabase integration
- ✅ `businessController.js` - Full Supabase integration
- ✅ `chatController.js` - Full Supabase integration
- ✅ `postController.js` - Full Supabase integration
- ✅ `emailController.js` - No changes needed (email only)
- ✅ `uploadController.js` - No changes needed (Cloudinary only)

### **Next Steps:**
1. Set up Supabase project and get credentials
2. Create the required tables in Supabase
3. Update environment variables
4. Test appointment and user functionality
5. Migrate remaining controllers

### **Benefits:**
- 🚀 Better scalability with Supabase
- 🔒 Built-in authentication options
- 📊 Real-time capabilities
- 🌐 Edge functions support
- 💾 Automatic backups