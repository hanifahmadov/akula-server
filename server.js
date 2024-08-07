/* eslint-disable */
/* NPM packages */
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookies = require("cookie-parser");
const path = require("path");
const bodyParser = require("body-parser");

/* CREATE .ENV FILE  */
require("dotenv").config({ path: path.join(__dirname, ".env") });

/* DATABASE */
/* CHECKOUT DB FILE, THE URL OR DB CONNECTION IS READING .ENV FILE */
const db = require("./config/db");

/* PASSPORT MIDDLEWARE */
const auth = require("./lib/auth");

/* ERROR HANDLERS */
const errorHandler = require("./lib/error_handler");

/* LOGS ALL INCOMING ROUTES */
const requestLogger = require("./lib/request_logger");

/* ALL ROUTES */
const userRoutes = require("./app/routes/user_routes");
const authRoutes = require("./app/routes/auth_routes");
const postRoutes = require("./app/routes/post_routes");
const commentRoutes = require("./app/routes/commet_routes");

/* CROSS PLATFORM ACCESS */
const corsOptions = require("./config/corsOptions");

/* Passport docs: http://www.passportjs.org/docs/ */
const passport = require("passport");

/* SETUP ACCESS SERVER PORT */
/* on production mode it defines in .env file, but development mode its 3040 */
/* check out .env file */
const PORT = process.env.PORT || 3040;

/* ESTABLISH DATABASE CONNECTION */
/** if we are using mongoose findByIdAndUpdate() function that we can find and uppdate it on the spot.
 * 	this function is great for these type of procedures and it depricated by mongoose already.
 * 	it works fine but gets error in the terminal log, to fix that warning, please add: ```useFindAndModify: false```
 * 	to the database setup. please see server.js file db connection setup. */
mongoose
	.connect(db, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useUnifiedTopology: true,
		/* if u using findByIdAndUpdate, description in the above*/
		useFindAndModify: false,
	})
	.then(console.log(":: MongoDB connection successfull"));

/* SETUPS */
/* START AN SERVER NAMED APP */
const app = express();

/* CORS OPTIONS APPLIED */
app.use(cors(corsOptions));

/* COOKIES APPLIED */
app.use(cookies());

/* this parses requests sent by `$.ajax`, which use a different content type */
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* ORDER IS IMPORTANT IN EXPRESS */
/* REQUESTS GET ATUHENTICATED IN PASSPORT */
app.use(auth);

/* JSON FILES HANDLER BUILT-IN */
app.use(express.json());

/* APP READS STATIC FILES SHOWED DIRECTION WITH PATH */
/* SHOW IMAGE FILES DIRECTORY */
app.use(express.static(path.join(__dirname, "public/defaults")));
app.use(express.static(path.join(__dirname, "public/profiles")));
app.use(express.static(path.join(__dirname, "public/posts")));

/* LOGS EVERY REQUESTS */
app.use(requestLogger);


/* FOR TEST PERPUSES */
/* TRY SERVER URL IN THE BROWSER. IF YOU ARE ON LOCAL, TRY localhost:3040  */
app.get("/", (req, res) => res.json({ message: "welcome to chat akula" }));

/* IMPORTANT */
/* WHEN PAGE RELOAD OF REFRESH, USER TOKEN GET AUTHENTICATED AND REGENRATED */
app.use(authRoutes);

/* IMPORTANT */
/* ALL SING IN-UP-PASSWORD REQUESTS */
app.use(userRoutes);

/* IMPORTANT */
/* ALL POSTS REQUESTS */
app.use(postRoutes);


/* IMPORTANT */
/* ALL REPLY REQUESTS */
app.use(commentRoutes);

/* IMPORTANT */
/* ERROR HANDLER AT THE END */
app.use(errorHandler);

/* APP LISTENS */
/* IF MODE IS NOT PRODUCTION, SERVER RUNS ON LOCALHOST, LOCALHOST IS 127.0.0.1 */
// app.listen(PORT, "127.0.0.1", async () => {
// 	console.log(":: Server running on port", PORT);
// });


app.listen("8080", async () => {
	console.log(":: Server running on port", PORT);
});
