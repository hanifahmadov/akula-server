router.put(
	"/posts/:postId/like",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/* GET PROPERTIES FRO THE HOST */

		const { postId } = req.params;
		const { likeType } = req.body;
		const { _id: userId } = req.user;

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

		console.log(post);

		res.status(201).json(true);

		// # BUG #

		/** console.log(post);
		 * 	post resposen like array is full but I have one like only: 
		 * 
		 * likes: [
					66a11e4215e3b26984c0e641,
					66a11efb607e9b6a0a1d51e7,
					66a12114b38f126a6879cb08,
					... (10 more _id here)

				],

		 * 	the consoled post object in the terminal. 
		 * 	THE post document retains references to likes that have already been deleted from the likes collection in your MongoDB database. 
		 * 
		 * 	whats happening, so I deleted the whole likes object in the database and liked the post to create the new like object.
		 * 	it created a new liked and added to the post object, but when I deleted the like object it gets deleted but the _id is not
		 * 	deleting from the post objects in the database, beacuse of non-relational database connections.
		 * 	thas why, when you pull the existing post to add the new like id, it brings all previously deleted ids also.
		 * 	so , how to handle this issue ?!
		 * 
		 * 	mongoDB is non-relational database, which means we have to build own cleanup function to handle this issue. 
		 * 	so, we have to pull all likes ( related to this post ), and iterate over them and keep the existing ones in the post likes.
		 * 	i will explained more detailed in steps while implementing.
		 * 
		 * 	we can do it inside this route or using pre save hook inside the modal.
		 * 	i am going to do it here fist but later I will move it to the pre save hook later. // TODO
		 * 	
		 */

		/* ***************** */

		/** mongoose - how to find a specific post and update it
		 * 	how to get the nested _id properties populate and return fully populated object
		 *
		 * i am gonna keep this function here as in comment for future references
		 *
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
	})
);

module.exports = router;
