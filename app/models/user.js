/* eslint-disable */
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			match: [
				/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/,
				"Email Validation Error: email is not matched with internal regex",
			],
		},
		hashedPassword: {
			type: String,
			required: true,
		}, 

		username: {
			type: String,
			sparse: true, // Allows multiple documents to have no value for the indexed field
			unique: true,
			trim: true,
		},

		role: {
			type: String,
			default: "user",
			enum: ["user", "editor", "admin"],
		},

		avatar: {
			type: String,
			// TODO 
			// updatet the github express login template also
			default: "default01.jpeg",
		},

		blocked: {
			type: Boolean,
			default: false,
		},

		accessToken: {
			type: String,
			default: null,
			trim: true,
		}
	},

	{
		timestamps: true,
		toObject: {
			// removes `hashedPassword` field when returns user.toObject()
			// check it out user_routes.js line 45 post sign up
			transform: (_doc, user) => {
				delete user.hashedPassword;
				return user;
			},
		},
	}
);

module.exports = mongoose.model("User", userSchema);
