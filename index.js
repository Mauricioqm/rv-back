'use strict'
const cors = require('cors');
const authRoutes = require('./auth/authRoutes');
const express = require('express');
const propierties = require('./config/properties');
const DB = require('./config/db');

const User = require('./auth/authModel');
const Message = require('./message/messageModel');

const rooms = ['general', 'friends', 'business'];

// Conectamos DB
DB();

// Creacion del servidor
const app = express();

const router = express.Router();

const bodyParser = require('body-parser');
const bodyParserJSON = bodyParser.json();
const bodyParserURLEncoded = bodyParser.urlencoded({ extended: true });

app.use(bodyParserJSON);
app.use(bodyParserURLEncoded);

app.use(cors());

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3300',
    methods: ['GET', 'POST'],
  }
})

app.get('/rooms', (req, res)=> {
  res.json(rooms)
})

async function getLastMessagesFromRoom(room){
  let roomMessages = await Message.aggregate([
      {$match: {to: room}},
      {$group: {_id: '$date', messagesByDate: {$push: '$$ROOT'}}}
  ])
  return roomMessages;
}

function sortRoomMessagesByDate(messages) {
  return messages.sort(function (a, b) {
    let date1 = a._id.split('/');
    let date2 = b._id.split('/');

    date1 = date1[2] + date1[0] + date1[1];
    date2 = date2[2] + date2[0] + date2[1];

    return date1 < date2 ? -1 : 1
  })
}

// Conexion con el socket
io.on('connection', (socket) => {
  // console.log('!!!');
  socket.on('new-user', async () => {
    const members = await User.find();
    io.emit('new-user', members);
  });

  socket.on('join-room', async (rooms, previousRoom) => {
    // socket.join(newRoom);
    socket.join(rooms);
    socket.leave(previousRoom);
    let roomMessages = await getLastMessagesFromRoom(rooms);
    roomMessages = sortRoomMessagesByDate(roomMessages);
    socket.emit('room-messages', roomMessages);
  })

  socket.on('message-room', async (room, content, sender, time, date) => {
    const newMessage = await Message.create({ content, from: sender, time, date, to: room });
    let roomMessages = await getLastMessagesFromRoom(room);
    roomMessages = sortRoomMessagesByDate(roomMessages);

    // Envio de mensajes a salas
    io.to(room).emit('room-messages', roomMessages);

    // Enviar notificacion cuando se envia mensaje
    socket.broadcast.emit('notifications', room)
  })

  app.delete('/api/logout', async (req, res) => {
    // console.log('!!! logout ');
    try {
      const { id, newMessages } = req.body;
      const user = await User.findById(id);
      // console.log(user);
      user.status = "offline";
      user.newMessages = newMessages;
      await user.save();
      const members = await User.find();
      socket.broadcast.emit('new-user', members);
      res.status(200).send();
    } catch (e) {
      console.log(e);
      res.status(400).send();
    }
  })
})


app.use('/api', router);
authRoutes(router);

//Ruta principal
router.get('/', (req, res) => {
  res.send('Hello from home');
});

app.use(router);



// app.listen(propierties.PORT, () => console.log('Servidor corriendo en puerto 3300'));
server.listen(propierties.PORT, () => console.log('Servidor corriendo en puerto 3300'));