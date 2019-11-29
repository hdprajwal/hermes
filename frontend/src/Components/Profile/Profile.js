import React, { Component } from "react";
import {
  Drawer,
  Form,
  Button,
  Col,
  Row,
  Input,
  Select,
  DatePicker,
  Upload,
  Icon
} from "antd";
import Pic from "./undraw_manage_chats_ylx0 (1).svg";

const { Option } = Select;
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
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({
          editMode: true
        });
        console.log("Received values of form: ", values);

        //   fetch(`http://${IP}:4000/auth/registration`, {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "text/plain"
        //     },
        //     body: reqBody
        //   })
        //     .then(r => r.text())
        //     .then(data => console.log("data returned:", data));
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
          <img width="300px" height="400px" src={Pic} />
        </Row>
        <Row type="flex" justify="center">
          <Col span={16}>
            <Form onSubmit={this.handleSubmit} className="login-form">
              <Form.Item label="Name">
                {getFieldDecorator("username", {
                  rules: [
                    { required: true, message: "Username can not be empty" }
                  ]
                })(
                  <Input
                    disabled={this.state.editMode}
                    prefix={
                      <Icon type="user" style={{ color: "rgba(0,0,0,.25)" }} />
                    }
                    placeholder="Username"
                  />
                )}
              </Form.Item>
              <Form.Item label="About">
                {getFieldDecorator("about", {
                  rules: [
                    { required: true, message: "About section is required!" }
                  ]
                })(
                  <Input.TextArea
                    disabled={this.state.editMode}
                    placeholder="About"
                  />
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
        <Row>
          <div
            style={{
              right: 0,
              bottom: 0,
              width: "100%",
              borderTop: "1px solid #e9e9e9",
              padding: "10px 16px",
              background: "#fff",
              textAlign: "right"
            }}
          >
            <Button
              disabled={this.props.deleteAccount}
              type="primary"
              htmlType="submit"
              className="login-form-button"
            >
              Delete Account
            </Button>
          </div>
        </Row>
      </Row>
    );
  }
}
const ProfilePage = Form.create()(Profile);
export default ProfilePage;
