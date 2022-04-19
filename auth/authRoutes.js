const Users = require('./authController');
module.exports = (router) => {
  router.post('/register', Users.createUser);
  router.post('/login', Users.loginUser);
  router.delete('/logout,', Users.logout);
}