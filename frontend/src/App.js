// React Import
import React from "react";

// React-router import
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";

// antd import
import { Row, Col } from "antd";
/**
 * CSS Imports
 *  1. bulma.css
 *  2. antd.css
 *  3. App.css
 */
import "bulma/css/bulma.css";
import "antd/dist/antd.css";
import "./App.css";

// Components Import
import Login from "./Components/Login/Login";
import Register from "./Components/Register/Register";
import Landing from "./Components/Landing/Landing";
import ForgotPassword from "./Components/ForgotPassword/ForgotPassword";
const jwt = require("jsonwebtoken");

// electron-store import
// var { app, BrowserWindow } = window.require("electron").remote;

// electron-store setup
// const store = new Store({
//   name: "Settings",
//   encryptionKey:
//     "677e8e805553df6aaac622e6d01107bd31f62829ff72faf67e2ea5818ae3c438"
// });

// Private route
function PrivateRoute({ component: Component, authed, ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        authed === true ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: "/", state: { from: props.location } }} />
        )
      }
    />
  );
}

// App function
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedin: false,
      page: localStorage.getItem("token")
        ? jwt.decode(localStorage.getItem("token")).UID
          ? "landing"
          : "login"
        : "login"
    };
  }

  updateLogin = () => {
    console.log("logged in");
    this.setState({ loggedin: true, page: "landing" });
  };
  updateLogout = () => {
    console.log("logged Out");
    localStorage.removeItem("token");
    this.setState({ loggedin: false, page: "login" });
  };

  render() {
    let page;

    switch (this.state.page) {
      case "login":
        page = (
          <Login
            loggedin={this.state.loggedin}
            updateLogin={this.updateLogin}
          />
        );
        break;
      case "landing":
        page = <Landing updateLogout={this.updateLogout} />;
        break;
      default:
        page = <Login />;
        break;
    }

    return (
      <div className="box" style={{ padding: "0px" }}>
        <Row>
          <Col>
            <Router>
              <Switch>
                <Route exact path="/">
                  {page}
                </Route>
                <Route exact path="/register">
                  {" "}
                  <Register />{" "}
                </Route>
              </Switch>
            </Router>
          </Col>
        </Row>
      </div>
    );
  }
}

export default App;
