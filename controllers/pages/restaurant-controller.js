const { Restaurant, Category, Comment, User } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')
const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getRestaurant: async (req, res, next) => {
    try {
      const restaurant = await Restaurant.findByPk(req.params.id, {
        include: [Category,
          { model: Comment, include: User },
          { model: User, as: 'FavoritedUsers' },
          { model: User, as: 'LikedUsers' }
        ]
      })
      if (!restaurant) throw new Error("Restaurant didn't exist!")
      const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
      const isLiked = restaurant.LikedUsers.some(l => l.id === req.user.id)
      await restaurant.increment('viewCounts', { by: 1 })
      res.render('restaurant', {
        restaurant: restaurant.toJSON(),
        isFavorited,
        isLiked
      })
    } catch (err) {
      next(err)
    }
  },
  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        Comment,
        { model: User, as: 'FavoritedUsers' }
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        const data = ({
          ...restaurant.toJSON(),
          favoritedCount: restaurant.FavoritedUsers.length,
          commentedCount: restaurant.Comments.length
        })
        return res.render('dashboard', { restaurant: data })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        raw: true,
        nest: true,
        include: Category,
        order: [['createdAt', 'DESC']],
        limit: 10
      }),
      Comment.findAll({
        raw: true,
        nest: true,
        include: [User, Restaurant],
        order: [['createdAt', 'DESC']],
        limit: 10
      })
    ])
      .then(([restaurants, comments]) => {
        const data = restaurants.map(r => ({
          ...r,
          description: r.description.substring(0, 100)
        })
        )
        return res.render('feeds', { restaurants: data, comments })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      include: { model: User, as: 'FavoritedUsers' }
    })
      .then(restaurants => {
        const data = restaurants.map(restaurant => ({
          ...restaurant.toJSON(),
          favoritedCount: restaurant.FavoritedUsers.length,
          isFavorited: req.user && req.user.FavoritedRestaurants.some(r => r.id === restaurant.id)
        })).sort((a, b) => b.favoritedCount - a.favoritedCount).slice(0, 10)
        return res.render('top-restaurants', { restaurants: data })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
