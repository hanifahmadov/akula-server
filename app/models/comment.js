/* eslint-disable */
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
	{
		content: {
			type: String,
			maxlength: 280, // Twitter-like character limit
			required: false, // Optional field
		},

		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User", // Assuming you have a User model
			required: true,
		},

		media: {
			type: String, // URL or path to the image file
			required: false, // Optional field
			default: undefined,
		},

		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Like",
				required: false, // Optional field
			},
		],

		replies: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "Comment", // Assuming you have a User model
			required: false,
		},

		referral: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false, // Optional field
			default: undefined,
		},

		// parentPost: {
		// 	type: mongoose.Schema.Types.ObjectId,
		// 	ref: "Post",
		// 	required: true, // Optional field
		// },

		// parentComment: {
		// 	type: mongoose.Schema.Types.ObjectId,
		// 	ref: "Comment", // Assuming you have a User model
		// 	required: true,
		// },
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

/* this pre function will check if content or media, one of these has a value.
   if both empty, the comment will not be saved.
*/
commentSchema.pre("validate", function (next) {
	if (!this.content && !this.media) {
		this.invalidate("content", "Comment must have either content or media.");
		this.invalidate("media", "Comment must have either content or media.");
	}

	next();
});

module.exports = mongoose.model("Comment", commentSchema);
