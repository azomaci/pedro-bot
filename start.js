// Start both server and bot
const { spawn } = require('child_process');

// Start server
const server = spawn('node', ['server.js'], {
    stdio: 'inherit'
});

// Start bot
const bot = spawn('node', ['bot.js'], {
    stdio: 'inherit'
});

// Handle exit
process.on('SIGTERM', () => {
    server.kill();
    bot.kill();
    process.exit(0);
});
