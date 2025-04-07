// botTasks.js - Updated
const UI = require('./ui');
const { goals: { GoalBlock, GoalNear } } = require('mineflayer-pathfinder');

class BotTasks {
  constructor() {
    this.ui = new UI();
  }

  enterCommandControlMode(bot, botName, rl) {
    const ask = () => {
      rl.question(`[📝] ${botName} > `, (input) => {
        if (input.toLowerCase() === 'exit') {
          console.log(`[❌] Exiting command control for ${botName}`);
          rl.prompt();
          return;
        }
        bot.chat(input);
        ask();
      });
    };

    console.log(`[✅] Entering command control for ${botName}... Type 'exit' to quit.`);
    ask();
  }

  breakSnowContinuously(bot, botName, reach = 10) {
    if (!bot) return;
  
    this.ui.log('blue', `[⛄] ${botName} is now breaking snow (reach: ${reach} blocks).`);
    bot.isBreakingSnow = true;
  
    let currentTarget = null;
    let snowBroken = 0;
    let lastEquipTime = 0;
    const self = this;
    let isDigging = false;
    let lastCountUpdate = 0;
    
    // Use the Vec3 from the bot's position to ensure we're using the correct vector implementation
    const Vec3 = bot.entity.position.constructor;
  
    // Function to update the snow count on a single line
    function updateSnowCounter() {
      // Only update every 500ms to avoid console spam
      const now = Date.now();
      if (now - lastCountUpdate > 500) {
        process.stdout.write(`\r[⛄] ${botName} snow broken: ${snowBroken}        `);
        lastCountUpdate = now;
      }
    }
  
async function findAndDigSnow() {
  if (!bot.isBreakingSnow) return;

  // Check if first slot has snowballs and sell them if so
  const firstSlot = bot.inventory.slots[36]; // slot 36 is the first hotbar slot
  if (firstSlot && firstSlot.name.includes('snowball')) {
    self.ui.log('blue', `\n[💰] ${botName} detected snowballs, selling...`);
    bot.chat('/sellall SNOWBALL');
    
    // Wait 1 second before continuing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Recursive call to check again after selling
    return findAndDigSnow();
  }

  // Only check equipment if we're not currently digging and haven't checked recently
  const currentTime = Date.now();
  if (!isDigging && !currentTarget && currentTime - lastEquipTime > 5000) {
    lastEquipTime = currentTime;
    const held = bot.heldItem;

    if (!held || !held.name.includes('shovel')) {
      self.ui.log('yellow', `\n[⚠️] ${botName} has no shovel, attempting to re-equip or buy one...`);
      
      const shovel = bot.inventory.items().find(item => item.name.includes('shovel'));

      if (shovel) {
        try {
          await bot.equip(shovel, 'hand');
          self.ui.log('green', `[✅] ${botName} equipped a shovel`);
        } catch (err) {
          self.ui.log('red', `[❌] Failed to equip shovel: ${err}`);
        }
      } else {
        // Temporarily pause snow breaking to buy a shovel
        const wasBreaking = bot.isBreakingSnow;
        bot.isBreakingSnow = false;
        
        try {
          await self.openShop(bot, botName);
          
          // Wait a moment after shop interaction
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try to equip the newly purchased shovel
          const newShovel = bot.inventory.items().find(item => item.name.includes('shovel'));
          if (newShovel) {
            await bot.equip(newShovel, 'hand');
          }
        } catch (err) {
          self.ui.log('red', `[❌] Shop error: ${err}`);
        }
        
        // Restore previous breaking state
        bot.isBreakingSnow = wasBreaking;
      }
    }
  }

  if (!currentTarget && !isDigging) {
    // Find snow blocks using the reach parameter
    const snowBlocks = bot.findBlocks({
      matching: block => {
        return block.name === 'snow' || block.name === 'snow_layer';
      },
      maxDistance: reach,
      count: 5
    });

    if (snowBlocks.length > 0) {
      // Sort blocks by distance to prioritize closest ones
      snowBlocks.sort((a, b) => {
        const distA = bot.entity.position.distanceTo(new Vec3(a.x + 0.5, a.y + 0.5, a.z + 0.5));
        const distB = bot.entity.position.distanceTo(new Vec3(b.x + 0.5, b.y + 0.5, b.z + 0.5));
        return distA - distB;
      });

      for (const snowPos of snowBlocks) {
        const block = bot.blockAt(snowPos);
        
        // Double-check it's actually snow
        if (block && (block.name === 'snow' || block.name === 'snow_layer')) {
          currentTarget = block;
          
          try {
            isDigging = true;
            // Look at the center of the block
            await bot.lookAt(snowPos.offset(0.5, 0.5, 0.5), true);
            
            // Dig the snow block
            await bot.dig(currentTarget);
            
            snowBroken++;
            // Update the counter instead of logging a new line
            updateSnowCounter();
          } catch (err) {
            // Only log unexpected errors
            if (!err.message.includes("already") && !err.message.includes("cannot") && !err.message.includes("No block")) {
              self.ui.log('red', `\n[❌] Digging error: ${err.message}`);
            }
          } finally {
            isDigging = false;
            currentTarget = null;
            
            if (bot.isBreakingSnow) {
              // Short pause between digs - changed from 250ms to 50ms
              setTimeout(findAndDigSnow, 50);
            }
            return;
          }
        }
      }
    }
    
    // If no snow blocks found nearby, try to find some further away
    const distantBlocks = bot.findBlocks({
      matching: block => block.name === 'snow' || block.name === 'snow_layer',
      maxDistance: reach * 2, // Use twice the reach for distant blocks
      count: 5
    });

    if (distantBlocks.length > 0) {
      // Move to the nearest snow block
      const target = distantBlocks[0];
      self.ui.log('blue', `\n[🚶] ${botName} moving to snow at (${target.x}, ${target.y}, ${target.z})`);
      
      try {
        // Move near but not exactly on the block to avoid standing on it
        bot.pathfinder.setGoal(new GoalNear(target.x, target.y, target.z, 2));
      } catch (err) {
        self.ui.log('yellow', `\n[⚠️] Pathfinding error: ${err.message}`);
      }
    }

    // Check again after a delay
    setTimeout(findAndDigSnow, 1000);
  } else if (!isDigging) {
    // If we have a target but aren't digging, something went wrong - reset and try again
    currentTarget = null;
    setTimeout(findAndDigSnow, 250);
  }
}

// Start the snow breaking process
findAndDigSnow();

// Return a function to stop the snow breaking
return () => {
  // Print a newline to avoid overwriting the counter
  process.stdout.write('\n');
  self.ui.log('yellow', `[🛑] ${botName} stopped breaking snow. Total broken: ${snowBroken}`);
  bot.isBreakingSnow = false;
  currentTarget = null;
};
  }

