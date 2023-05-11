// Import required dependencies
const { json } = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Import JWT_SECRET from config
const { JWT_SECRET } = require('../config');

// Import UserModel from Mongoose
const UserModel = mongoose.model('UserModel');

// Define protectedRoute middleware function
const protectedRoute = (module.exports = (req, res, next) => {
	// Get the authorization token from the request headers
	const { authorization } = req.headers;

	// If no authorization token is provided, send an error response
	if (!authorization) {
		return res.status(401).json({
			error:
				"Please provide an authentication token in the 'Authorization' header with the format 'Bearer yourtoken'.",
		});
	}

	// Extract the JWT from the authorization token
	const token = authorization.replace('Bearer ', '');

	// Verify the JWT using the secret key
	jwt.verify(token, JWT_SECRET, (error, payload) => {
		// If the JWT is invalid, send an error response
		if (error) {
			return res.status(401).json({ error: 'User not logged in' });
		}

		// Extract the user ID from the JWT payload
		const { _id } = payload;

		// Find the user in the database using the user ID
		UserModel.findById(_id).then((dbUser) => {
			// Add the user object to the request object
			req.user = dbUser;

			// Call the next middleware function
			next();
		});
	});
});

// Export the protectedRoute middleware function
module.exports = protectedRoute;
