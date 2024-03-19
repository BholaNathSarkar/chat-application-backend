const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({ path: "/.env" });

//if in your server have uncaughtException then  sutdown the server and return the error
process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});

const http = require("http");

const server = http.createServer(app);

const DB = process.env.DBURI.replace("<PASSWORD>", process.env.DBPASSWORD);

mongoose.connect(DB, {
  userNewUrlParser: true,
  useCreateIndex: true,
  useFindAndMoify: false,
  useUnifiedToplogy: true,
}).then((con)=>{
    console.log("db connection is successfull");
}).catch((err)=>{
    console.log(err);
});

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`App is running on ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
