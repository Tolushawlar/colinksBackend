const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Create a new post
exports.createPost = async (req, res) => {
  try {
    console.log('Create post request body:', req.body);
    console.log('User ID:', req.user.id);
    
    const { title, content, type } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const postId = uuidv4();
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        id: postId,
        user_id: req.user.id,
        title,
        content,
        type
      })
      .select()
      .single();
      
    if (error) {
      throw new Error(error.message);
    }
    
    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
};

// Get post by ID
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:user_id(id, email, display_name, avatar_url)
      `)
      .eq('id', id)
      .single();
      
    if (error || !post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.status(200).json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching post', error: error.message });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type } = req.body;
    
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError || !post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is authorized to update this post
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }
    
    // Update post fields
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        title: title || post.title,
        content: content || post.content,
        type: type || post.type
      })
      .eq('id', id)
      .select()
      .single();
      
    if (updateError) {
      throw new Error(updateError.message);
    }
    
    res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError || !post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is authorized to delete this post
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      throw new Error(deleteError.message);
    }
    
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
};

// Get all posts with pagination
exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('posts')
      .select(`
        *,
        user:user_id(id, email, display_name, avatar_url)
      `, { count: 'exact' });
    
    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    
    // Apply pagination and ordering
    const { data: posts, error, count } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw new Error(error.message);
    }
    
    res.status(200).json({
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCount: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};

// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Query user's posts with pagination
    const { data: posts, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw new Error(error.message);
    }
    
    res.status(200).json({
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCount: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user posts', error: error.message });
  }
};