const { Restaurant, Category, Comment, User } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const restaurantController = {
  getRestaurants: (req, res, next) => {
    const DEFAULT_LIMIT = 9
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)
    const categoryId = Number(req.query.categoryId) || ''

    return Promise.all([Restaurant.findAndCountAll({
      raw: true,
      nest: true,
      include: Category,
      where: { ...categoryId ? { categoryId } : {} },
      limit,
      offset
    }), Category.findAll({ raw: true })])
      .then(([restaurants, categories]) => {
        const favoritedRestaurantsId = req.user && req.user.FavoritedRestaurants.map(fr => fr.id)
        const likedRestaurantsId = req.user && req.user.LikedRestaurants.map(lr => lr.id)
        const data = restaurants.rows.map(r => ({
          ...r,
          description: r.description.substring(0, 50),
          isFavorited: favoritedRestaurantsId.includes(r.id),
          isLiked: likedRestaurantsId.includes(r.id)
        }))
        return res.render('restaurants', {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
      .catch(err => next(err))
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
        })).sort((a, b) => b.favoritedCount - a.favoritedCount)
        return res.render('top-restaurants', { restaurants: data })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
