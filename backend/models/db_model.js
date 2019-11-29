const Sequelize = require("sequelize");
require("dotenv").config();
const sequelize = new Sequelize(`${process.env.URI}`, { logging: false });
const moment = require("moment");
class Users extends Sequelize.Model {}
Users.init(
  {
    UID: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [8, 255],
          msg: "Password must be between 8 to 255 characters"
        }
      }
    },
    about: {
      type: Sequelize.STRING,
      allowNull: true
    },
    login: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    verified: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    image: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Given email is invalid"
        }
      },
      unique: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [3, 255],
          msg: "Name must be between 3 to 255 characters"
        }
      }
    },
    rooms: {
      type: Sequelize.ARRAY(Sequelize.UUID),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: "users"
  }
);

class Rooms extends Sequelize.Model {}
Rooms.init(
  {
    RID: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [3, 255],
          msg: "Name must be between 3 to 255 characters"
        }
      }
    }
  },
  {
    sequelize,
    tableName: "rooms"
  }
);

class Verification extends Sequelize.Model {}
Verification.init(
  {
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: Users,
        key: "email"
      },
      primaryKey: true
    },
    code: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: "verification",
    freezeTableName: true,
    timestamps: true,
    updatedAt: false
  }
);

class LoginLog extends Sequelize.Model {}
LoginLog.init(
  {
    user: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: Users,
        key: "UID"
      },
      primaryKey: true
    },
    action: {
      type: Sequelize.ENUM("login", "online", "offline", "logout"),
      allowNull: false,
      primaryKey: true
    },
    timeIn: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      primaryKey: true,
      field: "time_in"
    },
    IPAddr: {
      type: Sequelize.STRING(15),
      allowNull: false,
      field: "IP_addr"
    }
  },
  {
    sequelize,
    timestamps: false,
    underscored: true,
    freezeTableName: true,
    tableName: "login_log"
  }
);

class Chat extends Sequelize.Model {}
Chat.init(
  {
    MID: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true
    },
    fromID: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: Users,
        key: "UID",
        deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
      }
    },
    toID: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: Rooms,
        key: "RID",
        deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
      }
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdAt: {
      type: Sequelize.TEXT,
      allowNull: false,
      primaryKey: true
    }
  },
  {
    sequelize,
    freezeTableName: true,
    underscored: true,
    tableName: "chat_log",
    timestamps: true,
    createdAt: false
  }
);

module.exports = {
  sequelize,
  Users,
  Verification,
  LoginLog,
  Chat,
  Rooms
};
