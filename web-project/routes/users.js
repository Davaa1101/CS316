const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Item = require('../models/Item');
const Offer = require('../models/Offer');
const { auth } = require('../middleware/auth');
const { createUpload } = require('../config/cloudinary');

const router = express.Router();

const upload = createUpload('profiles');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', details: error.message });
  }
});

// Update user profile
router.put('/profile', auth, upload.single('avatar'), [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().isMobilePhone(),
  body('location.city').optional().trim().isLength({ min: 1 }),
  body('location.district').optional().trim().isLength({ min: 1 }),
  body('preferences.notifications.email').optional().isBoolean(),
  body('preferences.notifications.newOffers').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Шалгалт амжилтгүй', 
        errors: errors.array() 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    // Update basic fields
    const allowedFields = ['name', 'phone'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Update location if provided
    if (req.body['location.city'] || req.body['location.district']) {
      user.location = {
        ...user.location.toObject(),
        city: req.body['location.city'] || user.location.city,
        district: req.body['location.district'] || user.location.district
      };
    }

    // Update preferences if provided
    if (req.body['preferences.notifications.email'] !== undefined) {
      user.preferences.notifications.email = req.body['preferences.notifications.email'];
    }
    if (req.body['preferences.notifications.newOffers'] !== undefined) {
      user.preferences.notifications.newOffers = req.body['preferences.notifications.newOffers'];
    }

    // Handle avatar upload — Cloudinary URL directly
    if (req.file) {
      user.profile.avatar = req.file.path;
    }

    await user.save();

    const updatedUser = await User.findById(req.user.userId).select('-password');
    
    res.json({
      message: 'Профайл амжилттай шинэчлэгдлээ',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Профайл шинэчлэх үед серверийн алдаа гарлаа', details: error.message });
  }
});

// Get user's items
router.get('/items', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['active', 'inactive', 'completed', 'removed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Хүсэлтийн параметр буруу байна', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { owner: req.user.userId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Item.countDocuments(filter);

    const itemsWithOffers = await Promise.all(
      items.map(async (item) => {
        const offerCount = await Offer.countDocuments({ 
          item: item._id, 
          status: 'pending' 
        });
        return { ...item.toObject(), pendingOffers: offerCount };
      })
    );

    res.json({
      items: itemsWithOffers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', details: error.message });
  }
});

// Get user's favorite items
router.get('/favorites', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Хүсэлтийн параметр буруу байна', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const items = await Item.find({ 
      favorites: req.user.userId,
      status: 'active'
    })
    .populate('owner', 'name location.city location.district')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

    const total = await Item.countDocuments({ 
      favorites: req.user.userId,
      status: 'active'
    });

    res.json({
      items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', details: error.message });
  }
});

// Get user dashboard statistics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [
      activeItems,
      totalItems,
      sentOffers,
      receivedOffers,
      completedTrades
    ] = await Promise.all([
      Item.countDocuments({ owner: userId, status: 'active' }),
      Item.countDocuments({ owner: userId }),
      Offer.countDocuments({ offeredBy: userId }),
      Offer.countDocuments({ offeredTo: userId }),
      Offer.countDocuments({ 
        $or: [{ offeredBy: userId }, { offeredTo: userId }],
        status: 'completed'
      })
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const recentActivity = {
      newItems: await Item.countDocuments({ 
        owner: userId, 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      newOffers: await Offer.countDocuments({ 
        offeredBy: userId, 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      receivedOffers: await Offer.countDocuments({ 
        offeredTo: userId, 
        createdAt: { $gte: thirtyDaysAgo } 
      })
    };

    const pendingActions = {
      offersToReview: await Offer.countDocuments({ 
        offeredTo: userId, 
        status: 'pending' 
      }),
      expiringSoon: await Item.countDocuments({
        owner: userId,
        status: 'active',
        expiresAt: { 
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })
    };

    res.json({
      stats: { activeItems, totalItems, sentOffers, receivedOffers, completedTrades },
      recentActivity,
      pendingActions
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', details: error.message });
  }
});

// Change password
router.post('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Нууц үгийн баталгаажуулалт таарахгүй байна');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Шалгалт амжилтгүй', 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Одоогийн нууц үг буруу байна' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Нууц үг амжилттай солигдлоо' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Нууц үг солих үед серверийн алдаа гарлаа', details: error.message });
  }
});

// Delete user account
router.delete('/account', auth, [
  body('password').notEmpty(),
  body('confirmation').equals('DELETE')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Шалгалт амжилтгүй', 
        errors: errors.array() 
      });
    }

    const { password } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Нууц үг буруу байна' });
    }

    // Delete user's items
    await Item.deleteMany({ owner: userId });

    // Delete user's offers
    await Offer.deleteMany({ offeredBy: userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Данс амжилттай устгагдлаа' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Данс устгах үед серверийн алдаа гарлаа', details: error.message });
  }
});

// Get public user profile
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('name location profile.avatar profile.rating profile.totalTrades profile.joinedDate')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const activeItemsCount = await Item.countDocuments({ 
      owner: id, 
      status: 'active' 
    });

    res.json({ ...user, activeItemsCount });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', details: error.message });
  }
});

// Get user's public items
router.get('/:id/items', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Хүсэлтийн параметр буруу байна', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const items = await Item.find({ owner: id, status: 'active' })
      .populate('owner', 'name location.city location.district profile.rating')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Item.countDocuments({ owner: id, status: 'active' });

    res.json({
      items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user public items error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', details: error.message });
  }
});

module.exports = router;