// React, Components Import
import React from "react";
/**
 * antd Imports
 */
import { Row, Col, Upload, Button, Input, Icon, Form } from "antd";
import { Link } from "react-router-dom";
import { useStoreState, useStoreActions } from "easy-peasy";

// Input Class Component
class InputFunction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      msg: ""
    };
  }

  handleChange = value => {
    this.setState(
      {
        msg: value
      },
      () => console.log(this.state)
    );
  };
  handleSubmit = () => {
    console.log(this.state.msg);
  };
  render() {
    return (
      <Row gutter={12} type="flex" justify="center">
        <Col span={23}>
          <Input
            style={{ width: "400px" }}
            onChange={({ target: { value } }) => this.handleChange(value)}
            onPressEnter={e => {
              this.handleSubmit(), (event.target.value = "");
            }}
          />
        </Col>
      </Row>
    );
  }
}

export default InputFunction;

{
  /* <input
            placeholder="Type Somthing..."
            onKeyPress={event =>
              event.key === "Enter"
                ? (this.handleSubmit(), (event.target.value = ""))
                : null
            }
            onChange={({ target: { value } }) => this.handleChange(value)}
            style={{
              width: "100%",
              height: "30px",
              borderRadius: "10px",
              background: "#fff",
              border: "#000",
              padding: "10px",
              fontSize: "1.1em",
              fontWeight: "normal",
              color: "black"
            }}
          /> */
}
