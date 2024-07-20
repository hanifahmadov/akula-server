/* eslint-disable */
var fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
	BadCredentialsError,
	BadParamsError,
	DocumentNotFoundError,
} = require("../../lib/custom_errors");
const { v4: uuidv4 } = require("uuid");
// Storage

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const rootDir = path.dirname(require.main.filename);
		const dir = rootDir + "/public/profiles/";

		const filename = req.body.email.split("@")[0];
		const existingFiles = fs.readdirSync(dir);

		existingFiles.forEach((file) => {
			if (file.startsWith(filename)) {
				fs.unlinkSync(dir + file);
			}
		});

		fs.mkdirSync(dir, { recursive: true }, (err) => {
			cb(err, false);
		});

		cb(null, dir);
	},

	filename: (req, file, cb) => {
		const ext = file.mimetype.split("/")[1];
		req.filename =
			// req.body.email.split("@")[0] + "_" + uuidv4() + "." + ext;
			req.body.email.split("@")[0] + "." + ext;
		cb(null, req.filename);
	},
});

const fileFilter = (req, file, cb) => {
	let allowTypes = [
		"image/jpg",
		"image/jpeg",
		"image/png",
		"image/gif",
		"image.jpg",
		"image.jpeg",
		"image.png",
		"image.gif",
	];

	if (!allowTypes.includes(file.mimetype)) {
		return cb(new BadCredentialsError(), false);
	}

	return cb(null, true);
};

const signup_multer = multer({ storage, fileFilter });
module.exports = signup_multer;
