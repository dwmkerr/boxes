#!/usr/bin/env node

import { Command } from "commander";
import { list, info, connect, start, stop, ssh, getCosts } from "./commands.js";
import theme from "./theme.js";

//  Import the package.json in a way compatible with most recent versions of
//  node.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pathName = require.resolve("../package.json");
const packageJson = require(pathName);

const program = new Command();
program
  .name("boxes")
  .description("CLI to control your cloud boxes")
  .version(packageJson.version);

program
  .command("list")
  .alias("ls")
  .description("Show boxes")
  .action(async () => {
    const boxes = await list();
    boxes.forEach((box) => {
      console.log(`${theme.boxId(box.boxId)}: ${theme.state(box.status)}`);
      console.log(`  Name: ${box.name}`);
      //  Only show DNS details if they exist (i.e. if the box is running).
      if (box.instance.PublicDnsName) {
        console.log(`  DNS: ${box.instance.PublicDnsName}`);
        console.log(`  IP: ${box.instance.PublicIpAddress}`);
      }
    });
  });

program
  .command("info")
  .description("Show detailed info on a box")
  .argument("<boxId>", 'id of the box, e.g: "steambox"')
  .action(info);

program
  .command("connect")
  .description("Connect to a box")
  .argument("<boxId>", 'id of the box, e.g: "steambox"')
  .option("-o, --open", "open connection", false)
  .action(async (boxId, options) => {
    const result = await connect(boxId, options.open);
    console.log(result);
  });

program
  .command("ssh")
  .description("Establish an SSH connection to a box")
  .argument("<boxId>", 'id of the box, e.g: "steambox"')
  .option("-o, --open", "open connection", false)
  .action(async (boxId, options) => {
    const result = await ssh(boxId, options.open);
    console.log(result);
  });

program
  .command("start")
  .description("Start a box")
  .argument("<boxId>", 'id of the box, e.g: "steambox"')
  .action(async (boxId) => {
    const result = await start(boxId);
    result.forEach((transition) => {
      const { boxId, instanceId, currentState, previousState } = transition;
      console.log(
        `  ${theme.boxId(boxId)} (${instanceId}): ${theme.state(
          previousState,
        )} -> ${theme.state(currentState)}`,
      );
    });
  });

program
  .command("stop")
  .description("Stop a box")
  .argument("<boxId>", 'id of the box, e.g: "steambox"')
  .action(async (boxId) => {
    const result = await stop(boxId);
    result.forEach((transition) => {
      const { boxId, instanceId, currentState, previousState } = transition;
      console.log(
        `  ${theme.boxId(boxId)} (${instanceId}): ${theme.state(
          previousState,
        )} -> ${theme.state(currentState)}`,
      );
    });
  });

program
  .command("costs")
  .description("Check box costs")
  .option("-y, --yes", "accept AWS charges", false)
  .action(async (options) => {
    const result = await getCosts(options.yes);
    console.log(result);
  });

program.parse();
