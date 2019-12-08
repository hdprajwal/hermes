import React, { Component } from "react";
import svgLogin from "./Login/undraw_online_chat_d7ek.svg";
import { IP } from "./config";
import { Form, Button, notification } from "antd";

class CreateRooms extends Component {
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log("Received values of form: ", values);
        let pass = "h3rme$";
        if (values.password == pass) {
          fetch(`http://${IP}:4000/graphql`, {
            method: "POST",
            headers: {
              "content-Type": "application/json"
            },
            body: JSON.stringify({
              query: `mutation{
                addRoom(name:"${values.roomName}"){
                  RID
                  name
                }
              }`
            })
          })
            .then(r => r.json())
            .then(data => {
              console.log(data);
              let x = data.data;
              if (x.addRoom.name === values.roomName) {
                this.openConfirmation();
              }
            });
        } else {
          this.openNotification();
        }
      }
    });
  };
  openNotification = (type = "error") => {
    notification[type]({
      message: "Password is Wrong",
      description: "Enter a valid Admin Password "
    });
  };
  openConfirmation = (type = "success") => {
    notification[type]({
      message: "Password is Wrong",
      description: "Enter a valid Admin Password "
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <div>
        <section
          className="hero is-fullheight"
          style={{ backgroundColor: "#F0F2F5" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h1 className="is-size-1" style={{ color: "black " }}>
              HERMES
            </h1>
          </div>
          <div className="hero-body">
            <div className="container">
              <div className="columns">
                <div className="column is-5 ">
                  <img src={svgLogin} />
                </div>
                <div className="column is-5 is-offset-2">
                  <div className="box">
                    <h1
                      className="is-size-2"
                      style={{ color: "black", textAlign: "center" }}
                    >
                      Create Rooms
                    </h1>
                    <Form onSubmit={this.handleSubmit}>
                      <Form.Item>
                        {getFieldDecorator("roomName", {
                          rules: [
                            {
                              required: true,
                              message: "Please enter a room name!"
                            }
                          ]
                        })(
                          <div>
                            <label style={{ color: "black" }}>Room Name</label>
                            <input
                              className="input"
                              style={{
                                background: "#fff",
                                color: "black"
                                // border: "#000"
                              }}
                            />
                          </div>
                        )}
                      </Form.Item>
                      <Form.Item>
                        {getFieldDecorator("password", {
                          rules: [
                            {
                              required: true,
                              message: "Please enter your Password!"
                            }
                          ]
                        })(
                          <div>
                            <label style={{ color: "black" }}>
                              {" "}
                              Admin Password
                            </label>
                            <input
                              className="input"
                              type="password"
                              style={{
                                background: "#fff",
                                color: "black"
                                // border: "black"
                              }}
                            />
                          </div>
                        )}
                      </Form.Item>
                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          style={{
                            width: "100%",
                            background: "#6C63FF",
                            border: "#6C63FF",
                            color: "#fff"
                          }}
                        >
                          Create Room
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

const CreateRoomsForm = Form.create({ name: "createRooms" })(CreateRooms);

export default CreateRoomsForm;
