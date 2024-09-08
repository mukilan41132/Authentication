const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../data/database');


const router = express.Router();

router.get('/', function (req, res) {
  res.render('welcome');
});

router.get('/signup', function (req, res) {

  let sessionInputData = req.session.inputData;
  console.log("15",sessionInputData)
  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: '',
      confirmedEmail: '',
      password: ''
    }
  }
  req.session.inputData = null;
  res.render('signup', { inputData: sessionInputData });
});

router.get('/login', function (req, res) {
  res.render('login');
});

router.post('/signup', async function (req, res) {
  const userData = req.body;
  const enteremail = userData.email;
  const confirmedEmail = userData['confirm-email'];
  const enteredPassword = userData.password;

  if (!enteremail ||
    !confirmedEmail ||
    enteredPassword.trim() < 6 ||
    enteremail !== confirmedEmail ||
    !enteremail.includes('@')) {

    req.session.inputData = {
      hasError: true,
      message: 'Invalid input - pleace check your data',
      email: enteremail,
      confirmedEmail: confirmedEmail,
      password: enteredPassword
    }
    req.session.save(function () {
      return res.render('/signup')
    })

  }

  const existingUser = await db.getDb().collection('users').findOne({
    email: enteremail
  })
  if (existingUser) {
    console.log('User Exist already !!')
    return res.redirect('/signup');
  }
  const hashPassword = await bcrypt.hash(enteredPassword, 12);

  const user = {
    email: enteremail,
    cEmail: confirmedEmail,
    Password: hashPassword
  };
  await db.getDb().collection('users').insertOne(user);
  res.redirect('/login')
});

router.post('/login', async function (req, res) {
  const userData = req.body;
  const enteremail = userData.email;
  const enteredPassword = userData.password;

  const existingUser = await db.getDb().collection('users').findOne({
    email: enteremail
  })

  if (!existingUser) {
    console.log('Could Not log in !!')
    return res.redirect('/login');
  }
  const PasswordAreEqual = await bcrypt.compare(enteredPassword, existingUser.Password);
  if (!PasswordAreEqual) {
    console.log('Password IN Correct');
    return res.redirect('/login');
  }


  req.session.user = { id: existingUser._id.toString(), email: existingUser.email }
  req.session.isAuthenticated = true;
  req.session.save(function () {
    res.redirect('/admin')
  })
});

router.get('/admin', function (req, res) {
  if (!req.session.isAuthenticated) {
    return res.status(401).render('401');
  }
  res.render('admin');
});

router.post('/logout', function (req, res) {
  req.session.user = null
  req.session.isAuthenticated = true;
  res.redirect('/');
});

module.exports = router;