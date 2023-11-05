#!/usr/bin/env node

const { Command } = require('commander');
const packageJson = require('./package.json'); 
const {
  list,
  info,
  connect,
  start,
  stop,
  config,
} = require('./commands');
const {startOrStopBoxes} = require('./get-boxes');

//  Create the cli.
const program = new Command();

program
  .name('boxes')
  .description('CLI to control your cloud boxes')
  .version(packageJson.version);

program.command('list')
  .alias('ls')
  .description('Show boxes')
  .action(list);

program.command('config')
  .description('Show boxes CLI config')
  .action(config);

program.command('info')
  .description('Show detailed info on a box')
  .argument('<boxId>', 'id of the box, e.g: "steambox"')
  .action(info);

program.command('connect')
  .description('Connect to a box')
  .argument('<boxId>', 'id of the box, e.g: "steambox"')
  .action(connect);

program.command('start')
  .description('Start a box')
  .argument('<boxId>', 'id of the box, e.g: "steambox"')
  .action(start);

program.command('stop')
  .description('Stop a box')
  .argument('<boxId>', 'id of the box, e.g: "steambox"')
  .action(stop);

program.parse();
