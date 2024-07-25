/* eslint-disable */
// require authentication related packages
const passport = require("passport");
const bearer = require("passport-http-bearer");
const jwt = require("jsonwebtoken");

// user model will be used to set `req.user` in
// authenticated routes
const User = require("../app/models/user");
const { BadCredentialsError } = require("./custom_errors");

// this strategy will grab a bearer token from the HTTP headers and then
// run the callback with the found token as `token`
const strategy = new bearer.Strategy(function (token, done) {

	
	/* if you used  requireToken middleware in any routes, it will use this file */
	// console.log("PASSPORT STRATEGY USED")

	

	/**
	 * 	// TODO
	 * 	Implement the jwt Forbidden and unauthorized requestToken
	 * 	to get rid of the passport
	 */

	/* TODO */
	/* IF NO TOKEN, PROVIDE A VALID NO TOKEN ERROR HANDLER */
	if (!token || token == "null") {
		console.log("AUTH LINE 31, NO TOKEN");
		return done(err);
	}



	/* CHECKIN TOKEN DATES TO SEE IF EXPIRED OR NOT  */
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {


		/* IF EXPIRED */
		/* TODO */
		/* PROVIDE A VALID ERROR TO SEE TOKEN EXPIRED */
		if (err) return done(err);

		/* IMPORTANT */
		/* if token is okay, this pulls user based on the provided user id */
		/* which retrieved from decoded token */
		let user = await User.findOne({ _id: decoded.UserInfo.id });

		/* TODO */
		/* create an custom Error like UserNotFound error */
		if (!user) throw new BadCredentialsError();

		/* USER OBJECT WILL BE ATTACHED */
		/* USER object will be attached to req object but not sure it happens here or not */
		return done(null, user, { scope: "all" });
	});
});

// serialize and deserialize functions are used by passport under
// the hood to determine what `req.user` should be inside routes
passport.serializeUser((user, done) => {
	// we want access to the full Mongoose object that we got in the
	// strategy callback, so we just pass it along with no modifications

	console.log("PASSPORT SERIALIZER USED")
	done(null, user);
});

passport.deserializeUser((user, done) => {

	console.log("PASSPORT DE-SERIALIZER USED")
	done(null, user);
});

// register this strategy with passport
passport.use(strategy);

// create a passport middleware based on all the above configuration
module.exports = passport.initialize();
