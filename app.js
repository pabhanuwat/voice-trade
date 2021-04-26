const express = require("express");
const ejsMate = require("ejs-mate");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;
const app = express();
const flash = require("connect-flash");
const path = require("path");
const ExpressError = require("./utils/ExpressError");
const { isLoggedIn } = require("./middleware.js");
const routes = require("./routes");
const methodOverride = require('method-override')

// * ENV
const {PORT,WP_AUTH_PATH,WP_API_PATH, WP_USERNAME, WP_PASSWORD} = require('./utils/env')

// * Models
const {User, Admin, Result, Diary, UserDiary} = require('./models')

const db = require("./models/db");
const sessionConfig = require("./sessionConfig");

const schedule = require('node-schedule');
const { default: axios } = require("axios");
const catchAsync = require("./utils/catchAsync");

// * Updated all diaries at midnight
const job = schedule.scheduleJob('5 0 * * *', async function(){
	console.log("Doing DB update")
  const date = new Date()
  date.setHours(0,0,0,0)
	const userDiaries = await UserDiary.find({})
    for (const userDiary of userDiaries){
      const lastDiary = userDiary.getLastDiary()
		  if (userDiary.isStarted && (!lastDiary || lastDiary.date.toDateString() !== new Date().toDateString())) {
        console.log("Creating new empty diary")
        userDiary.diaries.push({date})
        await userDiary.save()
		  }
    }
	console.log("DB update finished")

});

// * Views
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// * Static path
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use("user-local", User.createStrategy());
passport.use("admin-local", Admin.createStrategy());

passport.serializeUser((user, done) => {
  if (user.isAdmin) done(null, { email: user.email, isAdmin: user.isAdmin });
  else done(null, { email: user.email });
});

passport.deserializeUser((user, done) => {
  const collection = user.isAdmin ? Admin : User;
  collection.findOne({ email: user.email }, (err, user) => {
    if (err) done(err);
    if (user) done(null, user);
  });
});

// * Locals

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.pageName = req.path;
  next();
});

// use routes
for (let { router, prefix } of routes) app.use(prefix, router);
// app.use('/api/promise',promiseRoutes)

app.get('/sleep-analysis/', (req, res) => {
    res.render('./sleepAnalysis/questions')
})


app.get('/test', (req,res) => {
    res.render('./test')
})

app.get("/promise", (req, res) => {
  res.render("Promise/todolist");
});


app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something Went Wrong";
  res.status(statusCode).render("error", { err });
});

const port = PORT || 3000;
app.listen(port, () => console.log(`Server is running and listenning to port ${port}`));
