const {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLInt
} = require("graphql");
const { Op } = require("sequelize");
const { Users, Requests, Chat, Rooms } = require("../models/db_model");
const { dbLog, serverLog } = require("../Loggers/loggers");

const userType = new GraphQLObjectType({
  name: "user",
  fields: () => ({
    uid: { type: GraphQLID },
    about: { type: GraphQLString },
    verified: { type: GraphQLBoolean },
    email: { type: GraphQLString },
    name: { type: GraphQLString },
    image: { type: GraphQLString },
    rooms: { type: GraphQLList(GraphQLString) },
    roomsList: {
      type: new GraphQLList(roomsType),
      async resolve(parent, args) {
        let res;
        await Rooms.findAll({
          attributes: ["RID", "name"],
          where: {
            RID: {
              [Op.or]: parent.rooms
            }
          }
        })
          .then(out => {
            res = out;
          })
          .catch(err => {
            console.log(err);
          });
        return res;
      }
    }
  })
});

const userChainType = new GraphQLObjectType({
  name: "userChain",
  fields: () => ({
    uid: { type: GraphQLID },
    about: { type: GraphQLString },
    image: { type: GraphQLString },
    email: { type: GraphQLString },
    name: { type: GraphQLString },
    login: { type: GraphQLBoolean },
    messages: { type: new GraphQLList(chatType) }
  })
});

const userListType = new GraphQLObjectType({
  name: "userList",
  fields: () => ({
    uid: { type: GraphQLID },
    image: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString }
  })
});

const userDetailsType = new GraphQLObjectType({
  name: "userDetails",
  fields: {
    status: { type: GraphQLBoolean },
    msg: { type: GraphQLString }
  }
});

const chatType = new GraphQLObjectType({
  name: "chats",
  fields: () => ({
    MID: { type: GraphQLID },
    fromID: { type: GraphQLString },
    fromIDDetails: {
      type: userType,
      async resolve(parent, args) {
        return await Users.findOne({
          attributes: ["uid", "name"],
          where: {
            uid: parent.fromID
          }
        });
      }
    },
    toID: { type: GraphQLID },
    message: { type: GraphQLString },
    createdAt: { type: GraphQLString }
  })
});

// const requestsType = new GraphQLObjectType({
//   name: "requestsFrom",
//   fields: () => ({
//     fromID: { type: GraphQLID },
//     toID: { type: GraphQLID },
//     status: { type: GraphQLString },
//     partialKey: { type: GraphQLString },
//     createdAt: { type: GraphQLString },
//     updatedAt: { type: GraphQLString }
//   })
// });

const roomsType = new GraphQLObjectType({
  name: "rooms",
  fields: () => ({
    RID: { type: GraphQLID },
    name: { type: GraphQLString }
  })
});


