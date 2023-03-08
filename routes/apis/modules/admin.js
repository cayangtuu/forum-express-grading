const express = require('express')
const router = express.Router()
const adminController = require('../../../controllers/apis/admin-controller')
const { apiErrorHandler } = require('../../../middleware/error-handler')
const upload = require('../../../middleware/multer')

router.delete('/restaurant/:id', adminController.deleteRestaurant)
router.get('/restaurants', adminController.getRestaurants)
router.post('/restaurants', upload.single('image'), adminController.postRestaurant)

router.use('/', apiErrorHandler)

module.exports = router
