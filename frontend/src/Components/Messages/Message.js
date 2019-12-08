import React from "react";
import { Avatar, Icon } from "antd";
import moment from "moment";
import "./Message.css";
const jwt = require("jsonwebtoken");

const Message = ({ data }) => {
  return data.fromIDDetails.uid ===
    jwt.decode(localStorage.getItem("token")).uid ? (
    <div className="sentMessageContainer">
      <p className="senderDetails">{data.createdAt}</p>
      <div className="sentMessageBox">
        <p className="sentMessage">{data.message}</p>
      </div>
      {/* <div className="senderAvatar">
        <Avatar className="senderAvatar">
          o
        </Avatar>
      </div> */}
    </div>
  ) : (
    <div className="recievedMessageContainer">
      {/* <div className="recieverAvatar">
        <Avatar className="recieverAvatar">
          p 
        </Avatar>
      </div> */}
      <div className="recievedMessageBox">
        <p className="recievedMessage">{data.message}</p>
      </div>
      <p className="recieverDetails">
        {data.fromIDDetails.name} <br />
        {data.createdAt}
      </p>
    </div>
  );
};

export default Message;
