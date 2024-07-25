const mongoose = require("mongoose");
const { Schema } = mongoose;

const reactionTypes = ["heart", "smile", "dislike", "wow", "sad", "angry"];

const LikeSchema = new Schema(
	{
		owner: {
			type: Schema.Types.ObjectId,
			ref: "User",
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
