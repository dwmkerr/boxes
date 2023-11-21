#!/usr/bin/env node

import { Command } from "commander";
import { list, info, connect, start, stop, ssh, getCosts } from "./commands.js";
import theme from "./theme.js";
import { TerminatingWarning } from "./errors.js";

//  Import the package.json in a way compatible with most recent versions of
//  node.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pathName = require.resolve("../package.json");
const packageJson = require(pathName);

const ERROR_CODE_WARNING = 1;
const ERROR_CODE_CONNECTION = 2;

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
      theme.printBoxHeading(box.boxId, box.status);
      theme.printBoxDetail("Name", box.name);
      //  Only show DNS details if they exist (i.e. if the box is running).
      if (box.instance.PublicDnsName) {
        theme.printBoxDetail("DNS", box.instance.PublicDnsName);
        theme.printBoxDetail("IP", box.instance.PublicIpAddress);
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
    const boxes = await list();
    const costs = await getCosts(options.yes);

    //  Show each box, joined to costs.
    boxes.forEach((box) => {
      theme.printBoxHeading(box.boxId, box.status);
      const boxCosts = costs[box.boxId];
      theme.printBoxDetail("Costs (this month)", boxCosts || "<unknown>");
      delete costs[box.boxId];
    });

    //  Any costs we didn't map should be found.
    Object.getOwnPropertyNames(costs).forEach((key) => {
      const cost = costs[key];
      if (key === "*") {
        theme.printBoxHeading("Non-box costs");
      } else {
        theme.printBoxHeading(key, "<unknown>");
      }
      theme.printBoxDetail("Costs (this month)", cost);
    });
  });

async function run() {
  try {
    await program.parseAsync();
  } catch (err) {
    //  TODO: if the 'verbose' flag has been set, log the error object.
    if (err instanceof TerminatingWarning) {
      theme.printWarning(err.message);
      process.exit(ERROR_CODE_WARNING);
    } else if (err.code === "ENOTFOUND") {
      theme.printError("Address not found - check internet connection");
      process.exit(ERROR_CODE_CONNECTION);
    } else if (err.code === "ERR_TLS_CERT_ALTNAME_INVALID") {
      theme.printError("Invalid certificate - check internet connection");
      process.exit(ERROR_CODE_CONNECTION);
    } else {
      throw err;
    }
  }
}
run().catch(console.error);
