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
		let theReply = await Comment.findById(replyId).populate({ path: "likes", model: "Like" });

		/* find the current user's like */
		let theLike = await theReply.likes.find((like) => like.owner._id.equals(userId));


		/* if user has a like, then just update it */
		if (theLike) {
			/* if the same likeType, remove the like */
			if (theLike.reaction == likeType) {
				/* remove from the array */
				theReply.likes = await theReply.likes.filter((like) => !like.owner._id.equals(userId));

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
			await theReply.likes.push(newLike._id);
		}

		
		/* save all shits */
		await theReply.save();

		// response
		res.status(201).json({ created: theReply });
	})
);



router.post(
	"/replies/:rereplyid/addrereply",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/** get all properties */
		const { rereplyid } = req.params;
		const { reReplyText, referralId} = req.body;
		const { _id: userId } = req.user;



		/* get the comment */
		const theReReply = await Comment.findById(rereplyid);

		/* create reply - its also a comment */
		const newComment = await Comment.create({
			content: reReplyText,
			referral: referralId,
			owner: userId,
		});

		/* add to replies */
		await theReReply.replies.push(newComment._id);

		/* save */
		await theReReply.save();

		// response
		res.status(201).json({ created: true });
	})
);

// url: `${apiUrl}/replies/${replyId}/add_sub_reply`,

router.post(
	"/replies/:replyId/add_sub_reply",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/** get all properties */
		const { replyId } = req.params;
		const { replyText, referralId, storageId } = req.body;
		const { _id: userId } = req.user;


		/* get the replied-comment */
		const theComment = await Comment.findById(storageId);


		/* create reply - its also a comment */
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






