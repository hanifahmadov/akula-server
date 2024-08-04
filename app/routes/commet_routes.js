/* eslint-disable */
//  NPM packages
const express = require("express");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

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
	"/comments/:commentId/reaction",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/** get all properties */
		const { commentId } = req.params;
		const { likeType } = req.body;
		const { _id: userId } = req.user;

		/** retrieve valid Comment and populated likes */
		let theComment = await Comment.findById(commentId).populate({ path: "likes", model: "Like" });

		/* find the current user's like */

		let theLike = await theComment.likes.find((like) => like.owner._id.equals(userId));

		/* if user has a like, then just update it */
		if (theLike) {
			/* if the same likeType, remove the like */
			if (theLike.reaction == likeType) {
				/* remove from the array */
				theComment.likes = await theComment.likes.filter((like) => !like.owner._id.equals(userId));

				/* delete that like itself */
				await Like.findByIdAndDelete(theLike._id);
			} else {
				/* if likeType is different, then update it */
				theLike.reaction = likeType;

				/** save theLike here,
				 *  cause if theLike is undefined,
				 *  cant get saved all the way down
				 * */
				await theLike.save();
			}
		} else {
			/* else means there is no like belongs to this user, so create one */
			/** create new Like */
			const newLike = await Like.create({
				owner: userId,
				reaction: likeType,
			});

			/** add it to the reply likes array */
			await theComment.likes.push(newLike._id);
		}

		/* save all shits */
		await theComment.save();

		/** cant save here if its undefined
		 *  means if current user has no like before, its undefined
		 *  in filter function in the above
		 */

		// await theLike.save();

		// response
		res.status(201).json({ created: true });
	})
);

/**
 * 	addReplyAPI
 * 	client side calls
 *
 * */
router.post(
	"/comments/:commentId/addreply",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/** get all properties */
		const { commentId } = req.params;
		const { replyText, referralId } = req.body;
		const { _id: userId } = req.user;

		/* get the comment */
		const theComment = await Comment.findById(commentId);

		console.log(referralId)


		// /* create reply - its also a comment */
		const newComment = await Comment.create({
			content: replyText,
			referral: referralId,
			owner: userId,
		});

		/* add to replies */
		await theComment.replies.push(newComment._id);

		/* save */
		await theComment.save();



		// response
		res.status(201).json({ created: true });
	})
);

module.exports = router;
