const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../data/database');

const router = express.Router();

router.get('/', function (req, res) {
  res.render('welcome');
});

router.get('/signup', function (req, res) {
  res.render('signup');
});

router.get('/login', function (req, res) {
  res.render('login');
});

router.post('/signup', async function (req, res) {
  const userData = req.body;
  const enteremail = userData.email;
  const confirmedEmail = userData['confirm-email'];
  const enteredPassword = userData.password;

  if (!enteremail || !confirmedEmail || enteredPassword.trim() < 6 || enteremail !== confirmedEmail || !enteremail.includes('@')) {
    console.log('Incorrect data');
    return res.redirect('/signup')
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
  console.log('unAutherized user !!');
  res.redirect('/admin')
});

router.get('/admin', function (req, res) {
  res.render('admin');
});

router.post('/logout', function (req, res) { });

module.exports = router;