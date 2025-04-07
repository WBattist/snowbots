const BotTasks = require('./botTasks');
const UI = require('./ui');

class CommandProcessor {
  constructor(botManager, ui) {
    this.botManager = botManager;
    this.ui = ui || new UI();
    this.botTasks = new BotTasks();
  }

  // Helper function to handle bot not found
  handleBotNotFound(botName) {
    this.ui.log('yellow', `[⚠️] ${botName} not found.`);
    return true;
  }

  // Helper function to handle missing arguments
  handleMissingArgs(message) {
    this.ui.log('yellow', `[⚠️] ${message}`);
    return true;
  }

  // Process the user command
  processCommand(botIdentifier, command, args, rl) {
    const botName = botIdentifier.toLowerCase() === 'all' ? 'all' : `Bot${botIdentifier}`;
    
    // If targeting all bots, process each bot
    if (botName === 'all') {
      const botNames = this.botManager.getAllBotNames();
      if (botNames.length === 0) {
        this.ui.log('yellow', `[⚠️] No bots connected.`);
        return true;
      }
      this.ui.log('magenta', `[🤖] Executing ${command} for all bots...`);
      botNames.forEach(name => {
        this.processCommand(name.replace('Bot', ''), command, args, rl);
      });
      return true;
    }

    // Retrieve the bot object
    const bot = this.botManager.getBot(botName);
    
    // If bot does not exist
    if (!bot) return this.handleBotNotFound(botName);

    // Process the commands
    switch (command) {
      case 'join':
        this.botManager.createBot(botName);
        break;
      case 'survival':
        this.ui.log('blue', `[🌍] ${botName} switching to Survival server...`);
        bot.chat('/server survival');
        break;
      case 'leave':
        this.botManager.removeBot(botName);
        break;
      case 'break-snow':
        if (!bot.snowBreakingStopper) {
          bot.snowBreakingStopper = this.botTasks.breakSnowContinuously(bot, botName);
        } else {
          this.ui.log('yellow', `[⚠️] ${botName} is already breaking snow.`);
        }
        break;
      case 'stop-snow':
        if (bot.snowBreakingStopper) {
          bot.snowBreakingStopper();
          bot.snowBreakingStopper = null;
        } else {
          this.ui.log('yellow', `[⚠️] ${botName} wasn't breaking snow.`);
        }
        break;
      case 'break-quartz':
        if (!bot.quartzBreakingStopper) {
          bot.quartzBreakingStopper = this.botTasks.breakQuartzContinuously(bot, botName);
        } else {
          this.ui.log('yellow', `[⚠️] ${botName} is already breaking quartz.`);
        }
        break;
      case 'stop-quartz':
        if (bot.quartzBreakingStopper) {
          bot.quartzBreakingStopper();
          bot.quartzBreakingStopper = null;
        } else {
          this.ui.log('yellow', `[⚠️] ${botName} wasn't breaking quartz.`);
        }
        break;
      case 'goto':
        if (args.length >= 3 && !isNaN(parseFloat(args[0]))) {
          // Going to coordinates
          this.botTasks.gotoCoordinates(bot, botName, args[0], args[1], args[2]);
        } else if (args.length >= 1) {
          // Going to a player
          this.botTasks.gotoPlayer(bot, botName, args[0]);
        } else {
          return this.handleMissingArgs('Please specify a player name or coordinates (x y z).');
        }
        break;
      case 'dropslot':
        if (args.length < 1) return this.handleMissingArgs('Please specify a slot number (1-9) or \'all\'.');
        this.botTasks.dropHotbarSlot(bot, botName, args[0]);
        break;
      case 'sellballs':
        this.botTasks.sellSnowballs(bot, botName);
        break;
      case 'shop':
        this.botTasks.openShop(bot, botName);
        break;
      case 'command-control':
        this.botTasks.enterCommandControlMode(bot, botName, rl);
        return false;
      default:
        this.ui.log('yellow', `[⚠️] Unknown command: ${command}`);
    }
    
    return true;
  }
}

module.exports = CommandProcessor;
