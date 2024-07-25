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

		const newlike = await Like.create({
			owner: userId,
			reaction: likeType,
		});

		const post = await Post.findByIdAndUpdate(
			postId,
			{ $addToSet: { likes: newlike } }, // Use $addToSet to avoid duplicates
			{ new: true } // Return the updated document
		);

		console.log(post);

		/** mongoose - how to find a specific post and update it
		 * 	how to get the nested _id properties populate and return fully populated object
		 *
		 * i am gonna keep this function here as in comment for future references
		 *
		 */

		/**
			const post = await Post.findByIdAndUpdate(
				postId,
				{ $addToSet: { likes: newlike } }, // Use $addToSet to avoid duplicates
				{ new: true } // Return the updated document
				.populate({ // Populate the likes field with user detail
					path: "likes",
				populate: {
					path: "owner", // Assuming each like has an owner field
					model: "User", // Adjust to your user model name
					select: "-accessToken", // Exclude the accessToken field
				},
			});


		 */

		res.status(201).json(true);
	})
);

module.exports = router;
