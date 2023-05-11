//Importing necessary packages and modules
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const userRoute = require('./routes/user_route');
const tweetRoute = require('./routes/tweet_route');
const fileRoute = require('./routes/file_route');
const OtherUserProfileRoute = require('./routes/otheruserprofile_route');

const { MONGOBD_URL } = require('./config');

//Set up server port and base URL
const port = process.env.PORT || 4000;
const baseUrl = process.env.BASE_URL;

//Define global variable for base directory
global.__basedir = __dirname;

//Enable strict query in Mongoose
mongoose.set('strictQuery', true);

//Connect to MongoDB database
mongoose.connect(MONGOBD_URL);
mongoose.connection.on('connected', () => {
	console.log('Database connected');
});
mongoose.connection.on('error', (error) => {
	console.log('Database not connected');
});

//Set up middleware to allow cross-origin resource sharing and parse incoming requests as JSON
app.use(cors());
app.use(express.json());

//Set up routes for the API
app.use('/', userRoute);
app.use('/', tweetRoute);
app.use('/', fileRoute);
app.use('/', OtherUserProfileRoute);

//Start the server and listen for incoming requests
app.listen(port, () => {
	console.log(`Server started at ${baseUrl}:${port}`);
});
