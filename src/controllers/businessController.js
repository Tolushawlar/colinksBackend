const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Create a new business profile
exports.createBusiness = async (req, res) => {
  try {
    const {
      name,
      description,
      logo,
      industry,
      partnershipOffers,
      sponsorshipOffers,
      website,
      email,
      phone,
      location,
      gallery,
    } = req.body;

    // Create business with owner ID from authenticated user
    const businessId = uuidv4();
    const { data: business, error } = await supabase
      .from('businesses')
      .insert({
        id: businessId,
        name,
        description,
        logo,
        industry,
        partnership_offers: JSON.stringify(partnershipOffers || []),
        sponsorship_offers: JSON.stringify(sponsorshipOffers || []),
        website,
        email,
        phone,
        location,
        gallery: JSON.stringify(gallery || []),
        owner_id: req.user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Update user role to business_owner if not already
    if (req.user.role !== "business_owner" && req.user.role !== "admin") {
      await supabase
        .from('users')
        .update({ role: 'business_owner' })
        .eq('id', req.user.id);
    }

    res.status(201).json({
      message: "Business profile created successfully",
      business,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating business profile",
      error: error.message,
    });
  }
};

// Get business profile by ID
exports.getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: business, error } = await supabase
      .from('businesses')
      .select(`
        *,
        owner:owner_id(id, email, display_name)
      `)
      .eq('id', id)
      .single();

    if (error || !business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.status(200).json({ business });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching business profile",
      error: error.message,
    });
  }
};

// Update business profile
exports.updateBusiness = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if user is the owner or admin
    if (business.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this business" });
    }

    // Update business fields
    const updateData = { ...req.body };
    if (updateData.partnershipOffers) {
      updateData.partnership_offers = JSON.stringify(updateData.partnershipOffers);
      delete updateData.partnershipOffers;
    }
    if (updateData.sponsorshipOffers) {
      updateData.sponsorship_offers = JSON.stringify(updateData.sponsorshipOffers);
      delete updateData.sponsorshipOffers;
    }
    if (updateData.gallery) {
      updateData.gallery = JSON.stringify(updateData.gallery);
    }

    const { data: updatedBusiness, error: updateError } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    res.status(200).json({
      message: "Business profile updated successfully",
      business: updatedBusiness,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating business profile",
      error: error.message,
    });
  }
};

// Delete business profile
exports.deleteBusiness = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if user is the owner or admin
    if (business.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this business" });
    }

    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    res.status(200).json({ message: "Business profile deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting business profile",
      error: error.message,
    });
  }
};

// List businesses with filtering and pagination
exports.listBusinesses = async (req, res) => {
  try {
    const { page = 1, limit = 10, industry, location, search } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('businesses')
      .select(`
        *,
        owner:owner_id(id, email, display_name)
      `, { count: 'exact' });

    // Apply filters
    if (industry) {
      query = query.eq('industry', industry);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    const { data: businesses, error, count } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({
      businesses,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCount: count,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error listing businesses", 
      error: error.message 
    });
  }
};

// Get businesses owned by the authenticated user
exports.getMyBusinesses = async (req, res) => {
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({ businesses });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching your businesses",
      error: error.message,
    });
  }
};

// Get business categories based on industries
exports.getBusinessCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('businesses')
      .select('industry')
      .not('industry', 'is', null);

    if (error) {
      throw new Error(error.message);
    }

    const uniqueCategories = [...new Set(categories.map(item => item.industry))];

    res.status(200).json({ categories: uniqueCategories });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching business categories",
      error: error.message,
    });
  }
};

// Get partnership categories
exports.getPartnershipCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('businesses')
      .select('industry')
      .not('industry', 'is', null);

    if (error) {
      throw new Error(error.message);
    }

    const uniqueCategories = [...new Set(categories.map(item => item.industry))];

    res.status(200).json({ categories: uniqueCategories });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching partnership categories",
      error: error.message,
    });
  }
};

// Get sponsorship categories
exports.getSponsorshipCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('businesses')
      .select('industry')
      .not('industry', 'is', null);

    if (error) {
      throw new Error(error.message);
    }

    const uniqueCategories = [...new Set(categories.map(item => item.industry))];

    res.status(200).json({ categories: uniqueCategories });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching sponsorship categories",
      error: error.message,
    });
  }
};

// Get businesses by partnership category
exports.getBusinessesByPartnershipCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('industry', category);

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({ businesses });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching businesses by partnership category",
      error: error.message,
    });
  }
};

// Get businesses by sponsorship category
exports.getBusinessesBySponsorshipCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('industry', category);

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({ businesses });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching businesses by sponsorship category",
      error: error.message,
    });
  }
};