const rootQueryType = new GraphQLObjectType({
  name: "root",
  fields: {
    userID: {
      type: userType,
      args: { uid: { type: new GraphQLNonNull(GraphQLID) } },
      async resolve(parent, args) {
        let res;
        console.log(args);
        await Users.findOne({
          attributes: [
            "uid",
            "about",
            "verified",
            "email",
            "name",
            "image",
            "rooms"
          ],
          where: {
            uid: args.uid
          }
        })
          .then(out => {
            // console.log(out);
            serverLog.info(`userID query made with id=${args.uid}`);
            dbLog.info(`user queried :\t${JSON.stringify(out)}`);
            res = out;
          })
          .catch(err => {
            serverLog.error(`userID query FAILED with id=${args.id}`);
            dbLog.error(`query to user failed :\t${err}`);
          });
        return res;
      }
    },
    userEm: {
      type: userType,
      args: { email: { type: new GraphQLNonNull(GraphQLString) } },
      async resolve(parent, args) {
        let res;
        await Users.findOne({
          attributes: [
            "uid",
            "about",
            "verified",
            "email",
            "name",
            "image",
            "rooms"
          ],
          where: {
            email: args.email
          }
        })
          .then(out => {
            serverLog.info(`userID query made with email=${args.email}`);
            dbLog.info(`user queried :\t${JSON.stringify(out)}`);
            res = out;
          })
          .catch(err => {
            serverLog.error(`userID query FAILED with email=${args.email}`);
            dbLog.error(`query to user failed :\t${err}`);
          });
        return res;
      }
    },
    chats: {
      type: new GraphQLList(chatType),
      args: {
        uid: { type: new GraphQLNonNull(GraphQLID) },
        roomID: {
          type: new GraphQLNonNull(GraphQLID)
        }
      },
      async resolve(parent, args) {
        let res;
        await Chat.findAll({
          //   order: [["createdAt", "DESC"]],
          where: {
            toID: args.roomID
          }
        })
          .then(out => {
            serverLog.info(
              `user Chat query made with uid=${args.uid} roomID=${args.roomID}`
            );
            dbLog.info(
              `user Requests query made with uid=${args.uid} roomID=${args.roomID}`
            );
            res = out;
          })
          .catch(err => {
            serverLog.error(
              `Query to Chat Failed with uid=${args.uid} roomID=${args.roomID}`
            );
            dbLog.error(`Query to Chat FAILED: ${err}`);
          });
        return res;
      }
    },
    userList: {
      type: new GraphQLList(userListType),
      async resolve(parent, args) {
        let res;
        await Users.findAll({
          attributes: ["uid", "verified", "image", "name", "email"],
          where: {
            verified: true
          }
        })
          .then(out => {
            serverLog.info("User list queried by Client.");
            dbLog.info("All users are queried.");
            res = out;
          })
          .catch(err => {
            serverLog.error("Failed to retrieve Users data");
            dbLog.error("Query for users list failed. Error: " + err);
          });
        return res;
      }
    },
    roomsList: {
      type: GraphQLList(roomsType),
      resolve(parent, args) {
        return Rooms.findAll();
      }
    },
    usersInRoomList: {
      type: GraphQLList(userType),
      args: {
        roomID: { type: GraphQLString }
      },
      resolve(parent, args) {
        return Users.findAll({
          where: {
            rooms: {
              [Op.contains]: [args.roomID]
            }
          }
        });
      }
    }
  }
});

const rootMutationType = new GraphQLObjectType({
  name: "mutation",
  fields: {
    userDetails: {
      type: userDetailsType,
      args: {
        uid: { type: new GraphQLNonNull(GraphQLID) },
        about: { type: GraphQLString },
        image: { type: GraphQLString }
      },
      async resolve(parent, args) {
        let res = {
          status: true,
          msg: null
        };
        let update = {};
        if (args.about) update.about = args.about;
        if (args.image) update.image = args.image;
        if (update != null) {
          await Users.update(update, {
            where: {
              uid: args.uid
            }
          })
            .then(() => {
              serverLog.info(`Update to User successfull uid=${args.uid}`);
              dbLog.info(`Update to User successfull uid=${args.uid}`);
            })
            .catch(err => {
              res.status = false;
              res.msg = err;
              serverLog.error("Update to Users Failed with uid= " + args.uid);
              dbLog.error(`Update to Users failed : ${err}`);
            });
          return res;
        }
      }
    },
    addRoom: {
      type: roomsType,
      args: {
        name: { type: GraphQLString }
      },
      async resolve(parent, args) {
        let data = {
          name: args.name
        };
        serverLog.info(`Creating new room ${data.name}`);
        dbLog.info(`Creating new room of data= ${data}`);
        return Rooms.create(data);
      }
    },
    deleteUser: {
      type: new GraphQLObjectType({
        name: "deleteType",
        fields: {
          status:{type: GraphQLBoolean}
        }
      }),
      args: {
        uid: {type: GraphQLID}
      },
      async resolve(parent,args) {
        var res = false;
        Users.destroy({
          where:{
            uid: args.uid
          }
        }).then(()=>{
          serverLog.info(`User deleted with uid= ${args.uid}`);
          dbLog.info(`Successfully deleted User with uid= ${args.uid}`);
          res=true;
        }).catch((err)=>{
          serverLog.error(`Failed to delete user with uid= ${args.uid}`);
          dbLog.error(`User deletion failed with uid= ${args.uid} and error: ${err}`);
        });
        return res;
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: rootQueryType,
  mutation: rootMutationType
});
