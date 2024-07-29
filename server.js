const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({ path: ".env" });
const { Server } = require("socket.io");
const path = require("path");

//if in your server have uncaughtException then  sutdown the server and return the error
process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});

const http = require("http");
const User = require("./models/user");
const FriendRequest = require("./models/friendRequest");
const OneToOneMessage = require("./models/OneToOneMessage");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.UI_HOST,
    methods: ["GET", "POST"],
  },
});

// const DB = process.env.DBURI.replace("<PASSWORD>", process.env.DBPASSWORD);
const DB =
  "mongodb+srv://chatapp:l4sSA6QWe8LPADFI@cluster1.chc4shz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1";

mongoose
  .connect(DB, {
    // useNewUrlParser: true, // The underlying MongoDB driver has deprecated their current connection string parser. Because this is a major change, they added the useNewUrlParser flag to allow users to fall back to the old parser if they find a bug in the new parser.
    // useCreateIndex: true, // Again previously MongoDB used an ensureIndex function call to ensure that Indexes exist and, if they didn't, to create one. This too was deprecated in favour of createIndex . the useCreateIndex option ensures that you are using the new function calls.
    // useFindAndModify: false, // findAndModify is deprecated. Use findOneAndUpdate, findOneAndReplace or findOneAndDelete instead.
    // useUnifiedTopology: true, // Set to true to opt in to using the MongoDB driver's new connection management engine. You should set this option to true , except for the unlikely case that it prevents you from maintaining a stable connection.
  })
  .then((con) => {
    console.log("DB Connection successful");
  });

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`App is running on ${port}`);
});

// We can write our socket event listeners here ..

io.on("connection", async (socket) => {
  const user_id = socket.handshake.query["user_id"];
  const socket_id = socket.id;
  if (Boolean(user_id)) {
    await User.findByIdAndUpdate(user_id, { socket_id, status: "Online" });
  }

  // Socket event listener for "friend_request"
  socket.on("friend_request", async (data) => {
    // {To: "4390382"}
    // data => {to , from}
    const to_user = await User.findById(data.to).select("socket_id");
    const from_to = await User.findById(data.from).select("socket_id");

    // create friend request

    await FriendRequest.create({
      sender: data.from,
      recipent: data.to,
    });

    // TODO => Creating a friend request;
    io.to(to_user.socket_id).emit("new_friend_request", {
      //
      message: "New friend request Received",
    });
    io.to(from_to.socket_id).emit("request_sent", {
      //
      message: "Request send successfully",
    });
    // emit event => "request_send"
  });
  socket.on("accept_request", async (data) => {
    const request_doc = await FriendRequest.findById(data.request_id);

    const sender = await User.findById(request_doc.sender);
    const receiver = await User.findById(request_doc.recipent);
    sender.friends?.push(request_doc.recipent);
    receiver.friends?.push(request_doc.sender);

    await receiver.save({ new: true, validateModifiedOnly: true });
    await sender.save({ new: true, validateModifiedOnly: true });

    // await FriendRequest.findByIdAndDelete(data.request_id);

    await FriendRequest.findByIdAndDelete(data.request_id);

    io.to(sender.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
    io.to(receiver.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
  });

  socket.on("get_direct_conversations", async ({ user_id }, callback) => {
    const existing_conversation = await OneToOneMessage.find({
      participants: { $all: [user_id] },
    }).populate("participants", "firstName lastName _id email status");

    callback(existing_conversation);
  });

  socket.on("start_conversation", async (data) => {
    // data: {to, from}
    const { to, from } = data;
    // checking if there is any existing conversation between these users
    const existing_conversation = await OneToOneMessage.find({
      participants: { $size: 2, $all: [to, from] },
    }).populate(
      "participants",
      "firstName lastName _id email status socket_id"
    );

    // console.log(existing_conversation[0], "Existing Conversation");
    // if no existing_conversation

    if (existing_conversation.length === 0) {
      let new_chat = await OneToOneMessage.create({
        participants: [to, from],
      });

      new_chat = await OneToOneMessage.findById(new_chat).populate(
        "participants",
        "firstName lastName _id email status socket_id"
      );

      socket.emit("start_chat", new_chat);
    } else {
      socket.emit("start_chat", existing_conversation[0]);
    }
  });

  socket.on("get_messages", async (data, callback) => {
    const { messages } = await OneToOneMessage.findById(
      data.conversation_id
    ).select("messages");
    callback(messages);
  });

  // Handle text/linlk message

  socket.on("text_message", async (data) => {
    // data: {to ,from, message, conversation_id, type}
    const { to, from, message, conversation_id, type } = data;
    const to_user = await User.findById(to);
    const from_user = await User.findById(from);
    const new_messages = {
      to,
      from,
      type,
      text: message,
      created_at: Date.now(),
    };

    // create a new conversation if is doesnot exeits yet pr add new message to the message lits
    const chat = await OneToOneMessage.findById(conversation_id);
    chat.messages.push(new_messages);
    // save to db
    await chat.save({});

    // emit new_messsage-> to user

    io.to(to_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_messages,
    });
    // emit new_message => from user
    io.to(from_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_messages,
    });
  });

  socket.on("file_message", (data) => {
    console.log("Receive Message", data);
    // data : {to , from ,text, file}

    // get the file extentions

    const fileExtension = path.extname(data.file.name);

    // generate a unique file name

    const fileName = `${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}${fileExtension}`;

    // create a new conversation if is doesnot exeits yet pr add new message to the message lits

    // save to db

    // emit incoming_messsage-> to user

    // emit outgoing_message => from user
  });

  socket.on("end", async (data) => {
    //Find user by _id and set the status to Offile

    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }

    // brodcut user_disconnected

    console.log("Closing connection");
    socket.disconnect(0);
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
