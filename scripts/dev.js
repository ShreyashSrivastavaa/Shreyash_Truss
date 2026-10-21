import { spawn } from 'node:child_process';

console.log('\x1b[36m%s\x1b[0m', 'Nexus Full-Stack Dev Runner');
console.log('• Backend API:  http://localhost:5000');
console.log('• Frontend UI:  http://localhost:5173\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const server = spawn(npmCmd, ['--prefix', 'server', 'run', 'dev'], {
  stdio: 'inherit'
});

const client = spawn(npmCmd, ['--prefix', 'client', 'run', 'dev'], {
  stdio: 'inherit'
});

function cleanup() {
  try {
    server.kill();
    client.kill();
  } catch {
    // Ignore error on exit
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
