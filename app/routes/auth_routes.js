/* eslint-disable */
//  NPM packages
const express = require("express");
const crypto = require("crypto");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");

// imports
const {
	BadCredentialsError,
	BadParamsError,
	DuplicateKeyError,
} = require("../../lib/custom_errors");

const User = require("../models/user");

// setups
const router = express.Router();
const requireToken = passport.authenticate("bearer", { session: false });

router.get(
	"/refreshAccess",
	asyncHandler(async (req, res, next) => {
		const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

		console.log("refresher routes");
		// get the jwt refresh tocken from the cookies
		const cookies = req.cookies;

		// if no refresh token respond to json
		// but later try to throw BadCredentialsError
		if (!cookies || !cookies.jwt)
			return res.status(401).json({
				message: "Unauthorized! Cookies Refresh Token is missing",
			});

		// if refresh token, have it
		const refreshToken = cookies.jwt;

		// based on refreshToken got it from the cookies
		// verify and decode for a new access-token generator
		jwt.verify(
			refreshToken,
			process.env.REFRESH_TOKEN_SECRET,
			asyncHandler(async (err, decoded) => {
				if (err) {
					return res.status(403).json({
						message:
							"Forbidden. Refresh Token has expired.",
					});
				}



				const user = await User.findOne({ email: decoded.email });

				if (!user)
					return res
						.status(401)
						.json({ message: "Unauthorized! User not found" });

				//: generate access token again
				const accessToken = jwt.sign(
					{
						UserInfo: {
							id: user._id,
							email: user.email,
						},
					},
					process.env.ACCESS_TOKEN_SECRET,
					{ expiresIn: "1d" }
				);

				//: set users accessToken
				user.accessToken = accessToken;

				// save user
				await user.save();
				// await delay(1000);

				// response
				res.status(200).json({ user: user.toObject() });
			})
		);
	})
);

module.exports = router;
