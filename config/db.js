const mongoose = require('mongoose');
const dbURL = require('./properties').DB;

module.exports = () => {
  mongoose.connect(dbURL, { useNewUrlParser: true })
    .then(() => console.log(`Mongo conectado on ${dbURL}`))
    .catch(err => console.log(`Error de conexion ${err}`))

  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      console.log(`Mongo esta desconectado`);
      process.exit(0) //No detiene la api
    });
  });
}