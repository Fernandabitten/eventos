const express = require("express");
const serverless = require("serverless-http");
const app = express();
const router = express.Router()
const HOSTNAME = "localhost:";
const SERVER_PORT = "3010";

const fs = require("fs");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
let path = require("path");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use(
  "/style.css",
  express.static(path.join(__dirname, "public/login/style.css"))
);
app.use("/public", express.static(path.join(__dirname, "public")));

const USERS_DIR = __dirname + "/database/users.json";
const EVENTS_DIR = __dirname + "/database/events.json";
const LOGIN_DIR = __dirname + "/public/login/index.html";
const CLIENT_DIR = __dirname + "/public/client/clientLogged.html";
const ADMIN_DIR = __dirname + "/public/admin/adminLogged.html";

let SESSIONS = [];

// -------- APIs -------------------//
router.get("/", (req, res) => {
  res.clearCookie("session_id");
  res.sendFile(LOGIN_DIR);
});

app.get("/admin", (req, res) => {
  res.sendFile(ADMIN_DIR);
});

app.get("/client", (req, res) => {
  res.sendFile(CLIENT_DIR);
});

app.post("/register", async (req, res, next) => {
  try {
    readFile(USERS_DIR).then(async (usersDB) => {
      const newUser = req.body;

      if (validateUser(newUser, usersDB)) {
        const saltRounds = 13;
        let salt = await bcrypt.genSalt(saltRounds);
        let hash = await bcrypt.hash(newUser.password, salt);

        usersDB.push({
          username: newUser.username,
          fullname: newUser.fullname,
          hash: hash,
          salt: salt,
          usertype: "user",
        });

        saveFile(USERS_DIR, usersDB).then((result) => res.send("OK"));
      } else {
        res.status(403).json({ msg: "username já cadastrado" });
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Erro interno, tente mais tarde" });
    next(err);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    readFile(USERS_DIR).then(async (usersDB) => {
      const savedUser = usersDB.find((element) => element.username == username);

      if (savedUser) {
        const hash = await bcrypt.hash(password, savedUser.salt);

        if (savedUser.hash == hash) {
          const sessionToken = await bcrypt.hash(
            new Date().getTime() + username,
            savedUser.salt
          );
          SESSIONS.push({ token: sessionToken, username: username });
          console.log("log in SESSIONS: ", SESSIONS);
          res.cookie("session_id", sessionToken);

          if (savedUser.usertype === "admin") {
            res.send("/admin");
          } else {
            res.send("/client");
          }
        } else {
          res.status(403).json({ msg: "Usuário ou senha incorretos" });
        }
      } else {
        res.status(404).json({ msg: "Usuário não encontrado" });
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Erro interno, tente mais tarde" });
  }
});

app.post("/register-event", (req, res) => {
  readFile(EVENTS_DIR)
    .then((eventsDB) => {
      const newEvent = req.body;
      if (validateEvent(newEvent)) {
        newEvent["id"] = Date.now().toString();
        newEvent["users"] = [];
        eventsDB.push(newEvent);

        saveFile(EVENTS_DIR, eventsDB).then((result) => res.send("OK"));
      } else {
        res.status(403).json({ msg: "Evento inválido" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
});

app.get("/events", (req, res) => {
  const { cookies } = req;

  const session = SESSIONS.find(
    (element) => element.token == cookies.session_id
  );
  readFile(EVENTS_DIR)
    .then((eventsDB) => {
      res.send(
        eventsDB.map((event) => {
          event.isRegistred = event.users.some(
            (element) => element === session.username
          );
          return event;
        })
      );
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
});

app.post("/register-user-event", async (req, res) => {
  const { cookies } = req;
  const event = req.body;

  const session = SESSIONS.find(
    (element) => element.token == cookies.session_id
  );

  if (session) {
    readFile(EVENTS_DIR)
      .then(async (eventsDB) => {
        const eventIndex = eventsDB.findIndex(
          (element) => element.id == event.id
        );

        if (
          !eventsDB[eventIndex].users.some(
            (element) => element.username === session.username
          )
        ) {
          eventsDB[eventIndex].users.push({
            username: session.username,
            joinDate: new Date().getTime(),
            used: false,
            checkDate: "",
            qrcode: `http://${HOSTNAME}${SERVER_PORT}/check-qrcode/${session.username}/${eventsDB[eventIndex].id}`,
          });
        }
        saveFile(EVENTS_DIR, eventsDB).then((result) => res.send("OK"));
      })
      .catch((err) => {
        res.status(500).json({ message: err.message });
      });
  } else {
    res.status(500).json({ msg: "Erro interno, tente mais tarde" });
  }
});

app.get("/user", (req, res) => {
  readFile(USERS_DIR)
    .then((usersDB) => {
      res.send(usersDB);
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
});

// ------ FUNCOES UTEIS -------------//
const validateUser = (user, usersDB) => {
  let isValid = true;
  // valida se todos os campos existem
  isValid = user.username && user.password && user.fullname;
  // valida se nao existe nenhum username igual já cadastrado
  isValid = !usersDB.some((element) => element.username == user.username);
  return isValid;
};

const validateEvent = (event) => {
  let isValid = true;
  console.log("event", event);
  // verificar se tem todos os campos
  isValid =
    event.title &&
    event.description &&
    event.date &&
    event.time &&
    event.location;
  console.log("isValid", isValid);
  return isValid;
};

const readFile = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, "utf-8", (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
};

const saveFile = (fileName, data) => {
  return new Promise((resolve, reject) => {
    const dataText = JSON.stringify(data);
    fs.writeFile(fileName, dataText, (err) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve("JSON salvo");
    });
  });
};

app.get("/log-out", (req, res) => {
  const cookieReference = req.cookies.session_id;
  const session = SESSIONS.filter((e) => {
    return e.token !== cookieReference;
  });
  SESSIONS = session;
  res.clearCookie("session_id");
  console.log("log out SESSIONS: ", SESSIONS);
});

app.get("/verify", (req, res) => {
  const cookieReference = req.cookies.session_id;
  const verify = () => {
    const exists = SESSIONS.some((e) => {
      if (e.token == cookieReference) {
        return true;
      } else {
        return false;
      }
    });
    return exists;
  };
  if (verify() === false) {
    res.send("/");
  }
});

app.post("/check-event", (req, res) => {
  const eventId = req.body.eventId;
  const eventTitle = req.body.eventTitle;
  const { cookies } = req;
  const session = SESSIONS.find(
    (element) => element.token == cookies.session_id
  );

  readFile(EVENTS_DIR).then(async (eventsDB) => {
    const eventIndex = eventsDB.findIndex((element) => element.id == eventId);

    if (
      eventsDB[eventIndex].users.some(
        (element) => element.username === session.username
      )
    ) {
      const userIndex = eventsDB[eventIndex].users.findIndex(
        (element) => element.username == session.username
      );
      if (eventsDB[eventIndex].users[userIndex].used === false) {
        res.send({
          qrcode: eventsDB[eventIndex].users[userIndex].qrcode,
          htmlText: `
            <div id="event-confirmation-box" class="confirm-events">
              <h1>Confirmar presença</h1>
              <p>Apresente esse QR code na entrada do evento para registrar sua presença.</p>
              <p>Obs: esse QR code só poderá ser lido uma única vez</p>
              <h2>${eventTitle}</h2>
              <div id="placeHolder"></div>
              <button id="sair">Voltar</button>
            </div>
          `,
          exists: true,
          used: eventsDB[eventIndex].users[userIndex].used,
        });
      } else {
        res.send({
          qrcode: eventsDB[eventIndex].users[userIndex].qrcode,
          htmlText: `
            <div id="event-confirmation-box" class="confirm-events">
              <h1>Sua participação já foi confirmada nesse evento!</h1>
              <h2>${eventTitle}</h2>
              <button id="sair">Voltar</button>
            </div>
          `,
          exists: true,
          used: eventsDB[eventIndex].users[userIndex].used,
        });
      }
    } else {
      res.send({
        htmlText: `
          <div id="event-confirmation-box" class="confirm-events">
            <h1>Cadastrar-se neste evento</h1>
            <h2>${eventTitle}</h2>
            <button class="check-button" type='button' id="confirmarCadastrarNoEvento-button">Confirmar Cadastro</button>   
            <button id="sair">Voltar</button>
          </div>
        `,
        exists: false,
      });
    }
  });
});

app.get("/check-qrcode/:username/:eventId", (req, res) => {
  const { eventId } = req.params;
  const { username } = req.params;

  readFile(EVENTS_DIR).then(async (eventsDB) => {
    const eventIndex = eventsDB.findIndex((element) => element.id == eventId);
    const userIndex = eventsDB[eventIndex].users.findIndex(
      (element) => element.username == username
    );
    if (eventsDB[eventIndex].users[userIndex].used === false) {
      eventsDB[eventIndex].users[userIndex].checkDate = new Date().getTime();
      eventsDB[eventIndex].users[userIndex].used = true;
      eventsDB[eventIndex].users[userIndex].qrcode = "";
      saveFile(EVENTS_DIR, eventsDB).then((result) => {
        res.send(`
        <div id="checkQrcode">
          <h1>${fullname}, sua participação no evento ${eventsDB[eventIndex].title} foi confirmada.</h1>
          <h2>Descrição:</h2>
          <p>${eventsDB[eventIndex].description}</p>
          <h2>Data do evento:</h2>
          <p>${eventsDB[eventIndex].date}</p>
          <h2>Horário de início:</h2>
          <p>${eventsDB[eventIndex].time} h</p>c
          <h2>Endereço:</h2>
          <p>${eventsDB[eventIndex].location}</p>
        </div>
        `);
      });
    } else {
      res
        .status(403)
        .json({ message: "Houve um erro na verificação dos dados." });
    }
  });
});

/*app.listen(SERVER_PORT, () => {
  console.log(`Server running at http://${HOSTNAME}${SERVER_PORT}/`);
});*/
app.use("/.netlify/functions/api", router)
module.exports = app;
module.exports.handler = serverless(app)