  // Modified functions for quartz mining

breakQuartzContinuously(bot, botName, reach = 10) {
  if (!bot) return;

  this.ui.log('blue', `[💎] ${botName} is now breaking quartz (reach: ${reach} blocks).`);
  bot.isBreakingQuartz = true;

  let currentTarget = null;
  let quartzBroken = 0;
  let isDigging = false;
  let lastCountUpdate = 0;
  
  // Use the Vec3 from the bot's position to ensure we're using the correct vector implementation
  const Vec3 = bot.entity.position.constructor;
  const self = this;

  // Function to update the quartz count on a single line
  function updateQuartzCounter() {
    // Only update every 500ms to avoid console spam
    const now = Date.now();
    if (now - lastCountUpdate > 500) {
      process.stdout.write(`\r[💎] ${botName} quartz broken: ${quartzBroken}        `);
      lastCountUpdate = now;
    }
  }

  async function findAndDigQuartz() {
    if (!bot.isBreakingQuartz) return;

    if (!currentTarget && !isDigging) {
      // Find quartz blocks using the reach parameter
      const quartzBlocks = bot.findBlocks({
        matching: block => {
          return block.name.includes('quartz') || block.name === 'nether_quartz_ore';
        },
        maxDistance: reach,
        count: 5
      });

      if (quartzBlocks.length > 0) {
        // Sort blocks by distance to prioritize closest ones
        quartzBlocks.sort((a, b) => {
          const distA = bot.entity.position.distanceTo(new Vec3(a.x + 0.5, a.y + 0.5, a.z + 0.5));
          const distB = bot.entity.position.distanceTo(new Vec3(b.x + 0.5, b.y + 0.5, b.z + 0.5));
          return distA - distB;
        });

        for (const quartzPos of quartzBlocks) {
          const block = bot.blockAt(quartzPos);
          
          // Double-check it's actually quartz
          if (block && (block.name.includes('quartz') || block.name === 'nether_quartz_ore')) {
            currentTarget = block;
            
            try {
              isDigging = true;
              // Look at the center of the block
              await bot.lookAt(quartzPos.offset(0.5, 0.5, 0.5), true);
              
              // Dig the quartz block
              await bot.dig(currentTarget);
              
              quartzBroken++;
              // Update the counter instead of logging a new line
              updateQuartzCounter();
            } catch (err) {
              // Only log unexpected errors
              if (!err.message.includes("already") && !err.message.includes("cannot") && !err.message.includes("No block")) {
                self.ui.log('red', `\n[❌] Digging error: ${err.message}`);
              }
            } finally {
              isDigging = false;
              currentTarget = null;
              
              if (bot.isBreakingQuartz) {
                // Short pause between digs
                setTimeout(findAndDigQuartz, 50);
              }
              return;
            }
          }
        }
      }
      
      // If no quartz blocks found nearby, try to find some further away
      const distantBlocks = bot.findBlocks({
        matching: block => block.name.includes('quartz') || block.name === 'nether_quartz_ore',
        maxDistance: reach * 2, // Use twice the reach for distant blocks
        count: 5
      });

      if (distantBlocks.length > 0) {
        // Move to the nearest quartz block
        const target = distantBlocks[0];
        self.ui.log('blue', `\n[🚶] ${botName} moving to quartz at (${target.x}, ${target.y}, ${target.z})`);
        
        try {
          // Move near but not exactly on the block to avoid standing on it
          bot.pathfinder.setGoal(new GoalNear(target.x, target.y, target.z, 2));
        } catch (err) {
          self.ui.log('yellow', `\n[⚠️] Pathfinding error: ${err.message}`);
        }
      }

      // Check again after a delay
      setTimeout(findAndDigQuartz, 1000);
    } else if (!isDigging) {
      // If we have a target but aren't digging, something went wrong - reset and try again
      currentTarget = null;
      setTimeout(findAndDigQuartz, 250);
    }
  }

  // Start the quartz breaking process
  findAndDigQuartz();

  // Return a function to stop the quartz breaking
  return () => {
    // Print a newline to avoid overwriting the counter
    process.stdout.write('\n');
    self.ui.log('yellow', `[🛑] ${botName} stopped breaking quartz. Total broken: ${quartzBroken}`);
    bot.isBreakingQuartz = false;
    currentTarget = null;
  };
}
  
