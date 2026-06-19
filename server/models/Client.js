const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, default: null },
  tel: { type: String, default: null },
  adresse: { type: String, default: null },
  ville: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

clientSchema.virtual('id').get(function getId() {
  return this._id.toString();
});

clientSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Client', clientSchema);
