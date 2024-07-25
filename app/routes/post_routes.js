/* eslint-disable */
//  NPM packages
const express = require("express");
const asyncHandler = require("express-async-handler");

/* IMPORTS FOR requireTOKEN SETUP LINE 25 */
const passport = require("passport");

// const crypto = require("crypto");
// const passport = require("passport");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
// const multer  = require('multer')
// const signup_multer = require('../middlewares/signup_multer')

/*  IMPORTS */
const { BadCredentialsError, BadParamsError, DuplicateKeyError } = require("../../lib/custom_errors");
const Post = require("../models/post");

/** Like schema using creating the Like object when users like the post
 *
 */
const Like = require("../models/like");

const chalk = require("chalk");
const newpost_multer = require("../middlewares/newpost_multer");

/* START ROUTER */
const router = express.Router();

/* PASSPORT WILL CHECK THE TOKEN */
const requireToken = passport.authenticate("bearer", { session: false });

/* POST */
router.post(
	"/newpost",
	requireToken,
	newpost_multer.single("image"),
	asyncHandler(async (req, res, next) => {
		/* GET PROPERTIES FRO THE HOST */
		const { text } = req.body;
		const { baseurl } = req.body;
		const { _id } = req.user;
		const { imagename } = req;

		/* check if avatar image is provided or not */
		const avatarAddress = imagename ? baseurl + "/" + imagename : undefined;

		/* CREATE THE POST */
		const post = await Post.create({
			content: text,
			owner: _id,
			media: avatarAddress,
		});

		// response
		res.status(201).json({ created: true });
	})
);

/* GET */
router.get(
	"/posts",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/* GET PROPERTIES FRO THE HOST */
		const allPosts = await Post.find()
			.populate({
				path: "owner",
				select: "-accessToken -_id", // Exclude accessToken and _id fields
			})
			.exec();

		// response
		res.status(201).json({ posts: allPosts });
	})
);

/* LIKE POST WITH PUT REQUEST */
/**
 * 	GENERAL INFORMATION HERE TOMORROW EXPLAIN WHATS GOING ON
 */
router.put(
	"/posts/:postId/like",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/* GET PROPERTIES FRO THE HOST */

		const { postId } = req.params;
		const { likeType } = req.body;
		const { _id: userId } = req.user;

		/** Decision Algorithm */

		/** we can have 3 types of likeType [ heart, funny, dislike ]
		 *
		 *
		 * 1. i can get pull the post and with populated all its likes, its gonna [ like{}, like{}, like{}, like{}]
		 * 	  1a. if no any like below to this user, create one
		 *
		 * 	  1b. so, only one user can like one post, that means there is only one like belongs to current user (req.user._id)
		 *
		 * 2. iterate that like array and find that like belongs to this user  like { owner, reaction }
		 *
		 * 3. if reaction === likeType, delete that like from the likes array
		 *
		 * 4. if reaction !== likeType, then update it. and save it. remember reference way to update it.
		 *
		 */

		/** action 1 - get the post with all populated likes  */
		const thepost = await Post.findById(postId).populate("likes");

		/** 1ab check if this user has a like. we have a little problem here, when i use map here map returns array of true and false
		 * in the array if there is 50 likes its gonna be [false false fasle true ...], so thanks javascript for the find function
		 * that it will return a single value of the object i am looking for or undefined
		 */
		let currentUserLike = thepost.likes.find((like) => like.owner.equals(userId));

		/** currentUserLike is going to be true or false in the array, cause map returns array when mapping an array */
		/** if this is true, it means user has a like on this post
		 * but if it is false it ill go to else condition which will create a whole new like and updade the post
		 */

		if (currentUserLike) {
			/** okay, great section starts here, now we have to check the likeType is the same or not.
			 * if its the same we have to do undo the like else we have to update the like reaction
			 */
			if (currentUserLike.reaction === likeType) {
				/* undo */
				thepost.likes = thepost.likes.filter((like) => !like.owner.equals(userId));

				/* save */
				await thepost.save();
			} else {
				/* change the reaction */
				currentUserLike.reaction = likeType;

				//save thepost
				await thepost.save();
			}
		} else {
		}

		console.log(thepost);
	})
);

module.exports = router;
