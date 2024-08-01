/* eslint-disable */
var fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require('uuid');

const { BadCredentialsError } = require("../../lib/custom_errors");

// Storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const rootDir = path.dirname(require.main.filename);

		/* TODO */
		/* create detailed posts images for each post or user, not sure */
		const dir = rootDir + "/public/posts";


		// try {
		// 	fs.mkdirSync(dir, { recursive: true }, (err) => {
		// 		cb(err, false);
		// 	});
		// 	console.log("Directory created successfully!");
		// } catch (err) {
		// 	console.error("Error creating directory:", err);
		// }

		cb(null, dir);
	},

	filename: (req, file, cb) => {

		/* get the uploaded image extension */
		const ext = file.mimetype.split("/")[1];

		/* generate random id for uploading every file (unique name is important) */
		/* if the same image posted again, filename must be different than the other */
		const filename = uuidv4() + "." + ext;

		/* attach the filename into req object */
		/* request object will be passed to the newpost route */
		req.imagename = filename

		

		/* save the file */
		cb(null, filename);
	},
});

const fileFilter = (req, file, cb) => {
	let allowTypes = [
		"image/jpg",
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/avif",
		"image/webp",

		"image.jpg",
		"image.jpeg",
		"image.png",
		"image.gif",
		"image.avif",
		"image.webp",

		/* TODO */
		/* add extra mimetypes */
	];

	if (!allowTypes.includes(file.mimetype)) {
		return cb(new BadCredentialsError(), false);
	}

	return cb(null, true);
};

const newpost_multer = multer({ storage, fileFilter });
module.exports = newpost_multer;
