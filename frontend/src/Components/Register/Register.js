import React, { Component } from "react";
import { Form, Icon, Button, Select, Card } from "antd";

import { IP, KEY } from "./../config";
import { Link } from "react-router-dom";
const jwt = require("jsonwebtoken");

const { Option } = Select;
let rooms = [
  {
    RID: "96f57110-1276-11ea-ae82-21593fb3fbea",
    name: "CS GO"
  },
  {
    RID: "97e29030-1276-11ea-ae82-21593fb3fbea",
    name: "BOMB SQUAD"
  },
  {
    RID: "99667110-1276-11ea-ae82-21593fb3fbea",
    name: "COD"
  },
  {
    RID: "9aa90330-1276-11ea-ae82-21593fb3fbea",
    name: "COD"
  }
];
class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log("Received values of form: ", values);
        var reqBody = jwt.sign(
          {
            email: values.email,
            name: values.username,
            password: values.password,
            rooms: values.rooms
          },
          Buffer.from(
            "677e8e805553df6aaac622e6d01107bd31f62829ff72faf67e2ea5818ae3c438",
            "hex"
          )
        );
        console.log(reqBody);
        fetch(`http://${IP}:4000/auth/registration`, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain"
          },
          body: reqBody
        })
          .then(r => r.text())
          .then(data => console.log("data returned:", data));
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <section
        className="hero is-fullheight"
        style={{ backgroundColor: "#0B132B" }}
      >
        <h1 className="is-size-1" style={{ color: "white" }}>
          HERMES
        </h1>
        <div className="hero-body">
          <div className="container">
            <div className="columns">
              <div className="column is-5 is-offset-7">
                <Card bordered={false} style={{ background: "#1C2541" }}>
                  <h1
                    className="is-size-2"
                    style={{ color: "white", textAlign: "center" }}
                  >
                    Register
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
                          <label style={{ color: "white" }}>Email</label>
                          <input
                            className="input"
                            style={{
                              background: "#0B132B",
                              color: "white",
                              border: "blue"
                            }}
                            prefix={
                              <Icon
                                type="mail"
                                style={{ color: "rgba(0,0,0,.25)" }}
                              />
                            }
                            placeholder="Email"
                          />
                        </div>
                      )}
                    </Form.Item>
                    <Form.Item>
                      {getFieldDecorator("username", {
                        rules: [
                          {
                            required: true,
                            message: "Please enter your username!"
                          }
                        ]
                      })(
                        <div>
                          <label style={{ color: "white" }}>UserName</label>
                          <input
                            className="input"
                            style={{
                              background: "#0B132B",
                              color: "white",
                              border: "black"
                            }}
                            prefix={
                              <Icon
                                type="text"
                                style={{ color: "rgba(0,0,0,.25)" }}
                              />
                            }
                            placeholder="UserName"
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
                          <label style={{ color: "white" }}>Password</label>
                          <input
                            minLength="8"
                            className="input"
                            type="password"
                            style={{
                              background: "#0B132B",
                              color: "white",
                              border: "black"
                            }}
                            prefix={
                              <Icon
                                type="password"
                                style={{ color: "rgba(0,0,0,.25)" }}
                              />
                            }
                            placeholder="Password"
                          />
                        </div>
                      )}
                    </Form.Item>
                    <Form.Item>
                      {getFieldDecorator("rooms", {
                        rules: [
                          {
                            required: true,
                            message: "Please select rooms!"
                          }
                        ]
                      })(
                        <Select
                          mode="multiple"
                          style={{ width: "100%" }}
                          placeholder="Select Rooms"
                          // onChange={handleChange}
                        >
                          {rooms.map(each => {
                            return (
                              <Option value={each.RID}>{each.name}</Option>
                            );
                          })}
                        </Select>
                      )}
                    </Form.Item>
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        style={{
                          width: "100%",
                          background: "#6FFFE9",
                          border: "#6FFFE9",
                          color: "#0B132B"
                        }}
                      >
                        Register
                      </Button>
                      <p style={{ color: "white" }}>
                        Already have an Account ?{" "}
                        <Link to="/" style={{ color: "#6FFFE9" }}>
                          Login
                        </Link>
                      </p>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
const WrappedNormalRegisterForm = Form.create({ name: "login" })(Register);

export default WrappedNormalRegisterForm;
