const mongoose = require("mongoose");
const { Schema } = mongoose;

const reactionTypes = ["heart", "smile", "dislike", "wow", "sad", "angry"];

const LikeSchema = new Schema(
	{
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User", // Assuming you have a User model
			required: true,
		},

		reaction: {
			type: String,
			enum: reactionTypes,
			required: true,
		},
	},
	{ timestamps: true }
);

const Like = mongoose.model("Like", LikeSchema);

module.exports = Like;
