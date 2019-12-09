// React Import
import React, { Component } from "react";
import { Redirect } from "react-router-dom";
// antd imports
import {
  Layout,
  Menu,
  Icon,
  Row,
  Col,
  Button,
  Spin,
  Input,
  Modal,
  Drawer,
  Popconfirm,
  Tabs,
  message,
  notification,
  Badge
} from "antd";
import moment from "moment";

// Socket.io imports
import io from "socket.io-client";
import { IP, KEY } from "./../config";

// Scroll to bottom import
import ScrollToBottom from "react-scroll-to-bottom";

// Emoji picker import
import { Picker } from "emoji-mart";

// Coponents imports
import Messages from "../Messages/Message";
import Request from "./Request";
import Profile from "./../Profile/Profile";

// css imports
import "emoji-mart/css/emoji-mart.css";
import "./Landing.css";

// Image Import
import user_circle from "./user-circle-solid.svg";
import sign_out_alt from "./sign-out-alt-solid.svg";
import user_plus from "./user-plus-solid.svg";
import Hermes from "./Hermes.svg";
import { ReactComponent as ChatImg } from "./undraw_manage_chats_ylx0 (1).svg";

// antd consts
const { Content, Sider, Header } = Layout;
const { TabPane } = Tabs;
// antd loading icon
const antIcon = <Icon type="loading" style={{ fontSize: 64 }} spin />;
const jwt = require("jsonwebtoken");

// Emoji picker styles
const styles = {
  getEmojiButton: {
    cssFloat: "center",
    border: "none",
    margin: "0px",
    cursor: "pointer",
    width: "24px",
    height: "24px"
  },
  emojiPicker: {
    position: "absolute",
    bottom: 10,
    right: 0,
    cssFloat: "right",
    marginLeft: "200px"
  }
};

