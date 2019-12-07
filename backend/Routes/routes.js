const express = require("express");
const router = express.Router();
const graphqlHTTP = require("express-graphql");
const schema1 = require("../GraphQL/GQLSchema");
const { Users, Verification, LoginLog } = require("../models/db_model");
const { serverLog, dbLog } = require("../Loggers/loggers");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

require("dotenv").config();

router.use(
  "/graphql",
  graphqlHTTP({
    schema: schema1,
    graphiql: true
  })
);

router.use("/auth", express.text());
router.use("/auth", express.json());

router.use("/auth", (req, res, next) => {
  if (req.body) {
    jwt.verify(
      req.body,
      Buffer.from(process.env.KEY, "hex"),
      { ignoreExpiration: false },
      (err, decoded) => {
        if (err) {
          serverLog.warn("Unauthorised access attempt at /auth");
          res.status(406).send("Invalid Token");
        } else next();
      }
    );
  } else {
    serverLog.warn("No token access attempt at /auth");
    res.status(400).send("Empty body received");
  }
});

router.post("/auth/login", (req, res) => {
  const token = jwt.decode(req.body);
  console.log(token);
  Users.findOne({
    attributes: ["uid", "password", "verified"],
    where: {
      email: token.email
    }
  })
    .then(out => {
      serverLog.info("User Login query with uid= " + out.uid);
      dbLog.info("User queried with email= " + out.email);
      if (out.password == token.password) {
        if (out.verified == true) {
          LoginLog.create({
            action: "login",
            userid: out.uid,
            IPAddr: `${req.ip.slice(8, req.ip.length)}`
          })
            .then(result => {
              serverLog.info("Login log creation complete");
              dbLog.info(
                "Login log complete with uid= " +
                  result.uid +
                  " ip= " +
                  result.IPAddr
              );
              const Rtoken = jwt.sign(
                { uid: `${out.uid}` },
                Buffer.from(process.env.KEY, "hex"),
                { expiresIn: "30d" }
              );
              serverLog.info("Token generated with uid= " + result.userid);
              res.status(200).send(Rtoken);
            })
            .catch(err => {
              serverLog.error(
                "Failed to create login log or token generation error"
              );
              dbLog.error(
                "Failed to create login log or token error with error: " + err
              );
              res.status(500).send("internal server error");
            });
        } else {
          serverLog.warn(
            `Non Verified User login attempt with uid= ${out.uid}`
          );
          res.status(403).send("User is not verified");
        }
      } else {
        serverLog.warn("Incorect password access at /auth/login");
        res.status(401).send("Incorrect password");
      }
    })
    .catch(err => {
      serverLog.warn("Failed to find user with email: " + token.email);
      dbLog.warn(
        "Failed to find user with email: " + token.email + " with error: " + err
      );
      res.status(404).send("User does not exist");
    });
});

router.post("/auth/registration", async (req, res) => {
  const token = jwt.decode(req.body);
  console.log(token);
  Users.create(token)
    .then(out => {
      serverLog.info("User created with uid=" + out.uid);
      dbLog.info("User created with args=" + JSON.stringify(token));
      Verification.findOne({ where: { email: out.email } })
        .then(async result => {
          dbLog.info("Verification code found for email=" + result.email);
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.MAIL,
              pass: process.env.PASS
            }
          });
          let url =
            '<a href="http://165.22.221.120:4000/verify?email=' +
            result.email +
            "&code=" +
            result.code +
            '">Verify Account</a>';
          const mailOptions = {
            from: process.env.MAIL,
            to: out.email,
            subject: "Hermes Messenger account verification",
            html:
              "<h1>Hermes Support</h1><br><p>Please click the link below to verify your account</p><br>" +
              url
          };
          let info = await transporter.sendMail(mailOptions);
          serverLog.info(
            "Verification mail sent to " +
              result.email +
              " with messageID= " +
              info.messageId
          );
          res
            .status(201)
            .send("User created successfully.Check email for verification");
        })
        .catch(err => {
          dbLog.error(
            "Failed to find Verification with email= " +
              out.email +
              " with error: " +
              err
          );
          res.status(500).send("internal server error");
        });
    })
    .catch(err => {
      serverLog.error(
        "Failed to create user with args= " +
          JSON.stringify(token) +
          " with error: " +
          err
      );
      res.status(500).send("internal server error");
    });
});

router.get("/verify", (req, res) => {
  Verification.findOne({
    attributes: ["code"],
    where: {
      email: req.query.email
    }
  })
    .then(out => {
      dbLog.info("Verification quried with email= " + req.query.email);
      if (req.query.code == out.code) {
        Verification.destroy({
          where: {
            email: req.query.email
          }
        })
          .then(() => {
            serverLog.info("User verified with email= " + req.query.email);
            dbLog.info(
              "Verification record deleted with email: " + req.query.email
            );
            res.status(200).send("Verification successful");
          })
          .catch(err => {
            serverLog.error(
              "Failed to delete Verification record with email= " +
                req.query.email
            );
            dbLog.error(
              "Failed to delete Verification record with error: " + err
            );
            res.status(500).send("internal server error");
          });
      } else {
        serverLog.warn(
          "User failed to verify: code mismatch. email= " + req.query.email
        );
        res.status(401).send("Verification failed");
      }
    })
    .catch(err => {
      serverLog.error(
        "Failed to verify User due to DB error. email= " + req.query.email
      );
      dbLog.error(
        "Verification query failed with email= " +
          req.query.email +
          " error: " +
          err
      );
      res.status(500).send("internal server error");
    });
});

module.exports = { router };
