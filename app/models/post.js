/* eslint-disable */
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
	{
		content: {
			type: String,
			maxlength: 280, // Twitter-like character limit
		},

		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User", // Assuming you have a User model
			required: true,
		},

		media: {
			type: String, // URL or path to the image file
			required: false, // Optional field
			default: undefined 
		},

		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Like",
			},
		],

		comments: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Comment",
			},
		],
	},

	{
		timestamps: true,
		toObject: {
			// removes `hashedPassword` field when returns user.toObject()
			// check it out user_routes.js line 45 post sign up
			transform: (_doc, ret) => {
				// console.log("ret inside post schema", ret);
				return ret;
			},
		},
	}
);

module.exports = mongoose.model("Post", postSchema);
