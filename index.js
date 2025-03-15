#!/usr/bin/env node

import { program } from 'commander'
import chalk from 'chalk'
import speedTest from 'speedtest-net'

const getColor = (value, thresholds, isHigherBetter = false) => {
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

const thresholds = {
    latency: { good: 50, warn: 100 }, // ms
    jitter: { good: 5, warn: 10 },    // ms
    speed: { good: 10, warn: 5 },     // Mbps
    packetLoss: { good: 0, warn: 10 }
};

const logResultInTerminal = (result) => {
    const { download, upload, ping, packetLoss } = result;
    const downloadMbps = (download.bandwidth / 125000).toFixed(2); // Convert bps to Mbps
    const uploadMbps = (upload.bandwidth / 125000).toFixed(2);     // Convert bps to Mbps
    const {latency, jitter} = ping

    console.log(chalk.bold('\nNetwork Stats:'));
    console.log(`- ${chalk.bold('Download Speed')}: ${getColor(downloadMbps, thresholds.speed, true)(`${downloadMbps} Mbps`)}`);
    console.log(`- ${chalk.bold('Upload Speed')}: ${getColor(uploadMbps, thresholds.speed, true)(`${uploadMbps} Mbps`)}`);
    console.log(`- ${chalk.bold('Latency')}: ${getColor(latency, thresholds.latency)(`${latency} ms`)}`);
    console.log(`- ${chalk.bold('Jitter')}: ${getColor(jitter, thresholds.jitter)(`${jitter} ms`)}`);
    console.log(`- ${chalk.bold('Packet Loss')}: ${getColor(packetLoss, thresholds.packetLoss)(`${packetLoss} ms`)}`);
}

program
    .version('1.0.0')
    .description('A CLI tool to check network stats like speed, latency, and jitter')
    .option('-v, --verbose', 'Show detailed output')
    .option('--server <url>', 'Specify a custom test server URL')
    .action(async (options) => {
        console.log(chalk.blue('Starting network check...'));

        try {
            // acceptLicense: true is mandatory since we are using the speedTest for non-commercial purpose
            const result = await speedTest({ serverUrl: options.server, acceptLicense: true });

            logResultInTerminal(result);

            if (options.verbose) {
                console.log(chalk.gray('\nDetailed Info:'));
                console.log(chalk.gray(`- Server: ${result.server.name || 'Default'}, ${result.server.location}, ${result.server.country}`));
                console.log(chalk.gray(`- Timestamp: ${new Date().toISOString()}`));
            }
        } catch (error) {
            console.error(chalk.red(`Error: ${error.message}`));
        }
    });

program.parse(process.argv);