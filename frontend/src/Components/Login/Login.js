// React, Components Import
import React from "react";
import { Form, Button, Checkbox, Card, notification, Spin } from "antd";
import { IP, KEY } from "./../config";
import { Link } from "react-router-dom";
import svgLogin from "./undraw_online_chat_d7ek.svg";
const jwt = require("jsonwebtoken");

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedin: false,
      spinner: false
    };
  }

  openNotification = (type = "error") => {
    notification[type]({
      message: "Login",
      description: "Entered Email or Password is incorrect"
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({
          spinner: true
        });
        console.log("Received values of form: ", values);
        var reqBody = jwt.sign(
          { email: values.email, password: values.password },
          Buffer.from(KEY, "hex")
        );
        console.log(reqBody);
        fetch(`http://${IP}:4000/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain"
          },
          body: reqBody
        })
          .then(r => r.text())
          .then(data => {
            console.log("data returned:", data);
            jwt.verify(
              data,
              Buffer.from(KEY, "hex"),
              { ignoreExpiration: false },
              (err, decoded) => {
                this.setState({
                  spinner: false
                });
                if (err) {
                  console.log(err);
                  this.openNotification();
                } else {
                  let details = decoded;
                  console.log(details);
                  localStorage.setItem("token", data);
                  this.props.updateLogin();
                }
              }
            );
          });
      } else {
        throw err;
      }
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Spin spinning={this.state.spinner}>
        <section
          className="hero is-fullheight"
          style={{ backgroundColor: "#F0F2F5" }}
        >
          <h1 className="is-size-1" style={{ color: "black " }}>
            HERMES
          </h1>
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
                      Login
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
                            <label style={{ color: "black" }}>Password</label>
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
                          Log in
                        </Button>
                        <p style={{ color: "black" }}>
                          Do not have an Account{" "}
                          <Link to="/register" style={{ color: "#6C63FF" }}>
                            register now!
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
      </Spin>
    );
  }
}
const WrappedNormalLoginForm = Form.create({ name: "login" })(Login);

export default WrappedNormalLoginForm;
