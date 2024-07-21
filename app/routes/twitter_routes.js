/* eslint-disable */
//  NPM packages
const express = require("express");
const crypto = require("crypto");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const { TwitterApi } = require("twitter-api-v2");

// setups
const router = express.Router();
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

router.get(
	"/api/tweets",
	asyncHandler(async (req, res, next) => {
		try {
			const query = req.query.query || "funny"; // Replace 'example' with your default query
			let tweets = [];
			let nextToken = null;
			const maxResults = 100; // Max results per request as per Twitter API limits

			// Loop to fetch tweets in batches
			for (let i = 0; i < 10; i++) {
				const response = await twitterClient.v2.search(query, {
					"tweet.fields": "created_at,author_id",
					max_results: maxResults,
					next_token: nextToken,
				});

				if (response.data) {
					tweets = tweets.concat(response.data);
				}

				nextToken = response.meta.next_token;
                
				if (!nextToken) {
					break;
				}
			}

			res.json({ data: tweets });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	})
);

module.exports = router;
