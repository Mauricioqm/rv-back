'use strict'
const cors = require('cors');
const authRoutes = require('./auth/authRoutes');
const express = require('express');
const propierties = require('./config/properties');
const DB = require('./config/db');

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

app.use('/api', router);
authRoutes(router);

//Ruta principal
router.get('/', (req, res) => {
  res.send('Hello from home');
});

app.use(router);

app.listen(propierties.PORT, () => console.log('Servidor corriendo en puerto 3300'));