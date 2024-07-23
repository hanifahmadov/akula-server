/* eslint-disable */
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
	{
		content: {
			type: String,
			maxlength: 280, // Twitter-like character limit
		},

		owner: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User", // Assuming you have a User model
			required: true,
		},

		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],

        dislikes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
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

module.exports = mongoose.model("Comment", commentSchema);
