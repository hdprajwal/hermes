import React, { Component } from "react";
import svgLogin from "./Login/undraw_online_chat_d7ek.svg";
import { Form, Button } from "antd";

class CreateRooms extends Component {
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
                        {getFieldDecorator("email", {
                          rules: [
                            {
                              required: true,
                              message: "Please enter your email!"
                            }
                          ]
                        })(
                          <div>
                            <label style={{ color: "black" }}>Room Name</label>
                            <input
                              className="input"
                              type="email"
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