// Landing component
class Landing extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uid: jwt.decode(localStorage.getItem("token")).uid,
      msg: [],
      selectedRoom: "0",
      messageField: "",
      showEmojis: false,
      userDetails: "",
      drawerVisible: false,
      modalVisible: false,
      requestData: {},
      roomsList: [],
      typingUser: "none",
      peopleOnline: []
    };
    console.log(this.state);
    this.socket = io(
      `http://${IP}:4000/?token=${localStorage.getItem("token")}`
    );
    fetch(`http://${IP}:4000/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          userID(uid:"${jwt.decode(localStorage.getItem("token")).uid}"){
            uid
            name
            about
          }
        }`
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log(res.data.userID);
        this.setState({ userDetails: res.data.userID });
      });
    fetch(`http://${IP}:4000/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          userID(uid:"${jwt.decode(localStorage.getItem("token")).uid}"){
            roomsList{
              RID
              name
            }
          }
        }`
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log(res.data.userID.roomsList);
        this.setState({ roomsList: res.data.userID.roomsList });
      });
  }

  openChatNotification = msg => {
    let roomDetails = this.state.roomsList.find(room => room.RID === msg.toID);
    console.log(roomDetails);
    notification.open({
      message: `Message from ${roomDetails.name}`,
      description: `${msg.message}`,
      style: {
        width: 600,
        marginLeft: 335 - 600
      }
    });
  };

  componentDidMount = () => {
    this.socket.on("request", async data => {
      let reqData = data;
      console.log("data recieved", reqData);
      await this.setState({
        requestData: reqData
      });
      console.log(this.state);
    });
    this.socket.on("chat", data => {
      console.log(data);
      this.openChatNotification(data);
      if (data.toID === this.state.selectedRoom) {
        this.setState({
          msg: [...this.state.msg, data]
        });
      }
    });
    this.socket.on("typing", data => {
      if (data.toID == this.state.selectedRoom) {
        this.setState({ typingUser: data.name });
      }
    });
    this.socket.on("finishTyping", data => {
      this.setState({ typingUser: "none" });
    });
    this.socket.on("offline", data => {
      if (data.room === this.state.selectedRoom) {
        this.getOnlineList();
      }
    });
    this.socket.on("online", data => {
      if (data.room === this.state.selectedRoom) {
        this.getOnlineList();
      }
    });
    this.socket.emit('poll',{uid: this.state.uid});
  };
  openDeleteConfirmation = () => {
    notification.success({
      message: "Account Deteted",
      description: "Account was succesfuly deleted",
      onClick: () => {
        console.log("Notification Clicked!");
      }
    });
  };
  openDeleteError = () => {
    notification.error({
      message: "Account Detetion error",
      description: "Account was not deleted please try again",
      onClick: () => {
        console.log("Notification Clicked!");
      }
    });
  };
  getOnlineList = () => {
    fetch(`http://${IP}:4000/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          usersInRoomList(roomID:"${this.state.selectedRoom}"){
            uid
            name
            login
          }
        }`
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log(res.data.usersInRoomList);
        this.setState({ peopleOnline: res.data.usersInRoomList });
      });
  };
  // handle message change
  handleChange = async value => {
    await this.setState({
      messageField: value
    });
    console.log(this.state.messageField);
    this.socket.emit("typing", {
      name: jwt.decode(localStorage.getItem("token")).name,
      toID: this.state.selectedRoom
    });
  };

  // handle message submit
  handleSubmit = async () => {
    let chatMsg = {
      fromIDDetails: {
        uid: jwt.decode(localStorage.getItem("token")).uid,
        name: ""
      },
      toID: this.state.selectedRoom,
      message: `${this.state.messageField}`,
      createdAt: moment().format("YYYY/MM/DD hh:mm:ss")
    };
    await this.setState({
      msg: [...this.state.msg, chatMsg]
    });
    this.socket.emit("chat", {
      uid: jwt.decode(localStorage.getItem("token")).uid,
      toID: this.state.selectedRoom,
      message: this.state.messageField,
      createdAt: moment().format("YYYY/MM/DD hh:mm:ss")
    });
    console.log({
      uid: jwt.decode(localStorage.getItem("token")).uid,
      toID: this.state.selectedRoom,
      msg: this.state.messageField,
      createdAt: moment().format("YYYY/MM/DD hh:mm;ss")
    });
    this.setState({ messageField: "" });
    this.socket.emit("finishTyping", {
      name: jwt.decode(localStorage.getItem("token")).name,
      toID: this.state.selectedRoom
    });
  };

  // Select user change
  selectRoom = async key => {
    console.log(key.key);
    await this.setState({
      selectedRoom: `${key.key}`,
      msg: []
    });
    this.getOnlineList();
    let rawResponse = await fetch(`http://${IP}:4000/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          chats(uid:"${
            jwt.decode(localStorage.getItem("token")).uid
          }",roomID:"${this.state.selectedRoom}"){
            MID
            fromIDDetails{
              uid
              name
            }
            toID
            message
            createdAt
          }
        }`
      })
    });
    let res = await rawResponse.json();
    let chats = [];
    // console.log(res.data.chats);
    if (res.data.chats.length === 0) {
      chats.push({
        MID: "0",
        fromID: this.state.selectedRoom,
        fromIDDetails: { uid: this.state.selectedRoom },
        toID: this.state.selectedRoom,
        message: "Hello from Server"
      });
      this.setState({ msg: chats });
    } else {
      // let x = [];
      // res.data.chats.map(each => {
      //   x.unshift(each);
      // });
      this.setState({ msg: res.data.chats });
    }
    // this.refresh = setInterval(() => this.getOnlineList(), 5000);
    // .then(response => response.json())
    // .then(json => {
    //   let chats = [];
    //   // console.log(json.data);
    //   // json.data.chats.push({
    //   //   MID: "0",
    //   //   fromID: this.state.selectedRoom,
    //   //   toID: this.state.selectedRoom,
    //   //   message: "Hello"
    //   // });
    //   if (json.data.chats === null) {
    //     chats.push({
    //       MID: "0",
    //       fromID: this.state.selectedRoom,
    //       toID: this.state.selectedRoom,
    //       message: "Hello from Server"
    //     });
    //     this.setState({ msg: chats });
    //   } else {
    //     this.setState({ msg: json.data.chats });
    //   }
    // });
  };

  // Select emoji and add it to input field
  addEmoji = e => {
    console.log(e.native);
    let emoji = e.native;
    this.setState({
      messageField: this.state.messageField + emoji
    });
  };

  // Show emoji picker
  showEmojis = e => {
    this.setState(
      {
        showEmojis: true
      },
      () => document.addEventListener("click", this.closeMenu)
    );
  };

  // Close emoji picker
  closeMenu = e => {
    console.log(this.emojiPicker);
    if (this.emojiPicker !== null && !this.emojiPicker.contains(e.target)) {
      this.setState(
        {
          showEmojis: false
        },
        () => document.removeEventListener("click", this.closeMenu)
      );
    }
  };

  // Show Drawer
  handleAccountDelete = async () => {
    let rawResponse = await fetch(`http://${IP}:4000/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation{
          deleteUser(uid:"${jwt.decode(localStorage.getItem("token")).uid}"){
            status
          }
        }`
      })
    });
    let res = await rawResponse.json();
    console.log(res);
    if (res.data.deleteUser.status === true) {
      this.openDeleteConfirmation();
      this.props.updateLogout();
      console.log("Account Deleted");
    } else {
      this.openDeleteError();
      console.log("Account was not deleted");
    }
  };

  showDrawer = () => {
    this.setState({
      drawerVisible: true
    });
  };

  // Close Drawer
  onClose = () => {
    this.setState({
      drawerVisible: false
    });
  };

  handleModalCancel = e => {
    this.setState({
      modalVisible: false
    });
  };
  render() {
    return (
      <Layout>
        <Header
          style={{
            background: "#0B132B",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <img src={Hermes} width="120px" />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Button
              className="button is-white"
              onClick={this.showDrawer}
              icon="user"
              style={{
                marginRight: "30px",
                color: "white",
                background: "#0B132B"
              }}
            >
              {" "}
              Profile
            </Button>
            <Button
              className="button is-white"
              icon="logout"
              onClick={() => {
                this.socket.close();
                this.props.updateLogout();
              }}
              style={{
                marginRight: "30px",
                color: "white",
                background: "#0B132B"
              }}
            >
              Logout
            </Button>
          </div>
        </Header>
        <Layout>
          <Content style={{ background: "#fff", height: "93.5vh" }}>
            <div
              style={{
                height: "93.5vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Layout
                style={{
                  background: "#fff",
                  height: "93vh"
                }}
              >
                <Sider width={150} style={{ background: "#fff" }}>
                  <Menu
                    onClick={this.selectRoom}
                    style={{
                      width: "150px",
                      height: "93.5vh"
                    }}
                    defaultSelectedKeys={["0"]}
                    mode="inline"
                  >
                    {this.state.roomsList.length > 0 ? (
                      this.state.roomsList.map((each, index) => {
                        return (
                          <Menu.Item key={each.RID}>{each.name}</Menu.Item>
                        );
                      })
                    ) : (
                      <Menu.Item>No Contacts</Menu.Item>
                    )}
                  </Menu>
                </Sider>
                <Content>
                  {this.state.selectedRoom === "0" ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "92vh"
                      }}
                    >
                      {" "}
                      <ChatImg />
                    </div>
                  ) : this.state.msg.length >= 0 ? (
                    <div>
                      <Row>
                        <Col span={22}>
                          <Row>
                            <Col span={24}>
                              <ScrollToBottom className="messages">
                                {this.state.msg.map((ms, index) => {
                                  return <Messages key={index} data={ms} />;
                                })}
                              </ScrollToBottom>
                            </Col>
                          </Row>
                          <Row>
                            <Col span={24}>
                              <Row>
                                <div>
                                  {this.state.typingUser !== "none"
                                    ? this.state.typingUser + " is typing..."
                                    : null}
                                </div>
                              </Row>
                              <Row gutter={12} type="flex" justify="center">
                                <Col span={23}>
                                  {/* <input
                                    placeholder="Type Somthing..."
                                    value={this.state.messageField}
                                    onKeyPress={event =>
                                      event.key === "Enter"
                                        ? this.handleSubmit()
                                        : null
                                    }
                                    onChange={({ target: { value } }) =>
                                      this.handleChange(value)
                                    }
                                    style={{
                                      width: "100%",
                                      height: "30px",
                                      borderRadius: "10px",
                                      background: "#e6e6ea",
                                      border: "#000",
                                      padding: "10px",
                                      fontSize: "1.1em",
                                      fontWeight: "normal",
                                      color: "black",
                                      marginLeft: "10px"
                                    }}
                                  /> */}
                                  <Input
                                    placeholder="Type somthing..."
                                    value={this.state.messageField}
                                    style={{
                                      width: "100%",
                                      background: "#e6e6ea",
                                      marginLeft: "10px",
                                      padding: "10px",
                                      fontSize: "1.1em",
                                      fontWeight: "normal"
                                    }}
                                    onChange={({ target: { value } }) =>
                                      this.handleChange(value)
                                    }
                                    onPressEnter={
                                      this.state.messageField.length > 0
                                        ? this.handleSubmit
                                        : null
                                    }
                                  />
                                </Col>
                                <Col span={1}>
                                  {this.state.showEmojis ? (
                                    <span
                                      style={styles.emojiPicker}
                                      ref={el => (this.emojiPicker = el)}
                                    >
                                      <Picker
                                        onSelect={this.addEmoji}
                                        emojiTooltip={true}
                                        title="Hermes"
                                      />
                                    </span>
                                  ) : (
                                    <Button
                                      style={styles.getEmojiButton}
                                      onClick={this.showEmojis}
                                    >
                                      {String.fromCodePoint(0x1f60a)}
                                    </Button>
                                  )}
                                </Col>
                              </Row>
                            </Col>
                          </Row>
                        </Col>
                        <Col
                          span={2}
                          style={{ background: "#F0F2F5", height: "93vh" }}
                        >
                          <h1
                            className="is-size-5"
                            style={{
                              color: "black",
                              display: "flex",
                              justifyContent: "center"
                            }}
                          >
                            People Online
                          </h1>
                          {this.state.peopleOnline.length > 0
                            ? this.state.peopleOnline.map(each => {
                                if (each.login) {
                                  return (
                                    <Row>
                                      <Button type="link">
                                        <Badge
                                          color={
                                            each.login === "true"
                                              ? "green"
                                              : "red"
                                          }
                                        />
                                        {each.name}
                                      </Button>
                                    </Row>
                                  );
                                }
                              })
                            : null}
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                      }}
                    >
                      <Spin
                        size="large"
                        style={{ height: "95vh" }}
                        indicator={antIcon}
                      />
                    </div>
                  )}
                </Content>
              </Layout>
            </div>
            <Drawer
              title="Profile Info"
              placement="right"
              width="50%"
              closable={false}
              onClose={this.onClose}
              visible={this.state.drawerVisible}
              style={{ padding: "0px" }}
            >
              <Profile userDetails={this.state.userDetails} />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: "100%",
                  borderTop: "1px solid #e9e9e9",
                  padding: "10px 16px",
                  background: "#fff",
                  textAlign: "right"
                }}
              >
                <Popconfirm
                  title="Are you sure you want to delete the account"
                  onConfirm={this.handleAccountDelete}
                  // onCancel={this.cancel}
                  okText="Yes"
                  icon={
                    <Icon type="question-circle-o" style={{ color: "red" }} />
                  }
                  cancelText="No"
                >
                  <Button
                    // onClick={this.handleAccountDelete}
                    type="primary"
                    // htmlType="submit"

                    className="login-form-button"
                  >
                    Delete Account
                  </Button>
                </Popconfirm>
              </div>
            </Drawer>
          </Content>
        </Layout>
      </Layout>
    );
  }
}

export default Landing;
