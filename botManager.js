// botManager.js - Handles bot creation and management
const mineflayer = require('mineflayer');
const UI = require('./ui');
const { pathfinder } = require('mineflayer-pathfinder');

class BotManager {
  constructor(serverOptions, password) {
    this.serverOptions = serverOptions;
    this.password = password;
    this.bots = {};
    this.ui = new UI();
    this.showChatMessages = true;
  }

  setShowChatMessages(value) {
    this.showChatMessages = value;
  }

  createBot(botName) {
    if (this.bots[botName]) {
      this.ui.log('yellow', `[⚠️] ${botName} already exists.`);
      return;
    }

    const spinner = this.ui.createSpinner(`Creating ${botName}...`).start();

    const bot = mineflayer.createBot({ ...this.serverOptions, username: botName });

    // ✅ Load the pathfinder plugin here
    bot.loadPlugin(pathfinder);

    // Setup login event
    bot.on('login', () => {
      spinner.succeed(`${this.ui.colors.green}[✅] ${bot.username} joined.${this.ui.colors.reset}`);
    });

    // Setup message handling
    bot.on('message', (message) => {
      const msg = message.toString();

      // Only show important messages or all if enabled
      if (!this.showChatMessages && !msg.includes('/register') && !msg.includes('/login') && !msg.includes('You have been teleported')) {
        return;
      }

      if (msg.includes('/register') || msg.includes('/login') || msg.includes('You have been teleported')) {
        this.ui.log('cyan', `[💬] ${bot.username} received: ${msg}`);

        if (msg.includes('/register')) {
          bot.chat(`/register ${this.password} ${this.password}`);
          this.ui.log('green', `[🔐] ${bot.username} registered.`);
        } else if (msg.includes('/login')) {
          bot.chat(`/login ${this.password}`);
          this.ui.log('green', `[🔑] ${bot.username} logged in.`);
        }
      } else if (this.showChatMessages) {
        this.ui.log('cyan', `[💬] ${bot.username} chat: ${msg}`);
      }
    });

    // Setup error handling
    bot.on('error', (err) => this.ui.log('red', `[❌] ${bot.username} error: ${err}`));

    // Setup disconnect handling
    bot.on('end', () => {
      this.ui.log('yellow', `[⚠️] ${bot.username} disconnected.`);
      if (bot.isBreakingSnow) {
        bot.isBreakingSnow = false;
      }
      delete this.bots[botName];
    });

    this.bots[botName] = bot;
    return bot;
  }

  getBot(botName) {
    return this.bots[botName];
  }

  removeBot(botName) {
    if (this.bots[botName]) {
      const spinner = this.ui.createSpinner(`${botName} is leaving...`).start();
      if (this.bots[botName].isBreakingSnow) {
        this.bots[botName].isBreakingSnow = false;
      }
      this.bots[botName].end();
      delete this.bots[botName];
      spinner.succeed(`${this.ui.colors.yellow}[🚪] ${botName} has left the server.${this.ui.colors.reset}`);
    } else {
      this.ui.log('yellow', `[⚠️] ${botName} not found.`);
    }
  }

  getAllBotNames() {
    return Object.keys(this.bots);
  }

  disconnectAll() {
    Object.keys(this.bots).forEach(botName => {
      if (this.bots[botName]) {
        this.bots[botName].end();
      }
    });
  }
}

module.exports = BotManager;
