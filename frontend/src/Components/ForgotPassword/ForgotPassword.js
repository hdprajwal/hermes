// React, Components Import
import React, { Component } from "react";
/**
 * antd Imports
 */
import { Form, Button, Card } from "antd";
// react-router import

// Forgot Password Class Component
class ForgotPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  // Form Submit handler function
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log("Received values of form: ", values);
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <section
        className='hero is-fullheight'
        style={{ backgroundColor: "#0B132B" }}
      >
        <h1 className='is-size-1' style={{ color: "white " }}>
          HERMES
        </h1>
        <div className='hero-body'>
          <div className='container'>
            <div className='columns'>
              <div className='column is-5 is-offset-7'>
                <Card bordered={false} style={{ background: "#1C2541" }}>
                  <h1
                    className='is-size-2'
                    style={{ color: "white", textAlign: "center" }}
                  >
                    Reset Password
                  </h1>
                  <Form onSubmit={this.handleSubmit}>
                    <Form.Item>
                      {getFieldDecorator("password", {
                        rules: [
                          {
                            required: true,
                            message: "Please enter a New Password!"
                          }
                        ]
                      })(
                        <div>
                          <label style={{ color: "white" }}>New Password</label>
                          <input
                            type='text'
                            className='input'
                            style={{
                              color: "white",
                              background: "#0B132B",
                              border: "black"
                            }}
                          />
                        </div>
                      )}
                    </Form.Item>
                    <Form.Item>
                      {getFieldDecorator("Confirm Password", {
                        rules: [
                          {
                            required: true,
                            message: "Please enter Password again!"
                          },
                          {
                            validator: async (rule, value) => {
                              if (value && value.length !== 10) {
                                throw new Error(
                                  "Min 8 characters \n at least one uppercase\n one lowercase\n one number \n one special character"
                                );
                              }
                            }
                          }
                        ]
                      })(
                        <div>
                          <label style={{ color: "white" }}>
                            Confirm Password
                          </label>
                          <input
                            type='text'
                            className='input'
                            style={{
                              background: "#0B132B",
                              color: "white",
                              border: "black"
                            }}
                          />
                        </div>
                      )}
                    </Form.Item>
                    <Form.Item>
                      <Button
                        type='primary'
                        htmlType='submit'
                        style={{
                          width: "100%",
                          background: "#6FFFE9",
                          color: "black"
                        }}
                      >
                        Reset Password
                      </Button>
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
const WrappedNormalForgotPasswordForm = Form.create({ name: "ForgotPassword" })(
  ForgotPassword
);

export default WrappedNormalForgotPasswordForm;
