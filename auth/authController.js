// const User = require('./authDao');
const User = require('./authModel')
const jwt = require('jsonwebtoken'); //Para encriptar contraseña de usuario
const bcrypt = require('bcryptjs');
const SECRET_KEY = 'secretkey123456';

exports.createUser = (req, res, next) => {
  const newUser = {
    username: req.body.username,
    email: req.body.email,
    picture: req.body.picture,
    password: bcrypt.hashSync(req.body.password),

  }
  console.log(newUser);

  User.create(newUser, (err, user) => {
    if (err && err.code === 11000) return res.status(409).send('El username ya esta en uso'); //Controla el uso de username
    if (err) return res.status(500).send('Server error');
    const expiresIn = 24 * 60 * 60;
    const accessToken = jwt.sign({ id: user.id },
      SECRET_KEY, {
      expiresIn: expiresIn
    });

    
    // respuesta
    res.send({
      username: req.body.username,
      email: req.body.email,
      picture: req.body.picture,
      accessToken: accessToken,
      expiresIn: expiresIn
    });
  });
}

exports.loginUser = (req, res, next) => {
  const userData = {
    username: req.body.username,
    password: req.body.password
  }
  //Usamos findOne de mongoose para buscar en la db si usuario existe
  User.findOne({ username: userData.username }, (err, user) => {
    //Control de errores
    if (err) return res.status(500).send('Server error!');

    if (!user) {
      // documento no existe
      res.status(409).send({ message: 'Algo esta mal, por favor verifica tus datos' });
    } else {
      // bcrypt.compareSync desencripta el password
      const resultPassword = bcrypt.compareSync(userData.password, user.password);
      if (resultPassword) {
        const expiresIn = 24 * 60 * 60;
        const accessToken = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: expiresIn });

        res.send({
          username: req.body.username,
          email: req.body.email,
          id: user.id,
          picture: user.picture,
          status: "online",
          newMessages: req.body.newMessages,
          accessToken: accessToken,
          expiresIn: expiresIn
        });
      } else {
        // Password equivocado
        res.status(409).send({ message: 'Algo no ha salido mal' });
      }
    }
  });
}

exports.getUsers = async (req, res) => {
  User.find({}, (err, emp) => {
    res.send({ emp })
  })
}

exports.getUSerById = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ msg: 'No existe el empleado' })
    }

    res.json(user);

  } catch (error) {
    console.log(error);
    res.status(500).send('Hubo un error....');
  }
}

exports.updateUser = async (req, res) => {
  try {
    const { username, email, img, password } = req.body;
    let user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ msg: 'No existe el usuario' })
    }

    user.username = username;
    user.img = img;
    user.email = email;
    user.password = password;

    user = await User.findOneAndUpdate({ _id: req.params.id }, user, { new: true })
    res.json(user);

  } catch (error) {
    console.log(error);
    res.status(500).send('Hubo un error??');
  }
}

exports.logout = async (req, res) => {
  console.log('!!!');
  try {
    const { _id, newMessages } = req.body;
    const user = await User.findById(_id);
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
}

