const { Business, User } = require("../models");
const { Op } = require("sequelize");

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
    const business = await Business.create({
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
      ownerId: req.user.id,
    });

    // Update user role to business_owner if not already
    if (req.user.role !== "business_owner" && req.user.role !== "admin") {
      await User.update(
        { role: "business_owner" },
        { where: { id: req.user.id } }
      );
    }

    res.status(201).json({
      message: "Business profile created successfully",
      business,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error creating business profile",
        error: error.message,
      });
  }
};

// Get business profile by ID
exports.getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;

    const business = await Business.findByPk(id, {
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "email", "displayName"],
        },
      ],
    });

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.status(200).json({ business });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching business profile",
        error: error.message,
      });
  }
};

// Update business profile
exports.updateBusiness = async (req, res) => {
  try {
    const { id } = req.params;

    const business = await Business.findByPk(id);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if user is the owner or admin
    if (business.ownerId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this business" });
    }

    // Update business fields
    const updatedBusiness = await business.update(req.body);

    res.status(200).json({
      message: "Business profile updated successfully",
      business: updatedBusiness,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error updating business profile",
        error: error.message,
      });
  }
};

// Delete business profile
exports.deleteBusiness = async (req, res) => {
  try {
    const { id } = req.params;

    const business = await Business.findByPk(id);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if user is the owner or admin
    if (business.ownerId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this business" });
    }

    await business.destroy();

    res.status(200).json({ message: "Business profile deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
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

    // Build filter conditions
    const whereConditions = {};

    if (industry) {
      whereConditions.industry = industry;
    }

    if (location) {
      whereConditions.location = location;
    }

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // Query businesses with pagination
    const { count, rows: businesses } = await Business.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: offset,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "email", "displayName"], // Fixed attributes
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      businesses,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCount: count,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error listing businesses", error: error.message });
  }
};

// Get businesses owned by the authenticated user
exports.getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.findAll({
      where: { ownerId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ businesses });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching your businesses",
        error: error.message,
      });
  }
};
