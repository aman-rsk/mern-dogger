// Import Mongoose and extract ObjectId
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// Define a schema for user objects
const userSchema = new mongoose.Schema({
	fullName: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	location: {
		type: String,
		required: true,
	},
	DOB: {
		type: String,
		required: true,
	},
	bio: {
		type: String,
		default: "Hey, I'm on Fire",
	},
	backgroundwallpaper: {
		type: String,
		default:
			'https://images.unsplash.com/photo-1486520299386-6d106b22014b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1469&q=80',
	},
	profileImg: {
		type: String,
		default:
			'https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fG1lbnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
	},
	followers: [
		{
			type: ObjectId,
			ref: 'UserModel',
		},
	],
	following: [
		{
			type: ObjectId,
			ref: 'UserModel',
		},
	],
});

// Create a Mongoose model for users using the schema
const UserModel = mongoose.model('UserModel', userSchema);

// Export the user model for use in other modules
module.exports = UserModel;
