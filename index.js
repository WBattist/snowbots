const readline = require('readline');
const BotManager = require('./botManager');
const UI = require('./ui');
const CommandProcessor = require('./commandProcessor');

// Server configuration
const serverOptions = {
  host: 'server.speedslicer.dev',
  port: 25565,
  version: '1.12.2',
};

const PASSWORD = '12345678';

// Global settings
let showChatMessages = true;

// Initialize components
const botManager = new BotManager(serverOptions, PASSWORD);
const ui = new UI();
const commandProcessor = new CommandProcessor(botManager, ui);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Display welcome banner
ui.showBanner();

// Setup prompt
rl.setPrompt(`${ui.colors.green}➤ ${ui.colors.reset}`);
rl.prompt();

// Process input commands
rl.on('line', async (input) => {
  const args = input.trim().split(' ');
  const mainCommand = args[0].toLowerCase();

  // Handle bot creation command
  if (mainCommand === 'bot' && args[1] === 'create' && args[2]) {
    const count = parseInt(args[2]);
    if (!isNaN(count) && count > 0) {
      ui.log('magenta', `[🤖] Creating ${count} bots...`);
      for (let i = 1; i <= count; i++) {
        await botManager.createBot(`Bot${i}`);
      }
    } else {
      ui.log('yellow', `[⚠️] Invalid number.`);
    }
    rl.prompt();
    return;
  }

  // Handle toggle chat command
  if (mainCommand === 'toggle' && args[1]?.toLowerCase() === 'chat') {
    showChatMessages = !showChatMessages;
    botManager.setShowChatMessages(showChatMessages);
    ui.log(showChatMessages ? 'green' : 'yellow', `[✅] Chat messages are now ${showChatMessages ? 'visible' : 'hidden'}`);
    rl.prompt();
    return;
  }

  // Handle bot-specific commands
  if (mainCommand.startsWith('bot')) {
    const botIdentifier = mainCommand.replace('bot', '');
    const command = args[1]?.toLowerCase();

    if (!command) {
      ui.log('yellow', `[⚠️] Please specify a command.`);
      rl.prompt();
      return;
    }

    const shouldPrompt = commandProcessor.processCommand(botIdentifier, command, args.slice(2), rl);
    if (shouldPrompt) {
      rl.prompt();
    }
    return;
  }

  // Handle help command
  if (mainCommand === 'help' || mainCommand === 'commands') {
    ui.showCommands();
    rl.prompt();
    return;
  }

  // Handle clear command
  if (mainCommand === 'clear' || mainCommand === 'cls') {
    console.clear();
    ui.showBanner();
    rl.prompt();
    return;
  }

  ui.log('yellow', `[⚠️] Unknown command. Type 'help' for available commands.`);
  rl.prompt();
});

// Handle program exit
rl.on('close', () => {
  ui.log('blue', `\n[👋] Shutting down all bots...`);
  botManager.disconnectAll();
  process.exit(0);
});