  gotoCoordinates(bot, botName, x, y, z) {
    if (!bot) return;
    const coords = { x: parseFloat(x), y: parseFloat(y), z: parseFloat(z) };

    if (isNaN(coords.x) || isNaN(coords.y) || isNaN(coords.z)) {
      this.ui.log('red', `[❌] ${botName} received invalid coordinates. Format: bot<N> goto x y z`);
      return;
    }

    const spinner = this.ui.createSpinner(`${botName} is moving to coordinates (${x}, ${y}, ${z})...`).start();
    bot.pathfinder.setGoal(new GoalBlock(coords.x, coords.y, coords.z));

    const checkInterval = setInterval(() => {
      if (!bot.pathfinder.isMoving()) {
        clearInterval(checkInterval);
        spinner.succeed(`${this.ui.colors.green}[✅] ${botName} reached (${x}, ${y}, ${z})${this.ui.colors.reset}`);
      }
    }, 1000);

    setTimeout(() => {
      if (bot.pathfinder.isMoving()) {
        clearInterval(checkInterval);
        spinner.warn(`${this.ui.colors.yellow}[⚠️] ${botName} is still trying to reach coordinates (${x}, ${y}, ${z})${this.ui.colors.reset}`);
      }
    }, 30000);
  }

  dropHotbarSlot(bot, botName, slotArg) {
    if (!bot) return;
    if (slotArg.toLowerCase() === 'all') {
      const spinner = this.ui.createSpinner(`${botName} is dropping all hotbar items...`).start();
      let dropped = 0;

      const dropNext = (i) => {
        if (i >= 9) {
          spinner.succeed(`${this.ui.colors.green}[✅] ${botName} dropped ${dropped} items${this.ui.colors.reset}`);
          return;
        }

        const item = bot.inventory.slots[i + 36];
        if (item) {
          bot.tossStack(item)
            .then(() => {
              dropped++;
              setTimeout(() => dropNext(i + 1), 250);
            })
            .catch(() => dropNext(i + 1));
        } else {
          setTimeout(() => dropNext(i + 1), 50);
        }
      };

      dropNext(0);
    } else {
      const slotNum = parseInt(slotArg);
      if (isNaN(slotNum) || slotNum < 1 || slotNum > 9) {
        this.ui.log('red', `[❌] Invalid slot number. Use 1-9 or 'all'.`);
        return;
      }

      const item = bot.inventory.slots[slotNum - 1 + 36];
      const spinner = this.ui.createSpinner(`${botName} dropping slot ${slotNum}...`).start();

      if (!item) {
        spinner.fail(`${this.ui.colors.yellow}[⚠️] No item in slot ${slotNum}${this.ui.colors.reset}`);
        return;
      }

      bot.tossStack(item)
        .then(() => {
          spinner.succeed(`${this.ui.colors.green}[✅] Dropped ${item.name} x${item.count}${this.ui.colors.reset}`);
        })
        .catch(err => {
          spinner.fail(`${this.ui.colors.red}[❌] Failed to drop item: ${err}${this.ui.colors.reset}`);
        });
    }
  }

