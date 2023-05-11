const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const protectedRoute = require('../middleware/protectedResource');
const TweetModel = require('../models/tweet_model');
const UserModel = require('../models/user_model');

// REST API for getting the details of another user
router.get('/userprofile/:id', protectedRoute, async (req, res) => {
	try {
		const user = await UserModel.findOne({ _id: req.params.id }).select(
			'-password'
		);
		if (!user) {
			console.log('User not found');
			return res.status(404).json({ error: 'User not found' });
		}

		const tweets = await TweetModel.find({ author: req.params.id })
			.populate(
				'author',
				'_id fullName profileImg followers following backgroundwallpaper'
			)
			.populate('retweetFrom', '_id fullName profileImg')
			.populate('comments.commentedBy', '_id fullName profileImg')
			.populate('comments', '_id commentText commentedBy likes')
			.populate('comments.commentreplys.replyBy', '_id fullName profileImg');

		console.log('User:', user);
		console.log('Tweets:', tweets);
		res.json({ user, tweets });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

// REST API for the follow function
router.put('/follow', protectedRoute, async (req, res) => {
	try {
		const followedUser = await UserModel.findByIdAndUpdate(
			req.body.followId,
			{ $push: { followers: req.user._id } },
			{ new: true }
		).select('-password');

		await UserModel.findByIdAndUpdate(
			req.user._id,
			{ $push: { following: req.body.followId } },
			{ new: true }
		).select('-password');

		const loggedInUser = await UserModel.findById(req.user._id);
		res.json(loggedInUser);
	} catch (error) {
		return res.status(422).json({ error: error.message });
	}
});

// REST API for the unfollow function
router.put('/unfollow', protectedRoute, async (req, res) => {
	try {
		const unfollowedUser = await UserModel.findByIdAndUpdate(
			req.body.unfollowId,
			{ $pull: { followers: req.user._id } },
			{ new: true }
		);

		await UserModel.findByIdAndUpdate(
			req.user._id,
			{ $pull: { following: req.body.unfollowId } },
			{ new: true }
		);

		const loggedInUser = await UserModel.findById(req.user._id);
		res.json(loggedInUser);
	} catch (error) {
		return res.status(422).json({ error: error.message });
	}
});

module.exports = router;
