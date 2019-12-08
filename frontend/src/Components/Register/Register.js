import React, { Component } from "react";
import { Form, Icon, Button, Select, Carousel, notification } from "antd";
import illustration1 from "./undraw_texting_k35o.svg";
import illustration2 from "./undraw_begin_chat_c6pj.svg";
import illustration3 from "./undraw_connected_8wvi.svg";
import { IP, KEY } from "./../config";
import { Link } from "react-router-dom";
const jwt = require("jsonwebtoken");

const { Option } = Select;

class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rooms: []
    };

    fetch(`http://${IP}:4000/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          roomsList{
            RID
            name
          }
        }`
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log(res.data.roomsList);
        this.setState({ rooms: res.data.roomsList });
      });
  }
  openNotification = (type = "error") => {
    notification[type]({
      message: "Error Creating user",
      description: "An error was encountered during user creation please retry"
    });
  };
  openConfirmation = (type = "success") => {
    notification[type]({
      message: "User Created Succesfully",
      description: "Please check your email and verification email"
    });
  };
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
            rooms: values.rooms,
            about: values.about
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
          .then(data => {
            if (
              data === "User created successfully.Check email for verification"
            ) {
              this.openConfirmation();
            } else {
              this.props.form.resetFields();
              this.openNotification();
            }
          });
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <section
        className="hero is-fullheight"
        style={{ backgroundColor: "#F0F2F5" }}
      >
        <h1 className="is-size-1" style={{ color: "black" }}>
          HERMES
        </h1>
        <div className="hero-body">
          <div className="container">
            <div className="columns">
              <div className="column is-5 ">
                <Carousel autoplay>
                  <div>
                    <img src={illustration1} />
                  </div>
                  <div>
                    <img src={illustration2} />
                  </div>
                  <div>
                    <img src={illustration3} />
                  </div>
                </Carousel>
              </div>
              <div className="column is-5 is-offset-2">
                <div className="box">
                  <h1
                    className="is-size-2"
                    style={{
                      color: "black",
                      textAlign: "center"
                    }}
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
                          <label style={{ color: "black" }}>Email</label>
                          <input
                            className="input"
                            style={{
                              color: "black"
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
                          <label style={{ color: "black" }}>UserName</label>
                          <input
                            className="input"
                            style={{
                              color: "black"
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
                          <label style={{ color: "black" }}>Password</label>
                          <input
                            minLength="8"
                            className="input"
                            type="password"
                            style={{
                              color: "black"
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
                      {getFieldDecorator("about", {
                        rules: [
                          {
                            required: true,
                            message: "Please enter your username!"
                          }
                        ]
                      })(
                        <div>
                          <label style={{ color: "black" }}>About</label>
                          <textarea
                            className="input"
                            style={{
                              color: "black"
                            }}
                            placeholder="About"
                          />
                        </div>
                      )}
                    </Form.Item>
                    {this.state.rooms.length > 0 ? (
                      <Form.Item>
                        {getFieldDecorator("rooms", {
                          rules: [
                            {
                              required: false,
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
                            {this.state.rooms.map(each => {
                              return (
                                <Option value={each.RID}>{each.name}</Option>
                              );
                            })}
                          </Select>
                        )}
                      </Form.Item>
                    ) : null}
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
                        Register
                      </Button>
                      <p style={{ color: "black" }}>
                        Already have an Account ?{" "}
                        <Link to="/" style={{ color: "#6C63FF" }}>
                          Login
                        </Link>
                      </p>
                    </Form.Item>
                  </Form>
                </div>
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
