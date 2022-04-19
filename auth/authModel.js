const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs/dist/bcrypt');

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, "Can´t be blank"],
    unique: true,
    // lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, "Can´t be blank"],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Can´t be blank"],
    trim: true
  },
  picture: {
    type: String,
  },
  newMessages: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    default: 'online'
  }
},
  { minimize: false },
);

userSchema.pre('save', function (next)  {
  const user = this;
  if (!user.isModified('password')) return next();

  bcrypt.genSalt(10, (err, salt) => {
    if(err) return next(err);

    bcrypt.hash(user.password, salt, (err, hash) => {
      if(err) return next(err);

      user.password = hash;
      next();
    })
  })
})

userSchema.method.toJSON = function (){
  const user = this;
  const userObject = user.userObject();
  delete userObject.password;
  return userObject;
}
userSchema.statics.findByCredentials = async function(username, password) {
  const user = await User.findOne({username});
  if(!user) throw new Error('.....');
  const isMath = await bcrypt.compare(password, user.password);
  if(!isMath) throw new Error('...000...')
}
const User = mongoose.model('User', userSchema);
module.exports = User;