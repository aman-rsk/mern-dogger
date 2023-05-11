// Import required modules and setup file storage
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Specify the upload directory
		cb(null, 'uploads/');
	},
	filename: (req, file, cb) => {
		// Set the filename to be the original file name
		console.log(file);
		cb(null, file.originalname);
	},
});

// Create a multer instance for handling file uploads
const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		// Allow only certain file types
		if (
			file.mimetype === 'video/mp4' ||
			file.mimetype === 'image/png' ||
			file.mimetype === 'image/jpg' ||
			file.mimetype === 'image/jpeg' ||
			file.mimetype === 'image/gif'
		) {
			cb(null, true);
		} else {
			cb(null, false);
			return res
				.status(400)
				.json({ error: 'Please upload gif,jpg, png, jpeg filetype only' });
		}
	},
});

// Handle file upload requests
router.post('/uploadfile', upload.single('file'), function (req, res) {
	res.status(201).json({ fileName: req.file.filename });
});

// Handle file download requests
const downloadFile = (req, res) => {
	const fileName = req.params.filename;
	const path = __basedir + '/uploads/';

	// Download the requested file
	res.download(path + fileName, (error) => {
		if (error) {
			res.status(500).send({ message: 'File cannot be downloaded' + error });
		}
	});
};
router.get('/files/:filename', downloadFile);

// Export the router for use in other modules
module.exports = router;
