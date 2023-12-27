const express = require('express');
const reviewController = require('./../Controllers/reviewController');
const authController = require('./../Controllers/authController');
const router = express.Router({mergeParams : true});

router.use(authController.protect);

router.route('/')
.get(reviewController.getAllReviews)
.post(authController.restrictTo('user'),
 reviewController.setTourUserIds,
 reviewController.createReview);

router.route('/:id')
.delete(authController.restrictTo('admin', 'user'), reviewController.deleteReview)
.patch(authController.restrictTo('admin', 'user'), reviewController.updateReview)
.get(reviewController.getReview);

module.exports = router;