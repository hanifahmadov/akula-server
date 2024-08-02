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

/** Schemas */
const Like = require("../models/like");
const Post = require("../models/post");
const Comment = require("../models/comment");

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

		/* checking if the avatar image is provided or not */
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

/** Getting all posts, request from Homejs useEffect on submit and liketype change */
router.get(
	"/posts",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/**
		 *  here we haveto populated all detailed nested objects
		 * 	owner, likes, like_owners
		 *
		 * 	explanation: first all posts owner will be populated and then likes will be populated.
		 * 	its possible to chain the populated functions.
		 * 	then likes object has a owner property _id (mongoose ID, fyu - only mongoose ID can be populated)
		 * 	so, we can add another populated property with pass and model and selected option
		 * 	inside populate() function to get the nested objects populated.
		 *
		 * 	fyi - Post.find() will get all posts single first, populate it then will store inside allpost as an array.
		 */
		const allPosts = await Post.find()
			.populate({
				path: "owner",
				select: "-accessToken -hashedPassword",
			})
			.populate({
				path: "likes",
				populate: {
					path: "owner",
					model: "User",
					select: "-accessToken -hashedPassword",
				},
			})
			.populate({
				path: "comments",
				populate: [
					{
						path: "owner",
						model: "User",
						select: "-accessToken -hashedPassword",
					},
					{
						path: "replies",
						model: "Comment",
						populate: [
							{
								path: "owner",
								model: "User",
								select: "-accessToken -hashedPassword",
							},
							{
								path: "likes",
								model: "Like",
								populate: [
									{
										path: "owner",
										model: "User",
										select: "-accessToken -hashedPassword",
									},
								],
							},

							{
								path: "referral",
								model: "User",
								select: "-accessToken -hashedPassword",
							},

							{
								path: "replies",
								model: "Comment",
								populate: [
									{
										path: "owner",
										model: "User",
										select: "-accessToken -hashedPassword",
									},

									{
										path: "referral",
										model: "User",
										select: "-accessToken -hashedPassword",
									},
									{
										path: "likes",
										model: "Like",
										populate: [
											{
												path: "owner",
												model: "User",
												select: "-accessToken -hashedPassword",
											},
										],
									},
								],
							},
						],
					},
					{
						path: "likes",
						model: "Like",
						populate: {
							path: "owner",
							model: "User",
							select: "-accessToken -hashedPassword",
						},
					},
				],
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

		console.log(postId);

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
		let currentUserLike = await thepost.likes.find((like) => like.owner.equals(userId));

		console.log("currentUserLike", currentUserLike);
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
				thepost.likes = await thepost.likes.filter((like) => !like.owner.equals(userId));
				// Remove the like document from the Likes collection
				await Like.findByIdAndDelete(currentUserLike._id);
			} else {
				/* change the reaction */
				currentUserLike.reaction = likeType;
				await currentUserLike.save(); // Save the updated like document
			}

			/* save the post which undone ther reaction*/
			await thepost.save();
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
			 * 	so, i am following the old version.
			 *
			 * 	goodnews, I just got rid off the old version that pulls post again.
			 */

			/* previous version */
			// const post = await Post.findByIdAndUpdate(postId, { $addToSet: { likes: newlike } }, { new: true });

			/* new version */
			await thepost.likes.push(newlike._id);

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

			const validLikes = await Like.find({ _id: { $in: thepost.likes } });

			/** now, we are mappings thoose array of objeccts  [likeObject, likeObject, likeObject], those like objects are valid
			 * 	and exsiting. now we are mapping thoose object and returning an array with thoses object _id
			 */
			const validLikeIds = validLikes.map((like) => like._id);

			/** and updating the post likes array with only valid likes  */
			thepost.likes = validLikeIds;

			/** saving the post */
			await thepost.save();

			// console.log("the  ---  thepost::>", thepost);

			/* response resolved */
			res.status(201).json(true);
		}
	})
);

/** create a new comment for the specific post.
 *  receiving that post id via URl (req.params) and the data.
 *  the current user will be attached to req object like req.user
 */
router.post(
	"/posts/:postId/addcomment",
	requireToken,
	/** add multer to handle the picture or any media of the comments if uploaded, later */
	// newpost_multer.single("image"),
	asyncHandler(async (req, res, next) => {
		/* GET PROPERTIES FRO THE HOST */
		const { commentText } = req.body;
		const { _id: userId } = req.user;
		const { postId } = req.params;

		/** create a Comment */
		const comment = await Comment.create({
			content: commentText,
			owner: userId,
		});

		/** now, pull the post */
		const thepost = await Post.findById(postId);

		/* the post has a comments section data type is array. */
		await thepost.comments.push(comment._id);

		/* save the updated post */
		await thepost.save();

		// response
		res.status(201).json({ created: true });
	})
);

/** reply to a specific comment.
 *  receiving 2 ids the post id and comment id.
 *
 * 	user replies a comment in the his/someones post comment section.
 *
 *  1. find the post by postId (sending via url)
 * 	2. find the post's that comment by commendId (sending via url)
 *  3. create a reply to that comment by adding that reply to comment.replies n save
 * 	4. save the comment and post both
 *
 * 	5. populated all those replies in the about getPosts response
 *
 *
 */
router.put(
	"/posts/:postId/comments/:commentId",
	requireToken,
	/** add multer to handle the picture or any media of the comments if uploaded, later */
	// newpost_multer.single("image"),
	asyncHandler(async (req, res, next) => {
		/* get both ids from the req.params */
		const { postId, commentId } = req.params;

		/* get the replyText from the req.boyd */
		const { replyText } = req.body;

		/* get userId from the req.user object */
		const { _id: userId } = req.user;

		/* 1. find the post by postId (sending via url)*/
		const thePost = await Post.findById(postId).populate("comments");

		/** 2. find the post's that comment by commendId (sending via url)
		 *
		 * using the js helper functions find() to get a single value, map return an array and forEach doesn return a all
		 * in this case
		 * 	await thePost.comments.find(comment => comment._id === com)
		 * doesnt work, because the id we grabbing from the req.params are just a string
		 * but comment._id is Mongoose Object Id, different type of id, those are not ===
		 * in this case we have to use built-in .equal() like this => comment._id .equals(commentId)
		 * OR use == (checks the value only), not triple === (triple === checks the type and value)
		 *
		 */
		const theComment = await thePost.comments.find((comment) => comment._id == commentId);

		/** 3. create a reply and...
		 *  Comment schema fields ( content, owner-required, media, likes )
		 *  Comment schema has a pre-save function to check if content or media must be present.
		 * 	but for now no need to add another media section to replies (later)
		 */

		const replyComment = await Comment.create({
			content: replyText,
			owner: userId,
		});

		/*  and add that replyComment to the Comment.replies which has been pulled from dbs in the above*/
		await theComment.replies.push(replyComment);

		/* and save theComment */
		await theComment.save();

		/* and save thePost */
		await thePost.save();

		/* FYI - posts are getting an a huge object that is going to be fucked up when pulling all posts from the database */
		console.log(thePost);

		// response
		res.status(201).json({ created: true });
	})
);

module.exports = router;
