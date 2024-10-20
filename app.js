const path = require('path');

const mongodbStore = require('connect-mongodb-session');

const express = require('express');

const session = require('express-session');

var MongoDBStore = mongodbStore(session);

const db = require('./data/database');

const demoRoutes = require('./routes/demo');


const app = express();

var store = new MongoDBStore({
  uri: 'mongodb://localhost:27017',
  databaseName: 'auth-demo',
  collection: 'mySessions'
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'super-secret',
  resave: false,
  saveUninitialized: false,
  store: store,
}))

app.use(async function (req, res, next) {
  const user = req.session.user;
  const isAuth = req.session.isAuthenticated;
  if (!user || !isAuth) {
    return next();
  }

  const userDoc = await db.getDb().collection('users').findOne({ _id: user.id })
  const isAdmin = userDoc?.isAdmin;

  res.locals.isAuth = isAuth;
  res.locals.isAdmin = isAdmin;

  next();
})
app.use(demoRoutes);

app.use(function (error, req, res, next) {
  res.render('500');
})

db.connectToDatabase().then(function () {
  app.listen(3000);
});