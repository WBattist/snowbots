class UI {
  constructor() {
    this.colors = {
      reset: "\x1b[0m",
      green: "\x1b[32m",
      yellow: "\x1b[33m", 
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      red: "\x1b[31m",
      bold: "\x1b[1m"
    };
  }

  log(type, message) {
    switch (type) {
      case 'success':
        console.log(`${this.colors.green}[✅] ${message}${this.colors.reset}`);
        break;
      case 'error':
        console.log(`${this.colors.red}[❌] ${message}${this.colors.reset}`);
        break;
      case 'warning':
        console.log(`${this.colors.yellow}[⚠️] ${message}${this.colors.reset}`);
        break;
      case 'info':
        console.log(`${this.colors.blue}[ℹ️] ${message}${this.colors.reset}`);
        break;
      case 'message':
        console.log(`${this.colors.cyan}[💬] ${message}${this.colors.reset}`);
        break;
      case 'command':
        console.log(`${this.colors.magenta}[🤖] ${message}${this.colors.reset}`);
        break;
      case 'snow':
        console.log(`${this.colors.blue}[⛄] ${message}${this.colors.reset}`);
        break;
      case 'shop':
        console.log(`${this.colors.green}[🛒] ${message}${this.colors.reset}`);
        break;
      case 'money':
        console.log(`${this.colors.green}[💰] ${message}${this.colors.reset}`);
        break;
      case 'game':
        console.log(`${this.colors.magenta}[🎮] ${message}${this.colors.reset}`);
        break;
      default:
        console.log(message);
    }
  }

  createSpinner(message) {
    return new SimpleSpinner(message, this.colors);
  }

  getPrompt() {
    return `${this.colors.green}➤ ${this.colors.reset}`;
  }

  showBanner() {
    console.log('\n');
    console.log(`${this.colors.blue}${this.colors.bold}
  __  __  ____    ____  _   _  _____        __   ____   ___ _____ ____  
 |  \/  |/ ___|  / ___|| \ | |/ _ \ \      / /  | __ ) / _ \_   _/ ___| 
 | |\/| | |      \___ \|  \| | | | \ \ /\ / /   |  _ \| | | || | \___ \ 
 | |  | | |___    ___) | |\  | |_| |\ V  V /    | |_) | |_| || |  ___) | 
 |_|  |_|\____|  |____/|_| \_|\___/  \_/\_/     |____/ \___/ |_| |____/ 
    ${this.colors.reset}`);
    this.showCommands();
  }

  showCommands() {
    console.log(`${this.colors.cyan}
╔═══════════════════════════════════════════════════════╗
║                 ${this.colors.bold}SNOW BOT COMMANDS${this.colors.reset}${this.colors.cyan}                       ║
╠═══════════════════════════════════════════════════════╣
║ ${this.colors.green}bot create <number>${this.colors.cyan}  - Create multiple bots            ║
║ ${this.colors.green}bot<N> join${this.colors.cyan}         - Create or rejoin a bot          ║
║ ${this.colors.green}bot<N> survival${this.colors.cyan}     - Switch to survival server       ║
║ ${this.colors.green}bot<N> break-snow${this.colors.cyan}   - Start breaking snow             ║
║ ${this.colors.green}bot<N> stop-snow${this.colors.cyan}    - Stop breaking snow              ║
║ ${this.colors.green}bot<N> goto <player>${this.colors.cyan} - Go to a player                 ║
║ ${this.colors.green}bot<N> goto x y z${this.colors.cyan}   - Go to coordinates               ║
║ ${this.colors.green}bot<N> dropslot <1-9>${this.colors.cyan} - Drop item from hotbar slot    ║
║ ${this.colors.green}bot<N> dropslot all${this.colors.cyan} - Drop all hotbar items           ║
║ ${this.colors.green}bot<N> sellballs${this.colors.cyan}    - Sell all snowballs              ║
║ ${this.colors.green}bot<N> leave${this.colors.cyan}        - Disconnect a bot                ║
║ ${this.colors.green}bot<N> shop${this.colors.cyan}         - Open shop and navigate menus   ║
║ ${this.colors.green}bot<N> command-control${this.colors.cyan} - Control bot chat             ║
║ ${this.colors.green}toggle chat${this.colors.cyan}         - Toggle chat message visibility  ║
║ ${this.colors.yellow}* Use "all" instead of <N> to affect all bots${this.colors.cyan}          ║
╚═══════════════════════════════════════════════════════╝
${this.colors.reset}`);
  }
}

// SimpleSpinner class for loading animations
class SimpleSpinner {
  constructor(message, colors) {
    this.message = message;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.interval = null;
    this.frameIndex = 0;
    this.isSpinning = false;
    this.colors = colors;
  }

  start() {
    if (this.isSpinning) return this;
    this.isSpinning = true;
    this.frameIndex = 0;
    process.stdout.write('\r');
    this.interval = setInterval(() => {
      const frame = this.frames[this.frameIndex];
      process.stdout.write(`\r${this.colors.blue}${frame}${this.colors.reset} ${this.message}`);
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    }, 80);
    return this;
  }

  succeed(message) {
    this.stop();
    process.stdout.write(`\r${this.colors.green}✓${this.colors.reset} ${message}\n`);
    return this;
  }

  fail(message) {
    this.stop();
    process.stdout.write(`\r${this.colors.red}✗${this.colors.reset} ${message}\n`);
    return this;
  }

  warn(message) {
    this.stop();
    process.stdout.write(`\r${this.colors.yellow}⚠${this.colors.reset} ${message}\n`);
    return this;
  }

  stop() {
    if (!this.isSpinning) return this;
    clearInterval(this.interval);
    this.isSpinning = false;
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    return this;
  }

  text(message) {
    this.message = message;
    return this;
  }
}

module.exports = UI;
