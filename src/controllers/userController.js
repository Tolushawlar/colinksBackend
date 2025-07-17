const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Register a new user
exports.register = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    
    const { 
      email, 
      password, 
      displayName, 
      bio, 
      avatarUrl, 
      website, 
      industry, 
      interests, 
      accountType 
    } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    console.log('Checking for existing user with email:', email);
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    console.log('Existing user check result:', { existingUser, checkError });
      
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    console.log('Hashing password...');
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Creating new user...');
    // Create new user
    const userId = uuidv4();
    const insertData = {
      id: userId,
      email,
      password: hashedPassword,
      display_name: displayName || '',
      bio: bio || '',
      avatar_url: avatarUrl || '',
      website: website || '',
      industry: industry || '',
      interests: interests || '',
      account_type: accountType || 'partnership'
    };
    
    console.log('Insert data:', insertData);
    
    const { data: user, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();

    console.log('Insert result:', { user, error });

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message);
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'User registered successfully',
      Accountcreated: 'Your account has been created successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        accountType: user.account_type,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        accountType: user.account_type,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, display_name, bio, avatar_url, website, industry, interests, account_type, role, created_at, updated_at');

    if (error) {
      throw new Error(error.message);
    }
    
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, display_name, bio, avatar_url, website, industry, interests, account_type, role, created_at, updated_at')
      .eq('id', req.user.id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('Update profile request body:', req.body);
    console.log('User ID:', req.user.id);
    
    const { 
      displayName, 
      bio, 
      avatarUrl, 
      website, 
      industry, 
      interests, 
      accountType 
    } = req.body;
    
    // Check if request body is empty
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'No data provided for update' });
    }
    
    const updateFields = {};
    if (displayName !== undefined) updateFields.display_name = displayName;
    if (bio !== undefined) updateFields.bio = bio;
    if (avatarUrl !== undefined) updateFields.avatar_url = avatarUrl;
    if (website !== undefined) updateFields.website = website;
    if (industry !== undefined) updateFields.industry = industry;
    if (interests !== undefined) updateFields.interests = interests;
    if (accountType !== undefined) updateFields.account_type = accountType;
    
    console.log('Update fields:', updateFields);
    
    const { data: user, error } = await supabase
      .from('users')
      .update(updateFields)
      .eq('id', req.user.id)
      .select()
      .maybeSingle();
      
    console.log('Supabase update result:', { user, error });

    if (error) {
      throw new Error(error.message);
    }
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        website: user.website,
        industry: user.industry,
        interests: user.interests,
        accountType: user.account_type,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
      
    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedNewPassword })
      .eq('id', req.user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

// Reset password (no authentication required)
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }
    
    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error || !user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedNewPassword })
      .eq('email', email);

    if (updateError) {
      throw new Error(updateError.message);
    }
    
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};