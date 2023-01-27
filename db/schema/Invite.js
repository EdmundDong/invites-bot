const mongoose = require('mongoose');

module.exports = {
  InviteBuilder: (guildId) => {
    return mongoose.model(
      'Invite',
      new mongoose.Schema({
        code: String,
        expired: Boolean,
        user: String,
        userId: Number,
        reason: String,
        uses: Number,
        maxUses: Number,
        maxAge: Number,
        sent: Boolean,
        notes: String,
      }, { timestamps: true }),
      // Set collection name
      `invites-${guildId}`
    );
  }
};