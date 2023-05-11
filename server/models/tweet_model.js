// Import Mongoose and ObjectId
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// Define tweetSchema
const tweetSchema = new mongoose.Schema({
	// Tweet description
	description: {
		type: String,
		required: true,
	},

	// Tweet location
	location: {
		type: String,
		required: true,
	},

	// Tweet likes
	likes: [
		{
			type: ObjectId,
			ref: 'UserModel',
		},
	],

	// Tweet comments
	comments: [
		{
			// Comment text
			commentText: String,

			// User who posted the comment
			commentedBy: { type: ObjectId, ref: 'UserModel' },

			// Comment likes
			likes: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User',
				},
			],

			// Comment replies
			commentReplies: [
				{
					// Reply text
					replyText: String,

					// User who posted the reply
					replyBy: { type: ObjectId, ref: 'UserModel' },
				},
			],
		},
	],

	// Tweet image
	image: {
		type: String,
		required: true,
	},

	// Tweet author
	author: { type: ObjectId, ref: 'UserModel' },

	// Tweet date
	date: { type: Date, default: () => new Date() },

	// Tweet retweet
	retweetFrom: { type: ObjectId, ref: 'UserModel' },
	retweetDate: [{ type: Date, default: () => new Date() }],
	retweets: [{ type: ObjectId, ref: 'UserModel' }],
});

// Create TweetModel from tweetSchema
const TweetModel = mongoose.model('TweetModel', tweetSchema);

// Export TweetModel
module.exports = TweetModel;