  sellSnowballs(bot, botName) {
    if (!bot) return;
    const spinner = this.ui.createSpinner(`${botName} is selling snowballs...`).start();
    bot.chat('/sellall SNOWBALL');

    setTimeout(() => {
      spinner.succeed(`${this.ui.colors.green}[💰] ${botName} sold all snowballs${this.ui.colors.reset}`);
    }, 1000);
  }

  openShop(bot, botName) {
    if (!bot) return;

    const spinner = this.ui.createSpinner(`${botName} is opening shop...`).start();
    bot.chat('/shop CustomItems');

    return new Promise((resolve, reject) => {
      bot.once('windowOpen', (window) => {
        spinner.text(`${botName} navigating shop menu...`);
        setTimeout(() => {
          try {
            bot.clickWindow(6, 0, 0);
            bot.once('windowOpen', (subWindow) => {
              setTimeout(() => {
                try {
                  bot.clickWindow(13, 0, 0);
                  bot.closeWindow(subWindow);
                  spinner.succeed(`${this.ui.colors.green}[🛒] ${botName} bought a shovel${this.ui.colors.reset}`);
                  resolve();
                } catch (err) {
                  spinner.fail(`${this.ui.colors.red}[❌] Submenu click failed: ${err}${this.ui.colors.reset}`);
                  reject(err);
                }
              }, 750);
            });
          } catch (err) {
            spinner.fail(`${this.ui.colors.red}[❌] Menu click failed: ${err}${this.ui.colors.reset}`);
            reject(err);
          }
        }, 750);
      });
    });
  }

  async autoEquipShovel(bot, botName) {
    if (!bot) return;
    const spinner = this.ui.createSpinner(`${botName} checking inventory for a shovel...`).start();
    const shovel = bot.inventory.items().find(item => item.name.includes('shovel'));

    if (shovel) {
      try {
        await bot.equip(shovel, 'hand');
        spinner.succeed(`${this.ui.colors.green}[✅] ${botName} equipped a shovel${this.ui.colors.reset}`);
        return true;
      } catch (err) {
        spinner.fail(`${this.ui.colors.red}[❌] Failed to equip shovel: ${err}${this.ui.colors.reset}`);
        return false;
      }
    } else {
      spinner.warn(`${this.ui.colors.yellow}[⚠️] No shovel found, trying to buy one...${this.ui.colors.reset}`);
      await this.openShop(bot, botName);
      return true;
    }
  }
}

module.exports = BotTasks;
