const { SlashCommandBuilder, EmbedBuilder, SlashCommandStringOption } = require('discord.js');
const mongoose = require('mongoose');
const { mongoUri } = process.env;
const { InviteBuilder } = require('./../db/schema/Invite.js')

mongoose.set('strictQuery', false);

module.exports = {
  // Setup slash command properties
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Create invites to the server')
    .addStringOption(option =>
      option.setName('limit')
        .setDescription('Set the invite limit')
        .addChoices(
          { name: '1 use', value: '1 use' },
          { name: '10 use', value: '10 use' },
          { name: '1 hour', value: '1 hour' },
          { name: '2 hour', value: '2 hour' },
        )
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('What is this invite being used for')
        .setRequired(true)
    ),

  // Slash command execution code
  async execute(interaction) {
    // Get slash command parameters
    const limit = interaction.options.getString('limit');
    const reason = interaction.options.getString('reason');
    const user = interaction.member.displayName;
    const userId = interaction.member;

    // Parse selected invite limit
    const limitValue = limit.split(' ')[0];
    const limitType = limit.split(' ')[1];
    const maxUses = limitType === 'use' ? limitValue : 100
    const maxAge = limitType === 'hour' ? limitValue * 3600 : 86400

    // Create invite
    const invite = await interaction.guild.invites.create(
      interaction.guild.rulesChannelId, {
      maxUses: maxUses,
      maxAge: maxAge,
      unique: true
    })
    console.log(`Created ${limitValue} ${limitType} invite for ${user}${userId} (${invite.code})`)

    // Setup mongo model and schema
    const Invite = InviteBuilder(interaction.guildId)

    // Setup error embed message
    let embed = new EmbedBuilder()
      .setTitle('Error creating invite')
      .setDescription('Unable to reach database, please contact bot developer.');

    try {
      // Connect to database and create collection if not existing
      await mongoose.connect(mongoUri, { dbName: 'invites-bot-replit' });
      await Invite.createCollection();

      // Insert document
      const doc = await Invite.create({
        code: invite.code,
        expired: false,
        user: user,
        userId: userId,
        reason: reason,
        uses: 0,
        maxUses: maxUses,
        maxAge: maxAge,
        sent: false,
      });

      // Create new embed with generated invite
      embed = new EmbedBuilder()
        .setTitle('Here is your requested invite!')
        .setDescription(`**User:** ${userId}\n**Reason:** ${reason}\n\nThis invite will expire after **${limit}**.\n${invite}`);

      // Confirm invitation sent in database
      await Invite.findOneAndUpdate({ _id: doc._id }, { sent: true });

    } catch (err) {
      console.log(err);

    } finally {
      // Send reply with embed message
      interaction.reply({ embeds: [embed], ephemeral: true })
        .then(() => console.log('Reply sent.'))
        .catch(console.error);
    }
  },
};