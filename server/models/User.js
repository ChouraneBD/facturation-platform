const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mot_de_passe: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], required: true },
  created_at: { type: Date, default: Date.now }
});

userSchema.virtual('id').get(function getId() {
  return this._id.toString();
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.mot_de_passe;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
