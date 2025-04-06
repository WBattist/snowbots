const colors = require('./colors');
const { SimpleSpinner } = require('./utils');

/**
 * Bot navigation functions
 */
class BotNavigator {
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Navigate to a player
   * @param {string} playerName - Name of the player to navigate to
   */
  gotoPlayer(playerName) {
    if (!this.bot) return;

    const spinner = new SimpleSpinner(`${this.bot.username} is looking for ${playerName}...`).start();

    const player = this.bot.players[playerName]?.entity;

    if (!player) {
      spinner.fail(`${colors.red}[❌] ${this.bot.username} couldn't find player ${playerName}${colors.reset}`);
      return;
    }

    spinner.text(`${this.bot.username} is moving to ${playerName}...`);

    this.bot.pathfinder.setGoal(player.position);

    const checkInterval = setInterval(() => {
      if (!this.bot.pathfinder.isMoving()) {
        clearInterval(checkInterval);
        spinner.succeed(`${colors.green}[✅] ${this.bot.username} has reached ${playerName}${colors.reset}`);
      }
    }, 1000);

    setTimeout(() => {
      if (this.bot.pathfinder.isMoving()) {
        clearInterval(checkInterval);
        spinner.warn(`${colors.yellow}[⚠️] ${this.bot.username} is still trying to reach ${playerName}${colors.reset}`);
      }
    }, 30000);
  }

  /**
   * Navigate to specific coordinates
   * @param {string|number} x - X coordinate
   * @param {string|number} y - Y coordinate
   * @param {string|number} z - Z coordinate
   */
  gotoCoordinates(x, y, z) {
    if (!this.bot) return;

    const coordinates = { x: parseFloat(x), y: parseFloat(y), z: parseFloat(z) };

    // Validate coordinates
    if (isNaN(coordinates.x) || isNaN(coordinates.y) || isNaN(coordinates.z)) {
      console.log(`${colors.red}[❌] ${this.bot.username} received invalid coordinates. Format: bot<N> goto x y z${colors.reset}`);
      return;
    }

    const spinner = new SimpleSpinner(`${this.bot.username} is moving to coordinates (${x}, ${y}, ${z})...`).start();

    // Create a position vector
    const position = this.bot.entity.position.clone();
    position.x = coordinates.x;
    position.y = coordinates.y;
    position.z = coordinates.z;

    // Set the pathfinding goal to the coordinates
    this.bot.pathfinder.setGoal(position);

    const checkInterval = setInterval(() => {
      if (!this.bot.pathfinder.isMoving()) {
        clearInterval(checkInterval);
        spinner.succeed(`${colors.green}[✅] ${this.bot.username} has reached coordinates (${x}, ${y}, ${z})${colors.reset}`);
      }
    }, 1000);

    setTimeout(() => {
      if (this.bot.pathfinder.isMoving()) {
        clearInterval(checkInterval);
        spinner.warn(`${colors.yellow}[⚠️] ${this.bot.username} is still trying to reach coordinates (${x}, ${y}, ${z})${colors.reset}`);
      }
    }, 30000);
  }

  /**
   * Switch to the survival server
   */
  switchToSurvival() {
    if (!this.bot) return;

    console.log(`${colors.blue}[🌍] ${this.bot.username} switching to Survival server...${colors.reset}`);
    this.bot.chat('/server survival');
  }
}

module.exports = BotNavigator;
