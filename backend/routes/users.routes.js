const express = require('express');
const router = express.Router();
const { getUsers, createUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth.middleware');

router.use(protect);
router.use(admin); // Only admins manage users

router.route('/')
  .get(getUsers)
  .post(createUser);

module.exports = router;
