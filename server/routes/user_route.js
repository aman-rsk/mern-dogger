// Import necessary modules and dependencies
const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const UserModel = require('../models/user_model.js');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// Define the signup route
router.post('/signup', async (req, res) => {
	try {
		const {
			fullName,
			email,
			password,
			profileImg,
			backgroundwallpaper,
			location,
			DOB,
			bio,
			followers,
			following,
		} = req.body;
		// Check if all mandatory fields are provided
		if (!fullName || !email || !password || !location || !DOB) {
			return res
				.status(400)
				.json({ error: 'Please enter all mandatory fields' });
		}

		// Check if a user with the provided email already exists in the database
		const userInDB = await UserModel.findOne({ email: email });
		if (userInDB) {
			return res
				.status(500)
				.json({ error: 'User with this email already exists' });
		}

		// Hash the user's password and create a new user object
		const hashedPassword = await bcryptjs.hash(password, 16);
		const user = new UserModel({
			fullName,
			email,
			password: hashedPassword,
			backgroundwallpaper,
			profileImg,
			location,
			DOB,
			bio,
			followers,
			following,
		});

		// Save the new user to the database and return a success message
		const newUser = await user.save();
		res.status(201).json({
			result: 'User signed up successfully',
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({ error: error.message });
	}
});

// This is a backend route for user login, which accepts user email and password in the request body
router.post('/login', (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		// Checking if email or password is not provided, then sending an error response
		return res.status(400).json({ error: 'Please enter all mandatory fields' });
	}
	// Checking if a user with the provided email exists in the database or not
	UserModel.findOne({ email: email })
		.then((userInDB) => {
			if (!userInDB) {
				// If the user doesn't exist in the database, sending an error response
				return res.status(401).json({ error: 'Invalid Credentials' });
			}

			// Comparing the provided password with the hashed password stored in the database
			bcryptjs
				.compare(password, userInDB.password)
				.then((didMatch) => {
					if (didMatch) {
						// If the password matches, creating a JSON web token for the user
						const jwtToken = jwt.sign({ _id: userInDB._id }, JWT_SECRET);

						// Creating an object with user information that is required by the frontend
						const userInfo = {
							_id: userInDB._id,
							email: userInDB.email,
							fullName: userInDB.fullName,
							profileImg: userInDB.profileImg,
							backgroundwallpaper: userInDB.backgroundwallpaper,
							location: userInDB.location,
							DOB: userInDB.DOB,
							bio: userInDB.bio,
							followers: userInDB.followers,
							following: userInDB.following,
						};

						// Sending a success response with the token and user information
						res
							.status(200)
							.json({ result: { token: jwtToken, user: userInfo } });
					} else {
						// If the password doesn't match, sending an error response
						return res.status(401).json({ error: 'Invalid Credentials' });
					}
				})
				.catch((err) => {
					console.log(err);
				});
		})
		.catch((err) => {
			console.log(err);
		});
});

// Get user data for update REST API
router.get('/updatedata/:_id', async (req, res) => {
	// Extract user id from request parameters
	const userId = req.params._id;
	// Find user in database with the given id
	try {
		const user = await UserModel.findOne({ _id: userId });
		if (user) {
			// If user found, send user data as response
			res.send(user);
		} else {
			// If user not found, send error message
			res.send({ error: 'User not found' });
		}
	} catch (err) {
		// If there is an error, send error message
		res.send({ error: err.message });
	}
});

// Update user data REST API
/* we can use the same address for two different API functionalities, but their HTTP methods should be different. For example, we can use the same address for router.get and router.put because they both have different HTTP methods. */
router.put('/updatedata/:_id', async (req, res) => {
	// Extract user id from request parameters
	const userId = req.params._id;
	try {
		// Update the user data with the new data in the request body
		const result = await UserModel.updateOne(
			{ _id: userId },
			{ $set: req.body }
		);
		// Send the result as response
		res.send(result);
	} catch (err) {
		// If there is an error, send error message
		res.send({ error: err.message });
	}
});

// Search REST API to search for users from the search bar
router.get('/search/:key', async (req, res) => {
	// Extract the search key from request parameters
	const searchKey = req.params.key;
	try {
		// Find users in the database that match the search key in any of the specified fields
		const result = await UserModel.find({
			$or: [
				{ fullName: { $regex: searchKey } },
				{ email: { $regex: searchKey } },
				{ location: { $regex: searchKey } },
			],
		});
		// Send the result as response
		res.send(result);
	} catch (err) {
		// If there is an error, send error message
		res.send({ error: err.message });
	}
});

module.exports = router;
