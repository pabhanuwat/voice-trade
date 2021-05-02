const express = require("express");
const app = express();
const methodOverride = require('method-override')
const path = require("path");
require("dotenv").config();



// * Static path
app.use(express.static(path.join(__dirname, "public")));

// * Some required middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))

// * Our middlewares
app.use((req, res, next) => {
  next();
});

// use routes
app.use('/api', require('./routes/auth'))
app.use('/api', require('./routes/main'))

// * Just for test
app.get('/', (req, res) => {
    res.json({data: "yay"})
})

// ! Catch 404 not found
app.all("*", (req, res, next) => {
  res.status(404).json({err: "Invalid Path"})
});

// ! Error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || err?.response?.status || 500
  if (!err.message) err.message = "Something Went Wrong";
  res.status(status).json({ err });
});

// * Listen to port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running and listenning to port ${port}`));
