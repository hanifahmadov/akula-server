/* eslint-disable */
//  NPM packages
const express = require("express");
const asyncHandler = require("express-async-handler");

/* IMPORTS FOR requireTOKEN SETUP LINE 25 */
const passport = require("passport");

/*  IMPORTS */
const { BadCredentialsError, BadParamsError, DuplicateKeyError } = require("../../lib/custom_errors");

/** Schemas */
const Like = require("../models/like");
const Post = require("../models/post");
const Comment = require("../models/comment");

/* PASSPORT WILL CHECK THE TOKEN */
const requireToken = passport.authenticate("bearer", { session: false });

/* START ROUTER */
const router = express.Router();

router.put(
	"/replies/:replyId/reaction",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/** get all properties */
		const { replyId } = req.params;
		const { likeType } = req.body;
		const { _id: userId } = req.user;

		/** retrieve valid data */
		const theReply = await Comment.findById(replyId)

		console.log("heyy, reply", theReply);

		/* find the curr user's like */
		// let currUserLike = await theReply.likes.find((like) => like.owner._id.equals(userId));

		// console.log("heyy, currUserLikes", currUserLike);

		/** create new Like */
		// const newLike = await Like.create({
		// 	owner: userId,
		// 	reaction: likeType,
		// });

		// /** add it to the reply likes array */
		// await theReply.likes.push(newLike._id);

		// await theReply.save()

		// response
		res.status(201).json({ created: theReply });
	})
);

module.exports = router;
