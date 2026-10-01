const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  first_name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  last_name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  phone: { type: String, trim: true },
  role: {
    type: String,
    enum: ['admin', 'reception', 'housekeeping', 'manager'],
    default: 'reception',
    required: true,
  },
  is_active: { type: Boolean, default: true },
  avatar_url: { type: String, trim: true },
  last_login: { type: Date },
  login_count: { type: Number, default: 0 },
  // Incrémenté à la déconnexion / changement de mot de passe : invalide tous les jetons émis avant.
  token_version: { type: Number, default: 0 },
}, { timestamps: true, collection: 'users' });

userSchema.index({ role: 1 });
userSchema.index({ is_active: 1 });

userSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.password_hash; return ret; },
});

module.exports = mongoose.model('User', userSchema);
