const express = require("express");
const router = express.Router();

const neo4j = require("neo4j-driver").v1;
const driver = neo4j.driver(
  "bolt://hobby-lmhdnlhdaiclgbkeajjohedl.dbs.graphenedb.com:24787",
  neo4j.auth.basic("server", "b.Xgokk4CIAj5q.UZqV76sIFSlZYqGz")
);

router.post("/", (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    const session = driver.session();

    session
      .run(`MATCH (user:User {username:"${username}"}) RETURN user;`)
      .then(result => {
        if (result.records.length === 0) {
          return session.run(
            `CREATE (user:User {username:"${username}", password:"${password}", active: true })
            RETURN user;`
          );
        } else {
          throw new Error("Username already exists!");
        }
      })
      .then(result => {
        if (result.records.length === 1) {
          const {
            username,
            password
          } = result.records[0].toObject().user.properties;
          res.status(201).send({ username, password });
        } else {
          throw new Error("User creation failed!");
        }
      })
      .catch(error => res.status(400).send({ error: error.message }));

    session.close();
  } else {
    res.status(400).send({
      error:
        "Missing required properties, User must have properties: `username` and `password`!"
    });
  }
});

router.put("/:username", (req, res) => {
  const username = req.params.username;
  const { password, newPassword } = req.body;

  if (password && newPassword) {
    const session = driver.session();

    session
      .run(
        `MATCH (user:User {username:"${username}", password:"${password}", active: true })
      SET user.password = "${newPassword}"
      RETURN user;`
      )
      .then(result => {
        if (result.records.length === 1) {
          const {
            username,
            password
          } = result.records[0].toObject().user.properties;
          res.status(200).send({ username, password });
        } else {
          res
            .status(400)
            .send({ error: "User doesn't exist or incorrect password!" });
        }
      })
      .catch(error => res.status(400).send({ error: error }));

    session.close();
  } else {
    res.status(400).send({
      error:
        "Missing required properties, must have properties: `password` and `newPassword`!"
    });
  }
});

router.delete("/:username", (req, res) => {
  const username = req.params.username;
  const { password } = req.body;

  if (password) {
    const session = driver.session();

    session
      .run(
        `MATCH (user:User {username:"${username}", password:"${password}", active: true })
        SET user.active = false
        RETURN user;`
      )
      .then(result => {
        if (result.records.length === 1) {
          const {
            username,
            password
          } = result.records[0].toObject().user.properties;
          res.status(200).send({ username, password });
        } else {
          res
            .status(400)
            .send({ error: "User doesn't exist or incorrect password!" });
        }
      })
      .catch(error => res.status(400).send({ error: error }));

    session.close();
  } else {
    res.status(400).send({
      error: "Missing required property, must have property: `password`!"
    });
  }
});

router.get("/", (req, res) => {
  const session = driver.session();

  session
    .run(`MATCH (user:User { active: true }) RETURN user;`)
    .then(result => {
      const users = [];
      result.records.forEach(record => {
        users.push(record.toObject().user.properties.username);
      });
      
      const sortedUsers = users.sort();
      res.status(200).send({ sortedUsers });
    })
    .catch(error => res.status(400).send({ error: error }));
});

router.get("/:username", (req, res) => {
    const username = req.params.username;
  
    const session = driver.session();
  
      session
        .run(
          `MATCH (user:User {username:"${username}", active: true })
          RETURN user;`
        )
        .then(result => {
          if (result.records.length === 1) {
            const username = result.records[0].toObject().user.properties.username;
            res.status(200).send({ username });
          } else {
            res
              .status(400)
              .send({ error: "User doesn't exist!" });
          }
        })
        .catch(error => res.status(400).send({ error: error }));
  
      session.close();
  });

  router.post("/exists", (req, res) => {
    const username = req.body.username;
  
    if (username) {
        const session = driver.session();
  
      session
        .run(
          `MATCH (user:User {username:"${username}" })
          RETURN user;`
        )
        .then(result => {
            const exists = result.records.length === 1;
            res.status(200).send({ result: exists });
        })
        .catch(error => res.status(400).send({ error: error }));
  
      session.close();
    } else {
        res.status(400).send({
          error: "Missing required property, must have property: `username`!"
        });
      }
  });

module.exports = router;