#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import speedTest from 'speedtest-net'

type ChalkFunction = (text: string) => string;

// Define types for thresholds and options
interface Thresholds {
  latency: { good: number; warn: number };
  jitter: { good: number; warn: number };
  speed: { good: number; warn: number };
  packetLoss: { good: number; warn: number };
}

interface Options {
  verbose?: boolean;
  serverId?: string;
}

// Define the SpeedTestResult interface based on speedtest-net output
interface SpeedTestResult {
  download: { bandwidth: number };
  upload: { bandwidth: number };
  ping: { latency: number; jitter: number };
  packetLoss: number;
  server: {
    name?: string;
    location?: string;
    country?: string;
  };
}

// Color function with type safety
const getColor = (value: number, thresholds: { good: number; warn: number }, isHigherBetter: boolean = false): ChalkFunction => {
  if (isHigherBetter) {
    if (value > thresholds.good) return chalk.green;
    if (value > thresholds.warn) return chalk.yellow;
    return chalk.red;
  } else {
    if (value < thresholds.good) return chalk.green;
    if (value < thresholds.warn) return chalk.yellow;
    return chalk.red;
  }
};

// Thresholds configuration
const thresholds: Thresholds = {
  latency: { good: 50, warn: 100 }, // ms
  jitter: { good: 5, warn: 10 },    // ms
  speed: { good: 10, warn: 5 },     // Mbps
  packetLoss: { good: 0, warn: 10 },
};

// Log results to terminal with typed parameters
const logResultInTerminal = (result: SpeedTestResult): void => {
  const { download, upload, ping, packetLoss } = result;
  const downloadMbps: string = (download.bandwidth / 125000).toFixed(2); // Convert bps to Mbps
  const uploadMbps: string = (upload.bandwidth / 125000).toFixed(2);     // Convert bps to Mbps
  const { latency, jitter } = ping;

  console.log(chalk.bold('\nNetwork Stats:'));
  console.log(`- ${chalk.bold('Download Speed')}: ${getColor(parseFloat(downloadMbps), thresholds.speed, true)(`${downloadMbps} Mbps`)}`);
  console.log(`- ${chalk.bold('Upload Speed')}: ${getColor(parseFloat(uploadMbps), thresholds.speed, true)(`${uploadMbps} Mbps`)}`);
  console.log(`- ${chalk.bold('Latency')}: ${getColor(latency, thresholds.latency)(`${latency} ms`)}`);
  console.log(`- ${chalk.bold('Jitter')}: ${getColor(jitter, thresholds.jitter)(`${jitter} ms`)}`);
  console.log(`- ${chalk.bold('Packet Loss')}: ${getColor(packetLoss, thresholds.packetLoss)(`${packetLoss}%`)}`);
};

// CLI program setup with typed action
program
  .version('1.0.0')
  .description('A CLI tool to check network stats like speed, latency, and jitter')
  .option('-v, --verbose', 'Show detailed output')
  .option('--server-id <id>', 'Specify a custom test server ID')
  .action(async (options: Options) => {
    console.log(chalk.blue('Starting network check...'));

    try {
      // acceptLicense: true is mandatory since we are using speedTest for non-commercial purposes
      const result: SpeedTestResult = await speedTest({ serverId: options.serverId, acceptLicense: true });

      logResultInTerminal(result);

      if (options.verbose) {
        console.log(chalk.gray('\nDetailed Info:'));
        console.log(chalk.gray(`- Server: ${result.server.name || 'Default'}, ${result.server.location}, ${result.server.country}`));
        console.log(chalk.gray(`- Timestamp: ${new Date().toISOString()}`));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Error: ${error.message}`));
      } else {
        console.error(chalk.red('An unknown error occurred'));
      }
    }
  });

program.parse(process.argv);