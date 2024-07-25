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

				/* save the post which undone ther reaction*/
				await thepost.save();
			} else {
				/* change the reaction */
				currentUserLike.reaction = likeType;

				//save thepost which the reaction has been changed
				await thepost.save();
			}

			console.log("THEPOST::::>", thepost);

			/* response resolved */
			res.status(201).json(true);
		} else {
			/** else case scenario is that if the user didnt like these post before
			 * create it and save it, like it.!
			 */

			/** 1st step - CREATE A LIKE
			 * defined above - all we need:
			 * 	userId, thepost, and likeType,
			 */

			/** creating a new Like object using the Like mongoose schema, imported this file, above
			 * 	when user likes the post, the Like object will get created (detailed explanaition in the /models/like.js).
			 * 	it gets created first. important!
			 * 	cause the post object has a likes filed and it takes like object _id. so, we have to get the like _id first
			 * 	and added it to the posts like sections. it will get populated all details when all posts are getting pulled by frontend.
			 *
			 */

			/* create error handler // TODO */
			/** not error handler, create a takeback from the like, if user clicked the other icons or clikced the same icon */
			const newlike = await Like.create({
				owner: userId,
				reaction: likeType,
			});

			/** Crazyness is happening, i have a thepost already pulled in the above and now
			 * 	iam getting it again now idea how i can update the provious one with $addToSet shit
			 * 	so, i am following the old version
			 */

			/** pulled the existing post object from the database
			 * 	as mentioned above, the new created like object will be inserted to this related/liked post object.
			 *
			 * 	we are using mongoose findByIdAndUpdate() function that we can find and uppdate it on the spot.
			 * 	this function is great for these type of procedures and it depricated by mongoose already.
			 * 	it works fine but gets error in the terminal log, to fix that warning, please add: ```useFindAndModify: false```
			 * 	to the database setup. please see server.js file db connection setup.
			 */
			const post = await Post.findByIdAndUpdate(
				/* passing postId to find the post which got liked */
				postId,
				/** Use $addToSet to avoid duplicates.
				 * 	this allowes the one user can do one like type (heart, dislike or funny )
				 * 	The $addToSet operator in MongoDB is used to add a value to an array only
				 * 	if the value does not already exist in the array. addToSet checks whole objects to see if its the same not the
				 * 	specific field. $ne (not equal) checks the only sepecific filed of objects to see if it is duplicated. */
				{ $addToSet: { likes: newlike } },

				/** Return the updated document */
				{ new: true }
			);

			/** Cleanup functions
			 * 	so, as we know right now post object is full of deleted like _ids and with the valid one whic we just added.
			 * 	fist thing we are going to pull all Likes objects. find() function get all Likes object but we filter it
			 * 	by the _id is including in the post object likes array. post object is above we just pulled it and updated it.
			 *
			 * 	$in query takes an array [1, 2, 4, 5, 6] return if value is in the array.
			 * 	so, lets guess we have 20 likes, but the post has only 3 of them in the post.likes array.
			 * 	in this case Like.find({ _id: { $in: post.likes } }) will return only these 3 likes objects.
			 * 	so what we are doing here is, we have valid array of post.likes, we are just deletig that posts likes arrays
			 * 	if there is no valid like _id.
			 *
			 */

			const validLikes = await Like.find({ _id: { $in: post.likes } });

			/** now, we are mappings thoose array of objeccts  [likeObject, likeObject, likeObject], those like objects are valid
			 * 	and exsiting. now we are mapping thoose object and returning an array with thoses object _id
			 */
			const validLikeIds = validLikes.map((like) => like._id);

			/** and updating the post likes array with only valid likes  */
			post.likes = validLikeIds;

			/** saving the post */
			await post.save();

			console.log("POST::>", post);

			/* response resolved */
			res.status(201).json(true);
		}
	})
);

module.exports = router;
