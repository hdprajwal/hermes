const app = require("express")();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const {
  sequelize,
  Users,
  Chat,
  LoginLog
} = require("./models/db_model");
const { serverLog, dbLog } = require("./Loggers/loggers");
const { router } = require("./Routes/routes");
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
//         uid: id
//       }
//     }
//   )
//     .then(() => {
//       dbLog.info(`Added contact ${id2} to uid= ${id}`);
//       serverLog.info(`Updated contacts of uid= ${id}`);
//     })
//     .catch(err => {
//       if (tunnel)
//         tunnel.emit("error", `Failed to add contact with fromID= ${id2}`);
//       dbLog.error(`Failed to add contact ${id2} to uid= ${id}. Error: ${err}`);
//       serverLog.error(`Failed to Update contacts of uid= ${id}`);
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
    uid = old_token.uid;
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
    userid: uid,
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
      uid: uid
    },
    attributes: ["rooms", "name", "email", "about"]
  })
    .then(out => {
      dbLog.info("user data queried uid = " + uid);
      live[`${uid}`].name = out.name;
      live[`${uid}`].email = out.email;
      live[`${uid}`].about = out.about;
      live[`${uid}`].rooms = out.rooms;
      if (live[`${uid}`].rooms != null) {
        for (let i = 0; i < live[`${uid}`].rooms.length; i++) {
          console.log(live[`${uid}`].rooms[i]);
          socket.join(live[`${uid}`].rooms[i], () => {
            socket
              .to(live[`${uid}`].rooms[i])
              .broadcast.emit("online", { room: live[`${uid}`].rooms[i] ,member: uid });
          });
        }
      }
      serverLog.info("user uid=" + uid + " has joined chat rooms");
    })
    .catch(err => {
      dbLog.error("Failed to query user with uid = " + uid + " error: " + err);
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
        uid: uid
      }
    }
  )
    .then(() => {
      dbLog.info("Updated user Login status uid = " + uid);
      serverLog.info(`Login status set for user uid= ${uid}`);
    })
    .catch(err => {
      dbLog.error(
        "Failed to Update login status uid = " + uid + ". error: " + err
      );
      serverLog.error(`Failed to set Login status of user uid= ${uid}`);
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
        uid: data.uid,
        name: live[data.uid].name
      },
      createdAt: data.createdAt
    };
    serverLog.info(`Chat sent from= ${data.uid} to= ${data.toID}`);
    // update.status = true;
    socket.to(data.toID).broadcast.emit("chat", chatEmit);

    await Chat.create(chat)
      .then(out => {
        out.formIDDetails = {
          uid: data.fromID,
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

  //onlinePoll Listener
  socket.on("poll", data => {
    serverLog.info(`contact poll requested by user ${data.uid}`);
    for(var x in live){
      if(live.hasOwnProperty(x) && x!=data.uid){
        if(live[`${x}`].rooms != null ){
          for(var i=0;i<live[`${x}`].rooms.length;i++){
            for(var j=0;j<live[`${data.uid}`].rooms.length;j++){
              if(live[`${x}`].rooms[i]==live[`${data.uid}`].rooms[j]){
                live[`${x}`].sid.to(live[`${x}`].rooms[i])
                .broadcast.emit('online',{room:live[`${x}`].rooms[i],member: x});
              }
            }
          }
        }
      }
    }
    serverLog.info(`contact polling finished for user ${data.uid}`);
  });

  //diconnect Listener
  socket.on("disconnecting", reason => {
    if (authFlag == true) {
      let id = live2[socket.id];
      if (live[`${id}`].rooms != null) {
        for (let i = 0; i < live[`${id}`].rooms.length; i++) {
          socket
            .to(live[`${id}`].rooms[i])
            .broadcast.emit("offline", { room: live[`${id}`].rooms[i] ,member: id });
          socket.leave(live[`${id}`].rooms[i]);
        }
      }
      delete live[`${id}`];
      delete live2[socket.id];
      LoginLog.create({
        action: "offline",
        userid: id,
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
      serverLog.info(`user disconnected with uid= ${id}. Reason = ${reason}`);
    }
  });
});
