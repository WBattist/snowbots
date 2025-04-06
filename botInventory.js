const colors = require('./colors');
const { SimpleSpinner } = require('./utils');

/**
 * Bot inventory management functions
 */
class BotInventory {
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Drop item from a hotbar slot
   * @param {string|number} slotArg - Slot number (1-9) or 'all'
   */
  dropHotbarSlot(slotArg) {
    if (!this.bot) return;

    if (slotArg.toLowerCase() === 'all') {
      // Drop all hotbar slots (0-8)
      const spinner = new SimpleSpinner(`${this.bot.username} is dropping all hotbar items...`).start();

      let droppedCount = 0;
      const totalSlots = 9;

      // Function to drop items sequentially
      const dropNextSlot = (slotIndex) => {
        if (slotIndex >= totalSlots) {
          spinner.succeed(`${colors.green}[✅] ${this.bot.username} dropped all ${droppedCount} hotbar items${colors.reset}`);
          return;
        }

        const item = this.bot.inventory.slots[slotIndex + 36]; // Convert to actual inventory index

        if (item) {
          this.bot.tossStack(item)
            .then(() => {
              droppedCount++;
              setTimeout(() => dropNextSlot(slotIndex + 1), 250); // Small delay between drops
            })
            .catch(err => {
              console.log(`${colors.yellow}[⚠️] Error dropping item in slot ${slotIndex}: ${err}${colors.reset}`);
              setTimeout(() => dropNextSlot(slotIndex + 1), 250);
            });
        } else {
          // Skip empty slots
          setTimeout(() => dropNextSlot(slotIndex + 1), 50);
        }
      };

      // Start dropping from slot 0
      dropNextSlot(0);
    } else {
      // Drop specific slot
      const slotNum = parseInt(slotArg);

      // Validate slot number (1-9 for user, translates to 0-8 internally)
      if (isNaN(slotNum) || slotNum < 1 || slotNum > 9) {
        console.log(`${colors.red}[❌] Invalid slot number. Use 1-9 or 'all'.${colors.reset}`);
        return;
      }

      const internalSlot = slotNum - 1; // Convert to 0-based index
      const inventorySlot = internalSlot + 36; // Convert to actual inventory index

      const spinner = new SimpleSpinner(`${this.bot.username} is dropping item from slot ${slotNum}...`).start();

      const item = this.bot.inventory.slots[inventorySlot];

      if (!item) {
        spinner.fail(`${colors.yellow}[⚠️] ${this.bot.username} has no item in slot ${slotNum}${colors.reset}`);
        return;
      }

      this.bot.tossStack(item)
        .then(() => {
          spinner.succeed(`${colors.green}[✅] ${this.bot.username} dropped item from slot ${slotNum}: ${item.name} x${item.count}${colors.reset}`);
        })
        .catch(err => {
          spinner.fail(`${colors.red}[❌] ${this.bot.username} failed to drop item: ${err}${colors.reset}`);
        });
    }
  }

  /**
   * Sell all snowballs
   */
  sellSnowballs() {
    if (!this.bot) return;

    const spinner = new SimpleSpinner(`${this.bot.username} is selling snowballs...`).start();
    this.bot.chat('/sellall SNOWBALL');

    setTimeout(() => {
      spinner.succeed(`${colors.green}[💰] ${this.bot.username} sold all snowballs${colors.reset}`);
    }, 1000);
  }

  /**
   * Open shop and navigate menu to buy a shovel
   */
  openShop() {
    if (!this.bot) return;

    const spinner = new SimpleSpinner(`${this.bot.username} is opening shop...`).start();
    const wasBreakingSnow = this.bot.isBreakingSnow; // Store current state
    this.bot.isBreakingSnow = false; // Pause snow breaking during shopping

    this.bot.chat('/shop CustomItems');

    this.bot.once('windowOpen', (window) => {
      spinner.text(`${this.bot.username} navigating shop menu...`);

      setTimeout(() => {
        try {
          this.bot.clickWindow(6, 0, 0); // Left click the 7th slot

          this.bot.once('windowOpen', (subWindow) => {
            setTimeout(() => {
              try {
                this.bot.clickWindow(13, 0, 0); // Left click the 14th slot
                this.bot.closeWindow(subWindow);
                spinner.succeed(`${colors.green}[🛒] ${this.bot.username} successfully bought a new shovel${colors.reset}`);

                // Give a short delay before restarting snow breaking
                setTimeout(() => {
                  // Restart snow breaking if it was active before
                  if (wasBreakingSnow) {
                    console.log(`${colors.blue}[⛄] ${this.bot.username} resuming snow breaking...${colors.reset}`);
                    this.bot.isBreakingSnow = true; // Set this back to true
                    const BotActions = require('./botactions');
                    const actions = new BotActions(this.bot);
                    this.bot.snowBreakingStopper = actions.breakSnowContinuously();
                  }
                }, 1000);
              } catch (err) {
                spinner.fail(`${colors.red}[❌] ${this.bot.username} failed to click item in submenu: ${err}${colors.reset}`);
                // Try to resume snow breaking even on error
                if (wasBreakingSnow) {
                  setTimeout(() => {
                    this.bot.isBreakingSnow = true; // Set this back to true
                    const BotActions = require('./botactions');
                    const actions = new BotActions(this.bot);
                    this.bot.snowBreakingStopper = actions.breakSnowContinuously();
                  }, 1000);
                }
              }
            }, 500);
          });
        } catch (err) {
          spinner.fail(`${colors.red}[❌] ${this.bot.username} failed to navigate shop: ${err}${colors.reset}`);
          // Try to resume snow breaking even on error
          if (wasBreakingSnow) {
            setTimeout(() => {
              this.bot.isBreakingSnow = true; // Set this back to true
              const BotActions = require('./botactions');
              const actions = new BotActions(this.bot);
              this.bot.snowBreakingStopper = actions.breakSnowContinuously();
            }, 1000);
          }
        }
      }, 500);
    });

    // Safety timeout in case the window never opens
    setTimeout(() => {
      if (spinner.isSpinning) {
        spinner.fail(`${colors.red}[❌] ${this.bot.username} shop operation timed out${colors.reset}`);
        // Try to resume snow breaking after timeout
        if (wasBreakingSnow) {
          setTimeout(() => {
            this.bot.isBreakingSnow = true; // Set this back to true
            const BotActions = require('./botactions');
            const actions = new BotActions(this.bot);
            this.bot.snowBreakingStopper = actions.breakSnowContinuously();
          }, 1000);
        }
      }
    }, 10000);
  }
}

module.exports = BotInventory;
