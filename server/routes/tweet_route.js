// Import required packages and modules
const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');
const TweetModel = require('../models/tweet_model');
const protectedRoute = require('../middleware/protectedResource');
const UserModel = require('../models/user_model');

// Retrieve all tweets
router.get('/alltweets', (req, res) => {
	// Find all tweets and populate the author and comment fields
	TweetModel.find()
		.populate('author', '_id fullName profileImg backgroundwallpaper')
		.populate('comments.commentedBy', '_id fullName profileImg ')
		.populate('comments', '_id commentText commentedBy likes')
		.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
		.populate('retweetFrom', '_id fullName profileImg')
		.then((dbtweets) => {
			// Send the tweets as a response
			res.status(200).json({ tweets: dbtweets });
		})
		.catch((error) => {
			// Handle errors
			console.log(error);
		});
});

// Retrieve tweets from users that the current user is following
router.get('/allsubscribedtweets', protectedRoute, async (req, res) => {
	try {
		// Get the ID of the current user
		let id = req.user._id;
		// Find the current user in the database
		const currentUser = await UserModel.findById(id);
		// Get the IDs of the users that the current user is following
		const followingIds = currentUser.following;
		// Find all tweets from users that the current user is following and populate the necessary fields
		const tweets = await TweetModel.find({
			author: { $in: followingIds },
		})
			.populate('author', '_id fullName profileImg backgroundwallpaper')
			.populate('comments', '_id commentText commentedBy likes ')
			.populate('retweetFrom', '_id fullName profileImg')
			.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
			.populate('comments.commentedBy', '_id fullName profileImg ');
		// Send the tweets as a response
		res.json(tweets);
	} catch (error) {
		// Handle errors
		console.error(error);
		res.status(500).json({ error: 'Server error' });
	}
});

// Route to get all tweets posted by the logged in user
router.get('/myalltweets', protectedRoute, (req, res) => {
	// Find all tweets by the logged in user using the TweetModel
	TweetModel.find({ author: req.user._id })
		// Populate the author field of the tweets with their ID, name, profile image and background wallpaper
		.populate('author', '_id fullName profileImg backgroundwallpaper')
		// Populate the comments field of the tweets with their ID, text, author and likes
		.populate('comments', '_id commentText commentedBy likes')
		// Populate the retweetFrom field of the tweets with the ID, name and profile image of the user who retweeted the tweet
		.populate('retweetFrom', '_id fullName profileImg')
		// Populate the replyBy field of the commentreplys field of the comments field of the tweets with their ID, name and profile image
		.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
		// Populate the commentedBy field of the comments field of the tweets with their ID, name and profile image
		.populate('comments.commentedBy', '_id fullName profileImg ')
		// Once all the above operations are completed, send the resulting tweets in the response as JSON
		.then((dbtweets) => {
			res.status(200).json({ tweets: dbtweets });
		})
		// If an error occurs, log it to the console
		.catch((error) => {
			console.log(error);
		});
});

// Route to create a new tweet
router.post('/createtweet', protectedRoute, (req, res) => {
	// Extract the necessary fields from the request body
	const {
		description,
		location,
		image,
		date,
		retweetFrom,
		retweetDate,
		retweets,
		comments,
	} = req.body;
	// Check if the mandatory fields are present in the request body
	if (!description || !location) {
		return res.status(400).json({ error: 'Please enter mandatory fields' });
	}
	// Remove the password field from the logged in user object
	req.user.password = undefined;
	// Create a new tweet object using the TweetModel with the extracted fields and logged in user object
	const tweetObj = new TweetModel({
		description: description,
		location: location,
		image: image,
		date: date,
		author: req.user,
		retweetFrom: retweetFrom,
		retweetDate: retweetDate,
		retweets: retweets,
		comments: comments,
	});
	// Save the newly created tweet object to the database
	tweetObj
		.save()
		// Once the tweet is saved, send the new tweet in the response as JSON
		.then((newtweet) => {
			res.status(201).json({ tweet: newtweet });
		})
		// If an error occurs, log it to the console
		.catch((error) => {
			console.log(error);
		});
});

//To delete tweet
router.delete('/deletetweet/:_id', protectedRoute, async (req, res) => {
	//Delete a tweet with the given id
	const result = await TweetModel.deleteOne({ _id: req.params._id });
	res.send(result);
});

//rest API for like the tweet
router.put('/like', protectedRoute, (req, res) => {
	//Update a tweet's likes with the user's id
	TweetModel.findByIdAndUpdate(
		req.body.tweetId, //tweetId
		{ $push: { likes: req.user._id } }, //add user's id to likes array
		{ new: true } //return updated record
	)
		.populate('author', '_id fullName backgroundwallpaper')
		.populate('retweetFrom', '_id fullName profileImg')
		.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
		.populate('comments', '_id commentText commentedBy likes ')
		.then((result) => {
			res.json(result);
		})
		.catch((error) => {
			return res.status(400).json({ error: error });
		});
});

