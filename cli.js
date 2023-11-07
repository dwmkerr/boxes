#!/usr/bin/env node

const { Command } = require("commander");
const packageJson = require("./package.json");
const { list, info, connect, start, stop } = require("./commands");
const theme = require("./theme");

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
  .action(async (boxId) => {
    const result = await connect(boxId);
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

program.parse();
