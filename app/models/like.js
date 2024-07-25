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

LikeSchema.index({ user: 1, post: 1 }, { unique: true });

const Like = mongoose.model("Like", LikeSchema);

module.exports = Like;
