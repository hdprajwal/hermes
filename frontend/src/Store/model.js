import { action, thunk } from "easy-peasy";
const jwt = require("jsonwebtoken");

export default {
  appState: {
    loggedIn: false,
    updateLogin: action((state, payload) => {
      state.loggedIn = true;
    })
  }
};
