const app = require("express")();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const {
  sequelize,
  Users,
  Requests,
  Chat,
  LoginLog
} = require("./models/db_model");
const { serverLog, dbLog } = require("./Loggers/loggers");
const { router } = require("./Routes/routes");
const moment = require("moment");
require("dotenv").config();

app.use(cors());
app.use(router);

sequelize
  .authenticate()
  .then(() => {
    serverLog.info("Connection has been established successfully.");
  })
  .catch(err => {
    serverLog.error("Unable to connect to the database:", err);
  });

const server = app.listen(process.env.PORT, () => {
  serverLog.info("listening on port " + process.env.PORT);
});

// Socket Section
const io = require("socket.io")(server);
let live = {};
let live2 = {};

// function roomName(id1, id2) {
//   return `${id1}`.localeCompare(`${id2}`) < 0 ? `${id1}${id2}` : `${id2}${id1}`;
// }

// function contact_update(list, id, id2, tunnel) {
//   Users.update(
//     { contacts: list },
//     {
//       where: {
//         UID: id
//       }
//     }
//   )
//     .then(() => {
//       dbLog.info(`Added contact ${id2} to UID= ${id}`);
//       serverLog.info(`Updated contacts of UID= ${id}`);
//     })
//     .catch(err => {
//       if (tunnel)
//         tunnel.emit("error", `Failed to add contact with fromID= ${id2}`);
//       dbLog.error(`Failed to add contact ${id2} to UID= ${id}. Error: ${err}`);
//       serverLog.error(`Failed to Update contacts of UID= ${id}`);
//     });
// }

io.use((socket, next) => {
  let token = socket.handshake.query.token;
  console.log(token);
  jwt.verify(
    token,
    Buffer.from(process.env.KEY, "hex"),
    { ignoreExpiration: false },
    (err, decoded) => {
      if (err) {
        serverLog.warn("Socket authentication error,therefore diconnecting");
        socket.emit("error", err);
        socket.disconnect(true);
        return;
      } else return next();
    }
  );
});

