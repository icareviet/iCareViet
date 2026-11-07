import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const php = process.env.PHP_BIN || (existsSync('.runtime/php/php.exe') ? resolve('.runtime/php/php.exe') : 'php');
const port = process.env.PORT || '8080';
const child = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', 'public', 'router.php'], { stdio: 'inherit', env: { ...process.env, APP_ENV: 'local' } });
child.on('error', e => { console.error(`Cannot start PHP: ${e.message}. Set PHP_BIN to your PHP 8.3+ executable.`); process.exitCode = 1; });
process.on('SIGINT', () => child.kill());
process.on('SIGTERM', () => child.kill());
