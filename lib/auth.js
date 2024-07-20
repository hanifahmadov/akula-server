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
	// console.log("Passport auth token::");
	// console.log(token)

	/**
	 * 	// TODO
	 * 	Implement the jwt Forbidden and unauthorized requestToken
	 * 	to get rid of the passport
	 */

	
	console.log("passport auth:: reached");

	if (!token || token == "null") {
		console.log("passport token is NULL, ERROR will accur");
		return done(err);
	}

	console.log("passport auth:: requireAccessToken passed, token received");

	

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {

		console.log("token is expires auth requireToken")
		//: if jwt expired
		if (err) return done(err);

		//: if jwt is okay, pull user based on the provided user id
		//: which retrieveed from decoded token
		let user = await User.findOne({ _id: decoded.UserInfo.id });

		//# create an custom Error like UserNotFound error
		if (!user) throw new BadCredentialsError();

		return done(null, user, { scope: "all" });
	});
});

// serialize and deserialize functions are used by passport under
// the hood to determine what `req.user` should be inside routes
passport.serializeUser((user, done) => {
	// we want access to the full Mongoose object that we got in the
	// strategy callback, so we just pass it along with no modifications
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});

// register this strategy with passport
passport.use(strategy);

// create a passport middleware based on all the above configuration
module.exports = passport.initialize();