// Rest API to Unlike the tweet
router.put('/unlike', protectedRoute, (req, res) => {
	// Find the tweet by id and pull the logged in user's id from the likes array
	TweetModel.findByIdAndUpdate(
		req.body.tweetId,
		{ $pull: { likes: req.user._id } },
		{ new: true }
	)
		// Populate the tweet's author and retweetFrom fields, as well as the comments and their replyBy and commentedBy fields
		.populate('author', '_id fullName backgroundwallpaper')
		.populate('retweetFrom', '_id fullName profileImg')
		.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
		.populate('comments', '_id commentText commentedBy likes ')
		.then((result) => {
			// Return the updated tweet
			res.json(result);
		})
		.catch((error) => {
			// Return an error if there is one
			return res.status(400).json({ error: error });
		});
});

// Rest API for adding comment to a tweet
router.put('/comment', protectedRoute, async (req, res) => {
	try {
		// extract the commentText and tweetId from the request body
		const { commentText, tweetId } = req.body;
		// if commentText or tweetId is missing, send an error response
		if (!commentText || !tweetId) {
			return res
				.status(400)
				.json({ error: 'Comment text or tweet ID missing' });
		}

		// create the comment object
		const comment = {
			commentText,
			commentedBy: req.user._id,
		};

		// find and update the tweet with the new comment
		const updatedTweet = await TweetModel.findByIdAndUpdate(
			tweetId,
			{ $push: { comments: comment } },
			{ new: true }
		)
			// populate the author, retweetFrom, comments, and commentreplys fields
			.populate('comments.commentedBy', '_id fullName profileImg')
			.populate('author', '_id fullName backgroundwallpaper')
			.populate('comments', '_id commentText commentedBy likes')
			.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
			.populate('retweetFrom', '_id fullName profileImg');

		// send the updated tweet as response
		res.json(updatedTweet);
	} catch (error) {
		// send error response if there is an error
		res.status(400).json({ error: error.message });
	}
});

// REST API to delete the comment
router.delete('/comment/:commentId', protectedRoute, async (req, res) => {
	try {
		const commentId = req.params.commentId; //get comment id from params
		// find the tweet that contains the comment and remove it
		const tweet = await TweetModel.findOneAndUpdate(
			{ 'comments._id': commentId }, //find the tweet by comment id
			{ $pull: { comments: { _id: commentId, commentedBy: req.user._id } } }, //remove the comment from the tweet
			{ new: true } //return the updated tweet
		)
			// populate the tweet with its author, comments, commenters, and retweeter
			.populate('comments.commentedBy', '_id fullName profileImg')
			.populate('author', '_id fullName backgroundwallpaper')
			.populate('comments', '_id commentText commentedBy likes')
			.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
			.populate('retweetFrom', '_id fullName profileImg');
		// return an error if the tweet is not found
		if (!tweet) {
			return res.status(404).json({ error: 'Comment not found' });
		}

		// return the updated tweet
		res.json(tweet);
	} catch (error) {
		// handle any errors that may occur
		res.status(400).json({ error: error.message });
	}
});

// REST API for retweeting a tweet
router.post('/retweet/:id', protectedRoute, async (req, res) => {
	try {
		// Check if the tweet being retweeted exists
		const tweetToRetweet = await TweetModel.findById(req.params.id)
			.populate('author', '_id fullName profileImg')
			.populate('retweetFrom', '_id fullName profileImg')
			.populate('comments', '_id commentText commentedBy likes ')
			.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
			.populate('comments.commentedBy', '_id fullName profileImg ');
		if (!tweetToRetweet) {
			return res.status(404).json({ error: 'Tweet not found' });
		}

		// Create a new tweet object based on the original tweet
		const retweetObj = new TweetModel({
			description: tweetToRetweet.description,
			location: tweetToRetweet.location,
			image: tweetToRetweet.image,
			date: new Date(),
			author: req.user,
			retweetFrom: tweetToRetweet.author,
			retweetDate: new Date(),
			retweets: [req.user._id], // add the user who retweeted to the list
			comments: tweetToRetweet.comments,
		});

		// Save the retweet
		const newTweet = await retweetObj.save();

		// Update the original tweet with the list of retweets
		tweetToRetweet.retweets.push(req.user._id);
		await tweetToRetweet.save();

		res.status(201).json({ tweet: newTweet });
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: 'Server error' });
	}
});

