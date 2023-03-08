const express = require('express')
const router = express.Router()
const adminController = require('../../../controllers/apis/admin-controller')
const { apiErrorHandler } = require('../../../middleware/error-handler')

router.get('/restaurants', adminController.getRestaurants)
router.delete('/restaurant/:id', adminController.deleteRestaurant)
router.use('/', apiErrorHandler)

module.exports = router
