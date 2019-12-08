import React, { Component } from "react";
import {
  Drawer,
  Form,
  Button,
  Col,
  Row,
  Input,
  Select,
  notification,
  Avatar,
  Icon
} from "antd";
import { IP } from "./../config";
import Pic from "./undraw_manage_chats_ylx0 (1).svg";
import jwt from "jsonwebtoken";
const { Option } = Select;
var myArray = ["#0B132B", "#1C2541", "#3A506B", "#5BC0BE", "#6FFFE9"];

var randomItem = myArray[Math.floor(Math.random() * myArray.length)];
class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedin: true,
      editMode: true
    };
  }
  enableEdit = () => {
    this.setState({
      editMode: false
    });
  };
  disableEditMode = () => {
    this.setState({
      editMode: true
    });
  };
  openNotification = (type = "error") => {
    notification[type]({
      message: "Error updating user details",
      description: "An error was encountered during updation of user details"
    });
  };
  openConfirmation = (type = "success") => {
    notification[type]({
      message: "User details changed Succesfully",
      description: "user Details was succesfully updated"
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({
          editMode: true
        });
        console.log("Received values of form: ", values);
        fetch(`http://${IP}:4000/graphql`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `mutation{
              updateUserDetails(uid:"${this.props.userDetails.uid}",name:"${values.username}",about:"${values.about}"){
                status
              }
            }`
          })
        })
          .then(res => res.json())
          .then(res => {
            console.log(res.data.updateUserDetails);
            if (res.data.updateUserDetails.status) {
              this.openConfirmation();
            } else {
              this.openNotification();
            }
          });
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Row>
        <Row type="flex" justify="end">
          <Button onClick={this.enableEdit}>Edit Details</Button>
        </Row>
        <Row type="flex" justify="center">
          <Avatar
            size={200}
            style={{
              fontSize: "64px",
              verticalAlign: "middle",
              background: randomItem
            }}
          >
            {this.props.userDetails.name}
          </Avatar>
        </Row>
        <Row type="flex" justify="center">
          <Col span={16}>
            <Form onSubmit={this.handleSubmit} className="login-form">
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
                      disabled={this.state.editMode}
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
                      defaultValue={this.props.userDetails.name}
                      placeholder="UserName"
                    />
                  </div>
                )}
              </Form.Item>
              <Form.Item>
                {getFieldDecorator("about", {
                  rules: [
                    { required: true, message: "About section is required!" }
                  ]
                })(
                  <div>
                    <label style={{ color: "black" }}>About</label>
                    <input
                      disabled={this.state.editMode}
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
                      defaultValue={this.props.userDetails.about}
                      placeholder="About"
                    />
                  </div>
                )}
              </Form.Item>
              <Form.Item>
                <Button
                  disabled={this.state.editMode}
                  type="primary"
                  htmlType="submit"
                  className="login-form-button"
                >
                  Change details
                </Button>
                <Button
                  disabled={this.state.editMode}
                  onClick={this.disableEditMode}
                  className="login-form-button"
                >
                  Cancel
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Row>
    );
  }
}
const ProfilePage = Form.create()(Profile);
export default ProfilePage;
