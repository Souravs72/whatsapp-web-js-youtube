// create a basic node js with express app
require('dotenv').config();
const express = require("express");
const { Client, RemoteAuth } = require("whatsapp-web.js");
const app = express();
const port = 3001;
const http = require("http");
const server = http.createServer(app);
const { MongoStore } = require("wwebjs-mongo");
const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI

let store;
mongoose.connect(MONGO_URI).then(() => {
  console.log("hello connected mongoDB");
  store = new MongoStore({ mongoose: mongoose });
});
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});

server.listen(port, () => {
  console.log("listening on *:", port);
});
const allSessionsObject = {};
var client = null;
const createWhatsappSession = (id, socket) => {
  client = new Client({
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: '/usr/bin/chromium-browser'
    },
    authStrategy: new RemoteAuth({
      clientId: id,
      store: store,
      backupSyncIntervalMs: 300000,
      dataPath: 'session'
    }),
  });

  client.on("qr", (qr) => {
    console.log("QR RECEIVED", qr);
    socket.emit("qr", {
      qr,
    });
  });

  client.on("authenticated", () => {
    console.log("AUTHENTICATED");
  });
  client.on("ready", () => {
    console.log("Client is ready!");
    allSessionsObject[id] = client;
    socket.emit("ready", { id, message: "Client is ready!" });
  });

  client.on("remote_session_saved", () => {
    console.log("remote_session_saved");
    socket.emit("remote_session_saved", {
      message: "remote_session_saved",
    });
  });

  client.on('message_create', message => {
    if (message.body === 'ping') {
      client.sendMessage(message.from, 'pong');
    }
  });
  client.on('message', async (message) => {
    console.log(message);
    try {
      if (message.from != "status@broadcast") {
        const contact = await message.getContact();
        console.log(contact, message.body);
        const finalNumber = sanitize(phoneNumber);
        client.sendMessage(finalNumber, message);
      }
    } catch (error) {
      console.log(error);
    }
  });

  client.on('loading_screen', (percent, message) => {
    console.log('Loading screen', percent, message);
    socket.emit('loading_screen', { percent, message }); // Emit loading status
  });


  client.initialize();
};

const getWhatsappSession = (id, socket) => {
  client = new Client({
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: '/usr/bin/chromium-browser'
    },
    authStrategy: new RemoteAuth({
      clientId: id,
      store: store,
      backupSyncIntervalMs: 300000,
      dataPath: 'session'
    }),
  });

  client.on("ready", () => {
    console.log("client is ready");
    socket.emit("ready", {
      id,
      message: "client is ready",
    });
  });

  client.on("qr", (qr) => {
    socket.emit("qr", {
      qr,
      message: "your got logged out and here is QR code",
    });
  });

  client.on('message_create', message => {
    if (message.body === 'ping') {
      client.sendMessage(message.from, 'pong');
    }
  });
  client.on('message', async (message) => {
    console.log(message);
    try {
      if (message.from != "status@broadcast") {
        const contact = await message.getContact();
        console.log(contact, message.body);
        const finalNumber = sanitize(phoneNumber);
        client.sendMessage(finalNumber, message);
      }
    } catch (error) {
      console.log(error);
    }
  });

  client.on('loading_screen', (percent, message) => {
    console.log('Loading screen', percent, message);
    socket.emit('loading_screen', { percent, message }); // Emit loading status
  });


  client.initialize();
};

io.on("connection", (socket) => {
  console.log("a user connected", socket?.id);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("connected", (data) => {
    console.log("connected to the server", data);
    // emit hello
    socket.emit("hello", "Hello from server");
  });

  socket.on("createSession", (data) => {
    console.log(data);
    const { id } = data;
    createWhatsappSession(id, socket);
  });

  socket.on("getSession", (data) => {
    console.log(data);
    const { id } = data;
    getWhatsappSession(id, socket);
  });

  socket.on("getAllChats", async (data) => {
    console.log("getAllChats", data);
    const { id } = data;
    const client = allSessionsObject[id];
    const allChats = await client.getChats();
    socket.emit("allChats", {
      allChats,
    });
  });
  socket.on('chat_message', async (data) => {
    const { phoneNumber, message, id } = data;
    const finalNumber = sanitize(phoneNumber);
    
    if (client) {
      try {
        client.sendMessage(finalNumber, message);
        console.log('Sent message to: ' + finalNumber);
      } catch (err) {
        console.error('Error sending message:', err);
      }
    } else {
      console.log('Client is not connected');
    }
  });
});
const sanitize = (phoneNumber) => {
  const sanitizedPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
  return '91' + sanitizedPhoneNumber.slice(-10) + '@c.us';
};