const router = require('express').Router();
const { statsController, businessesController, businessSettingsController } = require('../../controllers/masterControllers');
const authMiddleware = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validate');
const { createBusinessSchema, updateBusinessSchema } = require('./validations/businessSchema');

// Protect all master routes - only users with role 'master' can access
router.use(authMiddleware({ route_permissions: ['master'] }));

router.get('/stats', statsController.getStats);

// Businesses
router.get('/businesses', businessesController.getAllBusinesses);
router.get('/businesses/:id', businessesController.getBusinessById);
router.post('/businesses', validate(createBusinessSchema), businessesController.createBusiness);
// Update business (name, business email, and optionally admin password)
router.put('/businesses/:id', validate(updateBusinessSchema), businessesController.updateBusiness);

// Business Settings
router.get('/business/:id/settings', businessSettingsController.getSettings);
router.put('/business/:id/settings', businessSettingsController.updateSetting);

module.exports = router;


