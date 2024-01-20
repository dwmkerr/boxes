#!/usr/bin/env node

import { Command } from "commander";
import { list, info } from "./commands";
import { start } from "./commands/start";
import { stop } from "./commands/stop";
import { ssh } from "./commands/ssh";
import { getCosts } from "./commands/getCosts";
import { connect } from "./commands/connect";
import theme from "./theme";
import { TerminatingWarning } from "./lib/errors";
import packageJson from "../package.json";
import { BoxState } from "./box";

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
      theme.printBoxHeading(box.boxId, box.state);
      theme.printBoxDetail("Name", box.name);
      //  Only show DNS details if they exist (i.e. if the box is running).
      if (box.instance?.PublicDnsName && box.instance?.PublicIpAddress) {
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
  .option("-c, --copy-password", "copy password to clipboard", false)
  .action(async (boxId, options) => {
    const result = await connect(boxId, options.open, options.copyPassword);
    console.log(result);
    if (options.copyPassword) {
      console.log();
      console.log("...password copied to clipboard");
    }
  });

program
  .command("ssh")
  .description("Establish an SSH connection to a box")
  .argument("<boxId>", 'id of the box, e.g: "steambox"')
  .option("-o, --open", "open connection", false)
  .option("-c, --copy-command", "copy ssh command to clipboard", false)
  .action(async (boxId, options) => {
    const result = await ssh(boxId, options.copyCommand, options.open);
    console.log(result);
  });

program
  .command("start")
  .description("Start a box")
  .argument("<boxId>", 'id of the box, e.g: "steambox"')
  .action(async (boxId) => {
    const { instanceId, currentState, previousState } = await start(boxId);
    console.log(
      `  ${theme.boxId(boxId)} (${instanceId}): ${theme.state(
        previousState,
      )} -> ${theme.state(currentState)}`,
    );
  });

program
  .command("stop")
  .description("Stop a box")
  .argument("<boxId>", 'id of the box, e.g: "steambox"')
  .option("--detach-volumes", "detach EBS volumes (experimental)", false)
  .action(async (boxId, options) => {
    const { instanceId, currentState, previousState } = await stop(
      boxId,
      options.detachVolumes,
    );
    console.log(
      `  ${theme.boxId(boxId)} (${instanceId}): ${theme.state(
        previousState,
      )} -> ${theme.state(currentState)}`,
    );
  });

program
  .command("costs")
  .description("Check box costs")
  .option("-y, --yes", "accept AWS charges", false)
  .option("-y, --year <year>", "month of year", undefined)
  .option("-m, --month <month>", "month of year", undefined)
  .action(async (options) => {
    const boxes = await list();
    const costs = await getCosts({
      yes: options.yes,
      year: options.year,
      month: options.month,
    });

    //  Show each box, joined to costs.
    boxes.forEach((box) => {
      //  TODO refactor typescript
      if (box.boxId !== undefined) {
        theme.printBoxHeading(box.boxId, box.state);
        const boxCosts = costs[box.boxId];
        theme.printBoxDetail("Costs (this month)", boxCosts || "<unknown>");
        delete costs[box.boxId];
      }
    });

    //  Any costs we didn't map should be found.
    Object.getOwnPropertyNames(costs).forEach((key) => {
      const cost = costs[key];
      if (key === "*") {
        theme.printBoxHeading("Non-box costs");
      } else {
        theme.printBoxHeading(key, BoxState.Unknown);
      }
      theme.printBoxDetail("Costs (this month)", cost);
    });
  });

async function run() {
  try {
    await program.parseAsync();
    // TODO(refactor): better error typing.
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  } catch (err: any) {
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