//Rest API to Like the comment
router.put('/likecomment', protectedRoute, async (req, res) => {
	// Extract the commentId and userId from the request body
	const commentId = req.body.commentId;
	const userId = req.user._id;
	try {
		// Find the tweet containing the comment and update the likes array of the specified comment
		const tweet = await TweetModel.findOneAndUpdate(
			{ 'comments._id': commentId },
			{ $push: { 'comments.$.likes': userId } },
			{ new: true }
		)
			// Populate the author and retweetFrom fields of the tweet
			.populate('author', '_id fullName backgroundwallpaper')
			.populate('retweetFrom', '_id fullName profileImg')
			// Populate the comments field of the tweet, including the commenter's name and profile picture
			.populate('comments', '_id commentText commentedBy likes ')
			.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
			.populate('comments.commentedBy', '_id fullName profileImg');

		// If the tweet cannot be found, return an error response
		if (!tweet) {
			return res.status(400).json({ error: 'Unable to find tweet or comment' });
		}

		// Return a success response with the updated tweet
		res.status(200).json({ tweet: tweet });
	} catch (error) {
		// If an error occurs, return a 400 response with the error message
		return res.status(400).json({ error: error.message });
	}
});

// REST API to Unlike the comment
router.put('/unlikecomment', protectedRoute, async (req, res) => {
	// Get the comment ID and the user ID from the request body
	const commentId = req.body.commentId;
	const userId = req.user._id;
	try {
		// Find the tweet that contains the comment and remove the user ID from the likes array
		const tweet = await TweetModel.findOneAndUpdate(
			{ 'comments._id': commentId },
			{ $pull: { 'comments.$.likes': userId } },
			{ new: true }
		)
			// Populate the author, retweetFrom, comments, and commentreplys fields of the tweet object
			.populate('author', '_id fullName backgroundwallpaper')
			.populate('retweetFrom', '_id fullName profileImg')
			.populate('comments', '_id commentText commentedBy likes ')
			.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
			.populate('comments.commentedBy', '_id fullName profileImg');

		if (!tweet) {
			// If the tweet is not found, return an error message
			return res.status(400).json({ error: 'Unable to find tweet or comment' });
		}

		// Return the updated tweet object
		res.status(200).json({ tweet: tweet });
	} catch (error) {
		// If there is an error, return a 400 status code and an error message
		return res.status(400).json({ error: error.message });
	}
});

// REST API for adding a reply to a comment
router.put('/reply', protectedRoute, async (req, res) => {
	try {
		// Extract reply text and comment ID from the request body
		const { replyText, commentId } = req.body;
		// Check if both reply text and comment ID are provided
		if (!replyText || !commentId) {
			return res.status(400).json({ error: 'Reply text or CommentID missing' });
		}

		// Create the reply object
		const reply = {
			replyText,
			replyBy: req.user._id,
		};

		// Find the tweet and add the reply to the corresponding comment
		const updatedTweet = await TweetModel.findOneAndUpdate(
			{ 'comments._id': commentId },
			{ $push: { 'comments.$.commentreplys': reply } },
			{ new: true }
		)
			.populate('comments.commentedBy', '_id fullName profileImg')
			.populate('author', 'fullName backgroundwallpaper')
			.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
			.populate('comments.commentText', 'likes');

		// Return the updated tweet
		res.json(updatedTweet);
	} catch (error) {
		// Return an error response if an error occurs
		res.status(400).json({ error: error.message });
	}
});

// REST API to delete a reply from a comment
router.delete('/reply/:replyId', protectedRoute, async (req, res) => {
	try {
		// Get the ID of the reply to be deleted from the request parameters
		const replyId = req.params.replyId;
		// Find the tweet and remove the reply from the corresponding comment
		const tweet = await TweetModel.findOneAndUpdate(
			{ 'comments.commentreplys._id': replyId },
			{
				$pull: {
					'comments.$.commentreplys': { _id: replyId, replyBy: req.user._id },
				},
			},
			{ new: true }
		)
			// Populate the tweet with relevant data
			.populate('comments.commentedBy', '_id fullName profileImg')
			.populate('author', '_id fullName backgroundwallpaper')
			.populate('comments', '_id commentText commentedBy likes')
			.populate('comments.commentreplys.replyBy', '_id fullName profileImg')
			.populate('retweetFrom', '_id fullName profileImg');

		// If the tweet is not found, return an error response
		if (!tweet) {
			return res.status(404).json({ error: 'Reply not found' });
		}

		// Return the updated tweet
		res.json(tweet);
	} catch (error) {
		// If an error occurs, return an error response with the error message
		res.status(400).json({ error: error.message });
	}
});
module.exports = router;
