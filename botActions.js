const colors = require('./colors');
const { SimpleSpinner } = require('./utils');
const { GoalBlock } = require('mineflayer-pathfinder').goals;

/**
 * Bot action functions
 */
class BotActions {
  constructor(bot) {
    this.bot = bot;
    this.snowBroken = 0;
  }

  /**
   * Break snow blocks continuously
   * @returns {Function} Function to stop breaking snow
   */
  breakSnowContinuously() {
    if (!this.bot) return;

    console.log(`${colors.blue}[⛄] ${this.bot.username} is now breaking snow.${colors.reset}`);

    this.bot.isBreakingSnow = true;
    let currentTarget = null;
    this.snowBroken = 0;

    const findAndDigSnow = () => {
      if (!this.bot.isBreakingSnow) return;

      if (!currentTarget) {
        const snowBlocks = this.bot.findBlocks({
          matching: block => block.name === 'snow_layer',
          maxDistance: 6,
          count: 1
        });

        if (snowBlocks.length > 0) {
          const snowPos = snowBlocks[0];
          currentTarget = this.bot.blockAt(snowPos);

          if (currentTarget) {
            this.bot.lookAt(snowPos.offset(0.5, 0.5, 0.5), true)
              .then(() => {
                if (this.bot.isBreakingSnow && currentTarget) {
                  return this.bot.dig(currentTarget);
                }
              })
              .then(() => {
                this.snowBroken++;
                currentTarget = null;

                if (this.bot.isBreakingSnow) {
                  findAndDigSnow();
                }
              })
              .catch(err => {
                if (!err.message.includes("block") && !err.message.includes("already")) {
                  console.log(`\n${colors.red}[❌] ${this.bot.username} digging error: ${err}${colors.reset}`);
                }
                currentTarget = null;

                if (this.bot.isBreakingSnow) {
                  findAndDigSnow();
                }
              });
          } else {
            findAndDigSnow();
          }
      } else {
        setTimeout(findAndDigSnow, 50);
      }
    };

    findAndDigSnow();

    return () => {
      console.log(`\n${colors.yellow}[🛑] ${this.bot.username} stopped breaking snow. Total broken: ${this.snowBroken}${colors.reset}`);
      this.bot.isBreakingSnow = false;
      currentTarget = null;
    };
  }

  /**
   * Stop breaking snow
   */
  stopBreakingSnow() {
    if (!this.bot) return;

    if (this.bot.snowBreakingStopper) {
      this.bot.snowBreakingStopper();
      this.bot.snowBreakingStopper = null;
    } else {
      console.log(`${colors.yellow}[⚠️] ${this.bot.username} wasn't breaking snow.${colors.reset}`);
    }
  }

  /**
   * Enter command control mode
   * @param {readline.Interface} rl - Readline interface
   */
  enterCommandControlMode(rl) {
    if (!this.bot) {
      console.log(`${colors.yellow}[⚠️] ${this.bot.username} not found.${colors.reset}`);
      return;
    }

    console.log(`${colors.magenta}[🎮] Entered command control mode for ${this.bot.username}. Type commands for the bot to execute.${colors.reset}`);
    console.log(`${colors.cyan}[ℹ️] Type "bot${this.bot.username.match(/\d+/)?.[0]} exit-command-control" to exit this mode.${colors.reset}`);

    const originalPrompt = rl.getPrompt();

    rl.setPrompt(`${colors.green}${this.bot.username}> ${colors.reset}`);
    rl.prompt();

    const originalLineListener = rl.listeners('line')[0];
    rl.removeListener('line', originalLineListener);

    const commandControlListener = (input) => {
      const exitCommand = `bot${this.bot.username.match(/\d+/)?.[0]} exit-command-control`;

      if (input.trim() === exitCommand) {
        console.log(`${colors.magenta}[🎮] Exiting command control mode for ${this.bot.username}.${colors.reset}`);
        rl.removeListener('line', commandControlListener);
        rl.on('line', originalLineListener);
        rl.setPrompt(originalPrompt);
        rl.prompt();
        return;
      }

      this.bot.chat(input);
      console.log(`${colors.cyan}[💬] ${this.bot.username} executed: ${input}${colors.reset}`);
      rl.prompt();
    };

    rl.on('line', commandControlListener);
  }
}

module.exports = BotActions;
