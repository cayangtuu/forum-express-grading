if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const path = require('path')
const express = require('express')
const exphbs = require('express-handlebars')
const { pages, apis } = require('./routes')
const flash = require('connect-flash')
const methodOverride = require('method-override')
const session = require('express-session')
const passport = require('./config/passport')
const { getUser } = require('./helpers/auth-helpers')
const handlebarsHelpers = require('./helpers/handlebars-helpers')

const app = express()
const port = process.env.PORT || 3000
const SESSION_SECRET = 'secret'

app.engine('hbs', exphbs({ defaultLayout: 'main', extname: '.hbs', helpers: handlebarsHelpers }))
app.set('view engine', 'hbs')
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use('/upload', express.static(path.join(__dirname, 'upload')))
app.use(express.json())
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success_messages')
  res.locals.error_messages = req.flash('error_messages')
  res.locals.the_user = getUser(req)
  next()
})

app.use('/api', apis)
app.use(pages)

app.listen(port, () => {
  console.info(`Example app listening on port ${port}!`)
})

module.exports = app
