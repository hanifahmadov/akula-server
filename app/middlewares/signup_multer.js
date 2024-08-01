/* eslint-disable */
var fs = require("fs");
const path = require("path");
const multer = require("multer");
const { BadCredentialsError, BadParamsError, DocumentNotFoundError } = require("../../lib/custom_errors");
const { v4: uuidv4 } = require("uuid");
// Storage

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const rootDir = path.dirname(require.main.filename);
		const dir = rootDir + "/public/profiles/";

		/* deleting the previous image */
		/* if user update his profile image, we haveto delete the prevoius one  */

		/* get the user email address which is unique */
		const filename = req.body.email.split("@")[0];
		/* get all the image files */
		const existingFiles = fs.readdirSync(dir);

		/* iterate all uplaoded image file and delete the image which name start with user email */
		existingFiles.forEach((file) => {
			if (file.startsWith(filename)) {
				fs.unlinkSync(dir + file);
			}
		});

		/* then create the folder */
		fs.mkdirSync(dir, { recursive: true }, (err) => {
			cb(err, false);
		});

		/* write to the file */
		cb(null, dir);
	},

	filename: (req, file, cb) => {
		const ext = file.mimetype.split("/")[1];

		const filename = req.body.email.split("@")[0] + "." + ext;

		/* attach the filename into req object */
		/* request object will be passed to the newpost route */
		req.filename =
			// req.body.email.split("@")[0] + "_" + uuidv4() + "." + ext;
			req.body.email.split("@")[0] + "." + ext;
		cb(null, req.filename);

		cb(null, req.filename);
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
	];

	if (!allowTypes.includes(file.mimetype)) {
		return cb(new BadCredentialsError(), false);
	}

	return cb(null, true);
};

const signup_multer = multer({ storage, fileFilter });
module.exports = signup_multer;