io.on("connection", async socket => {
  var uid,
    authFlag = true;
  //decoding Token
  try {
    let old_token = jwt.decode(socket.handshake.query.token);
    uid = old_token.UID;
    live[`${uid}`] = { sid: socket };
    live2[socket.id] = `${uid}`;
  } catch (err) {
    socket.emit(
      "error",
      "internal error: couldn't send decode token error: " + err
    );
    serverLog.error(
      "Failed to decode token of SocketID=" + socket.id + " : " + err
    );
  }

  //logging user connection to database
  await LoginLog.create({
    action: "online",
    user: uid,
    IPAddr: socket.handshake.address
  })
    .then(out => {
      dbLog.info(`LoginLog created with 'online' action of user ${uid} with IP= ${socket.handshake.address}`);
      serverLog.info(`user ${uid} is ONLINE`);
    })
    .catch(err => {
      dbLog.error(`Failed to create LoginLog of user ${uid}. Error: ${err}`);
      serverLog.warn(`Failed to log online status of user ${uid}`);
    });
  console.log(uid);
  //joining chat rooms and setting login status
  await Users.findOne({
    where: {
      UID: uid
    },
    attributes: ["rooms", "name", "email", "about"]
  })
    .then(out => {
      dbLog.info("user data queried UID = " + uid);
      live[`${uid}`].name = out.name;
      live[`${uid}`].email = out.email;
      live[`${uid}`].about = out.about;
      live[`${uid}`].rooms = out.rooms;
      if (live[`${uid}`].rooms != null) {
        for (let i = 0; i < live[`${uid}`].rooms.length; i++) {
          console.log(live[`${uid}`].rooms[i]);
          socket.join(live[`${uid}`].rooms[i], () => {
            // socket
            //   .to(roomName(uid, live[`${uid}`].contacts[i]))
            //   .broadcast.emit("online", { contact: uid });
          });
        }
      }
      serverLog.info("user UID=" + uid + " has joined chat rooms");
    })
    .catch(err => {
      dbLog.error("Failed to query user with UID = " + uid + " error: " + err);
      serverLog.warn(`User not found ${uid}, therefore diconnecting socket.`);
      socket.emit("error", "invalid user entry : " + err);
      authFlag = false;
      socket.disconnect(true);
    });
  console.log(live);
  Users.update(
    { login: true },
    {
      where: {
        UID: uid
      }
    }
  )
    .then(() => {
      dbLog.info("Updated user Login status UID = " + uid);
      serverLog.info(`Login status set for user UID= ${uid}`);
    })
    .catch(err => {
      dbLog.error(
        "Failed to Update login status UID = " + uid + ". error: " + err
      );
      serverLog.error(`Failed to set Login status of user UID= ${uid}`);
    });

  //outChat Listener
  socket.on("chat", async data => {
    console.log(data);
    let send = data;
    send.fromID = data.uid;
    // delete send.toID;
    // delete send.uid;
    let chat = {
      fromID: data.uid,
      toID: data.toID,
      message: data.message,
      createdAt: data.createdAt
    };
    console.log(chat);
    let chatEmit = {
      fromID: data.uid,
      toID: data.toID,
      message: data.message,
      fromIDDetails: {
        UID: data.uid,
        name: live[data.uid].name
      },
      createdAt: data.createdAt
    };
    serverLog.info(`Chat sent from= ${data.uid} to= ${data.toID}`);
    // update.status = true;
    socket.to(data.toID).broadcast.emit("chat", chat);

    await Chat.create(chat)
      .then(out => {
        out.formIDDetails = {
          UID: data.fromID,
          name: live[data.uid].name
        };
        dbLog.info(
          `Created new chat with fromID= ${data.uid}, toID= ${data.toID}`
        );
        serverLog.info(
          `chat successfully logged from= ${data.uid} to= ${data.toID}`
        );
      })
      .catch(err => {
        dbLog.error(
          `Failed to create chat from= ${data.uid} to= ${data.toID}. error: ${err}`
        );
        serverLog.error(
          `Failed to log chat from= ${data.uid} to= ${data.toID}`
        );
        socket.emit("error", `Failed to log chat toID= ${data.toID}`);
      });
  });

  //receivedChat Listener
  socket.on("receivedChat", data => {
    chat
      .update(
        { status: true },
        {
          where: {
            MID: data.MID
          }
        }
      )
      .then(() => {
        dbLog.info(`chat status of MID= ${data.MID} updated`);
        serverLog.info(`user ${data.uid} received chat of MID= ${data.MID}`);
      })
      .catch(err => {
        dbLog.error(
          `Failed to Update chat status of MID= ${data.MID}, error: ${err}`
        );
        socket.emit(
          "error",
          `Failed to Update chat status of MID= ${data.MID}, error: ${err}`
        );
      });
  });

  //outTyping Listener
  socket.on("typing", data => {
    serverLog.info(`sending typing status of ${data.uid} to ${data.toID}`);
    socket.to(data.toID).broadcast.emit("typing", { fromId: data.uid });
  });

  // //onlinePoll Listener
  // socket.on("poll", data => {
  //   serverLog.info(`contact poll requested by user ${data.uid}`);
  //   if (live[`${data.uid}`].contacts != null) {
  //     for (let i = 0; i < live[`${data.uid}`].contacts.length; i++) {
  //       let cid = live[`${data.uid}`].contacts[i];
  //       if (live[`${cid}`]) socket.emit("online", { contact: `${cid}` });
  //       else socket.emit("offline", { contact: `${cid}` });
  //     }
  //   }
  //   serverLog.info(`contact polling finished for user ${data.uid}`);
  // });

  //diconnect Listener
  socket.on("disconnecting", reason => {
    if (authFlag == true) {
      let id = live2[socket.id];
      if (live[`${id}`].rooms != null) {
        for (let i = 0; i < live[`${id}`].rooms.length; i++) {
          socket
            .to(live[`${id}`].rooms[i])
            .broadcast.emit("offline", { room: id });
          socket.leave(live[`${id}`].rooms[i]);
        }
      }
      delete live[`${id}`];
      delete live2[socket.id];
      LoginLog.create({
        action: "offline",
        user: id,
        IPAddr: socket.handshake.address
      })
        .then(out => {
          dbLog.info(`LoginLog created with action 'offline' of user ${id}`);
          serverLog.info(`user ${id} is OFFLINE`);
        })
        .catch(err => {
          dbLog.error(`Failed to create LoginLog of user ${id}. Error: ${err}`);
          serverLog.warn(`Failed to log offline status of user ${id}`);
        });
      serverLog.info(`user disconnected with UID= ${id}. Reason = ${reason}`);
    }
  });
});
