const express = require('express');
const userController = require(`./../Controllers/userController`);
const authController = require('./../Controllers/authController');

//Routers
const router = express.Router();

router.param('id', (req, res, next, val) => {
    console.log(`Requested Id is : ${val}`);
});


router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);


//to authenticate all routes that comes after this middleware in the middleware stack.
router.use(authController.protect);

router.patch('/updateMyPassword',authController.updatePassword);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.get('/Me', userController.getMe, userController.getUser);

router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers).post(userController.createUsers);
router.route('/:id').get(userController.getUser)
.patch(userController.updateUser)
.delete(userController.deleteUser);

module.exports = router;
