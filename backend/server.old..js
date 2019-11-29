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

function roomName(id1, id2) {
  return `${id1}`.localeCompare(`${id2}`) < 0 ? `${id1}${id2}` : `${id2}${id1}`;
}

function contact_update(list, id, id2, tunnel) {
  Users.update(
    { contacts: list },
    {
      where: {
        UID: id
      }
    }
  )
    .then(() => {
      dbLog.info(`Added contact ${id2} to UID= ${id}`);
      serverLog.info(`Updated contacts of UID= ${id}`);
    })
    .catch(err => {
      if (tunnel)
        tunnel.emit("error", `Failed to add contact with fromID= ${id2}`);
      dbLog.error(`Failed to add contact ${id2} to UID= ${id}. Error: ${err}`);
      serverLog.error(`Failed to Update contacts of UID= ${id}`);
    });
}

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
      dbLog.info(`LoginLog created with 'online' action of user ${uid}`);
      serverLog.info(`user ${uid} is ONLINE`);
    })
    .catch(err => {
      dbLog.error(`Failed to create LoginLog of user ${uid}. Error: ${err}`);
      serverLog.warn(`Failed to log online status of user ${uid}`);
    });

  //joining chat rooms and setting login status
  await Users.findOne({
    where: {
      UID: uid
    },
    attributes: ["contacts", "name", "email", "about"]
  })
    .then(out => {
      dbLog.info("user data queried UID = " + uid);
      live[`${uid}`].name = out.name;
      live[`${uid}`].email = out.email;
      live[`${uid}`].about = out.about;
      live[`${uid}`].contacts = out.contacts == null ? [] : out.contacts;
      if (live[`${uid}`].contacts != null) {
        for (let i = 0; i < live[`${uid}`].contacts.length; i++) {
          socket.join(roomName(uid, live[`${uid}`].contacts[i]), () => {
            socket
              .to(roomName(uid, live[`${uid}`].contacts[i]))
              .broadcast.emit("online", { contact: uid });
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
  socket.on("chat", data => {
    let send = data;
    send.fromID = data.uid;
    delete send.toID;
    delete send.uid;
    let chat = {
      fromID: data.uid,
      toID: data.toID,
      message: data.msg
    };
    if (live[`${data.toID}`]) {
      socket.to(roomName(data.uid, data.toID)).broadcast.emit("chat", send);
      serverLog.info(`Chat sent from= ${data.uid} to= ${data.toID}`);
      update.status = true;
    }
    Chat.create(chat)
      .then(out => {
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
    if (live[`${data.toID}`])
      socket
        .to(roomName(data.uid, data.toID))
        .broadcast.emit("typing", { fromId: data.uid });
  });

  //onlinePoll Listener
  socket.on("poll", data => {
    serverLog.info(`contact poll requested by user ${data.uid}`);
    if (live[`${data.uid}`].contacts != null) {
      for (let i = 0; i < live[`${data.uid}`].contacts.length; i++) {
        let cid = live[`${data.uid}`].contacts[i];
        if (live[`${cid}`]) socket.emit("online", { contact: `${cid}` });
        else socket.emit("offline", { contact: `${cid}` });
      }
    }
    serverLog.info(`contact polling finished for user ${data.uid}`);
  });

  //diconnect Listener
  socket.on("disconnecting", reason => {
    if (authFlag == true) {
      let id = live2[socket.id];
      if (live[`${id}`].contacts != null) {
        for (let i = 0; i < live[`${id}`].contacts.length; i++) {
          socket
            .to(roomName(id, live[`${id}`].contacts[i]))
            .broadcast.emit("offline", { contact: id });
          socket.leave(roomName(id, live[`${id}`].contacts[i]));
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

// //outRequest listener
// socket.on("request", data => {
//   Users.findOne({
//     attributes: ["UID"],
//     where: {
//       email: data.to_email
//     }
//   })
//     .then(rid => {
//       dbLog.info("users ID queried with email= " + data.to_email);
//       Requests.create({
//         fromID: data.uid,
//         toID: rid.UID
//       })
//         .then(out => {
//           dbLog.info("Request created with fromId= " + data.uid + " toId= " + rid.UID);
//           const send = {
//             name: live[`${data.uid}`].name,
//             fromID: data.uid,
//             about: live[`${data.uid}`].about
//           };
//           if (live[`${rid.UID}`])
//             socket.broadcast
//               .to(live[`${rid.UID}`].sid.id)
//               .emit("request",send);
//           serverLog.info(`friend request sent from ${data.uid} to ${rid.UID} `);
//         })
//         .catch(err => {
//           dbLog.error("failed to create request for fromID= "+data.uid+" toID= "+rid.UID +" error: "+err);
//           serverLog.error(`Failed to send friend request from ${data.uid} to ${rid.UID}`);
//           socket.emit("error",`Failed to send request to ${data.to_email} error: `+err);
//         });
//     })
//     .catch(err => {
//       dbLog.warn("Failed to find user with email= "+data.to_email+" error: "+err);
//       serverLog.error(`Failed to send friend request from ${data.uid} to ${rid.UID}`);
//       socket.emit("error",`Failed to send request to ${data.to_email} error: `+err);
//     });
// });

// //outReplyRequest Listener
// socket.on("replyRequest", async data => {
//   console.log(data)
//   let update = { status: `${data.reply}` };
//   if (`${data.reply}` == "accepted") {
//     live[`${data.uid}`].contacts.push(`${data.fromID}`);
//     socket.join(roomName(data.uid, data.fromID));
//     contact_update(live[`${data.uid}`].contacts, data.uid, data.fromID, socket);
//     live[`${data.fromID}`].sid.join(roomName(data.uid, data.fromID));
//     await Users.findOne({
//       where:{
//         UID: data.fromID
//       },
//       attributes:['contacts']
//     })
//     .then((out)=>{
//       contact_update(out.contacts,data.fromID,data.uid,null);
//     })
//     .catch((err)=>{
//       serverLog.error('Failed to get User contacts of UID= '+data.fromID);
//       dbLog.error('Failed to query User of UID= '+data.fromID+' err: '+err);
//     });
//   }
//   Requests.update(update, {
//     where: {
//       fromID: data.fromID,
//       toID: data.uid
//     }
//   })
//   .then(() => {
//     dbLog.info("Updated request log with fromID= "+data.fromID+" toID= "+data.uid);
//       serverLog.info("Reply to request sent by toID= "+data.uid+" fromId= "+data.fromID);
//       let send = {data};
//       send.toID = data.uid;
//       send.name = live[`${data.uid}`].name;
//       send.about = live[`${data.uid}`].about;
//       send.login = true;
//       delete send.fromID;
//       delete send.uid;
//       if(live[`${data.fromID}`])
//         socket.to(live[`${data.fromID}`].sid.id).broadcast.emit("replyRequest",send);
//   })
//   .catch(err => {
//     dbLog.error("Failed to update request with fromID= "+data.fromID+" toID= "+data.uid+" error: "+err);
//     serverLog.error("Failed to reply to request sent by toID= "+data.uid+" fromID= "+data.fromID);
//     socket.emit("error","Failed to reply to request fromID = "+data.fromID+" error: "+err);
//   });
// });

//endRequest Listener
// socket.on("endRequest", async data => {
//   await Requests.findOne({
//     attributes: [status],
//     where: {
//       fromID: data.uid,
//       toID: data.toID
//     }
//   })
//   .then(out => {
//     dbLog.info(`Request queried with fromID= ${data.uid},toID= ${data.toID}`);
//     if (out.status == "pending")
//       socket.to(live[`${data.toID}`].sid.id).broadcast.emit("preEndRequest",{ fromID: data.uid });
//     Requests.destroy({
//       where: {
//         fromID: data.uid,
//         toID: data.toID
//       }
//     })
//     .then(() => {
//         dbLog.info(`Deleted request with fromID= ${data.uid}, toID= ${data.toID}`);
//     })
//     .catch(err => {
//         dbLog.error(`Failed to delete request with fromID= ${data.uid},toID= ${data.toID} error: ${err}`);
//         socket.emit("error",`Failed to delete request of toID= ${data.toID} error: ${err}`);
//     });
//     socket.join(roomName(data.uid, data.toID),()=>{
//       socket.to(roomName(data.uid, data.toID)).broadcast.emit("online", data.uid);
//     });
//     contact_update(live[`${data.uid}`].contacts, data.uid, data.toID, socket);
//     serverLog.info(`Request of fromID= ${data.uid} , toID= ${data.toID} successfully ended`);
//     })
//     .catch(err => {
//       dbLog.error(`Failed to query request with fromID= ${data.uid}, toID= ${data.toID}, error: ${err}`);
//       serverLog.error(`Failed to end request of fromID= ${data.uid}, toID= ${data.toID}`);
//       socket.error("error",`Failed to end request with toID= ${data.toID}`);
//     });
// });
