import React, { Component } from "react";
import { Row, Col, Button, Card, Tabs } from "antd";

import { IP, KEY } from "./../config";

import user_plus from "./user-plus-solid.svg";

const { TabPane } = Tabs;

class Request extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      users: [],
      user: [],
      requests: [this.props.requests]
    };
    this.socket = this.props.sock;
    console.log(this.props.uid)
    fetch(`http://${IP}:4000/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          userList{
            UID
            image
            name
            email
          }
        }`
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log(res.data.userList);
        this.setState({ users: res.data.userList });
      });
  }
  // handle message change
  handleChange = value => {
    this.setState({
      email: value
    });
  };

  // handle message submit
  handleSubmit = () => {
    let user = this.state.users.find(u => {
      return u.email === this.state.email;
    });
    console.log(user);
    this.setState({
      user: [user]
    });
  };

  replyFrientRequest = reply => {
    console.log(`Request ${reply}`);
    this.socket.emit("replyRequest", {
      reply,
      uid:this.props.uid,
      fromID:this.state.requests[0].fromID
    });
  };

  sendFriendRequest = () => {
    console.log("Request submitted for user:", this.state.user);
    this.socket.emit("request", { 
        to_email: this.state.user[0].email,
        uid:this.props.uid
    });
  };
  render() {
    return (
      <div>
        <Tabs defaultActiveKey='1'>
          <TabPane tab='Find Friends' key='1'>
            <Row>
              <Col span={24}>
                <input
                  className='input'
                  value={this.state.email}
                  placeholder='Enter email'
                  onKeyPress={event =>
                    event.key === "Enter" ? this.handleSubmit() : null
                  }
                  onChange={({ target: { value } }) => this.handleChange(value)}
                />
              </Col>
            </Row>
            <Row>
              {this.state.user.length > 0 ? (
                <Col span={24} style={{ padding: "20px" }}>
                  <Card
                    style={{ width: 300 }}
                    cover={
                      <img
                        alt='example'
                        src='https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png'
                      />
                    }
                    actions={[
                      <Button
                        type='link'
                        onClick={this.sendFriendRequest}
                        style={{ width: "100%", height: "100%" }}
                      >
                        <img
                          src={user_plus}
                          alt='User'
                          style={{ height: "20px", width: "20px" }}
                        />
                        Send Request
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={this.state.user[0].userName}
                      description='dkjfhgdfkjgkdjfghkjdfhgkjdfhgkjdfhgkjdfhgkjdfhg'
                    />
                  </Card>
                </Col>
              ) : (
                <div />
              )}
            </Row>
          </TabPane>
          <TabPane tab='Requests' key='2'>
            <Row>
              {this.state.requests.length > 0 ? (
                <Col span={24} style={{ padding: "20px" }}>
                  <Card
                    style={{ width: 300 }}
                    cover={
                      <img
                        alt='example'
                        src='https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png'
                      />
                    }
                    actions={[
                      <Button
                        type='link'
                        onClick={()=>{this.replyFrientRequest("declined")}}
                        style={{ width: "100%", height: "100%" }}
                      >
                        <i className='fas fa-user-plus'></i>
                        Decline
                      </Button>,
                      <Button
                        type='link'
                        onClick={()=>{this.replyFrientRequest("accepted")}}
                        style={{ width: "100%", height: "100%" }}
                      >
                        <i className='fas fa-user-plus'></i>
                        Accept
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={this.state.requests.name}
                      description='dkjfhgdfkjgkdjfghkjdfhgkjdfhgkjdfhgkjdfhgkjdfhg'
                    />
                  </Card>
                </Col>
              ) : (
                <div>No Requests</div>
              )}
            </Row>
          </TabPane>
        </Tabs>
      </div>
    );
  }
}

export default Request;
