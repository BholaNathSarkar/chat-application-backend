const express = require("express"); // web framework for node,js

const routes = require("./routes/index");

// HTTP request logger middleware
const morgan = require("morgan");

// It operates as a mechanism finely controlling the rate at which clients can initiate requests to a server
const rateLimit = require("express-rate-limit");

// elmet disables browsers' buggy cross-site scripting filter by setting the legacy X-XSS-Protection header to 0. See discussion about disabling the header here and documentation on MDN
const helmet = require("helmet");

// a package that provides middleware to sanitize user input before it is used in a database query
const mongosanitize = require("express-mongo-sanitize");

//it processes incoming request bodies, making it easier to handle POST and PUT requests. By parsing the body of an HTTP request and attaching it to the req. body property, it simplifies data extraction and manipulation in server-side logic
const bodyParser = require("body-parser");

// A Cross-Site Scripting (XSS) attack is characterized by an attacker's ability to inject to a web application, scripts of any kind, such as Flash, HTML, or JavaScript, that are intended to run and render on the application serving the page.
const xss = require("xss");

const cookieParser = require("cookie-parser");

const app = express();
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(mongosanitize());

// app.use(xss());

// connect two different server
const cors = require("cors");
const router = require("./routes");

app.use(
  cors({
    origin: "*",
    methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

// application will parse incoming JSON request bodies, but it will only handle payloads up to 10 kilobytes in size. Beyond that, it will throw an error
app.use(express.json({ limit: "10kb" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  max: 3000,
  windowMs: 60 * 60 * 1000, // in one hour
  message: "Too many request from this IP, please try again in an hour",
});

app.use("/tawk", limiter);

app.use(routes);

module.exports = app;

// http://localhot:3000/auth/login
