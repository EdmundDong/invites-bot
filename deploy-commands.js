const { REST, Routes } = require('discord.js');
const { clientId, token } = process.env;
const fs = require('node:fs');

const commands = [];

// Grab all the command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Prep slash commands for deployment
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

// Prep the REST module
const rest = new REST({ version: '10' }).setToken(token);

// Deploy commands
console.log('Deploying slash commands');
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();