const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../data/database');
const router = express.Router();
const { ObjectId } = require('mongodb');

router.get('/', function (req, res) {
  res.render('welcome');
});

router.get('/signup', function (req, res) {

  let sessionInputData = req.session.inputData;

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

  let loginsessionInputData = req.session.inputData;

  if (!loginsessionInputData) {
    loginsessionInputData = {
      hasError: false,
      email: '',
      password: ''
    }
  }
  req.session.inputData = null;
  // console.log(loginsessionInputData)
  res.render('login', { inputData: loginsessionInputData });

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
      res.render('/signup')
    });
    return;
  }

  const existingUser = await db.getDb().collection('users').findOne({
    email: enteremail
  })
  if (existingUser) {
    req.session.inputData = {
      hasError: true,
      message: 'User Exists already !!',
      email: enteremail,
      confirmedEmail: confirmedEmail,
      password: enteredPassword
    }
    req.session.save(function () {
      res.redirect('/signup');
    })
    return;
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

  const existingUser = await db
    .getDb()
    .collection('users')
    .findOne({ email: enteremail })

  if (!existingUser) {
    req.session.inputData = {
      hasError: true,
      message: 'Could Not log you in please check your credentials!!',
      email: enteremail,
      password: enteredPassword
    }

    req.session.save(function () {
      res.redirect('/login');
    })

    return
  }

  const PasswordAreEqual = await bcrypt.compare(enteredPassword, existingUser.Password);

  if (!PasswordAreEqual) {
    req.session.inputData = {
      hasError: true,
      message: 'Password IN Correct',
      email: enteremail,
      password: enteredPassword
    }

    req.session.save(function () {
      res.redirect('/login');
    })
    return;
  }

  req.session.user = { id: existingUser._id.toString(), email: existingUser.email }
  req.session.isAuthenticated = true;
  req.session.save(function () {
    res.redirect('/Profile')
  })
});

router.get('/admin', async function (req, res) {
  // console.log(req.session.isAuthenticated)
  if (!req.session.isAuthenticated) {
    return res.status(401).render('401');
  }
  userId = new ObjectId(req.session.user.id);
  // console.log("Session User ID:", userId);
  const user = await db.getDb().collection('users').findOne({_id: userId });
  // console.log("153", user)
  if (!user || !user.isAdmin) {
    return res.status(403).render('403');
  }

  res.render('admin');
});

router.get('/Profile', function (req, res) {
  console.log(req)
  if (!req.session.isAuthenticated) {
    return res.status(401).render('401');
  }

  res.render('Profile');
});

router.post('/logout', function (req, res) {
  req.session.user = null
  req.session.isAuthenticated = false;
  res.redirect('/');
});

module.exports = router;