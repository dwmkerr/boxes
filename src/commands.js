import { getBoxes } from "./lib/get-boxes";
import { startOrStopBoxes } from "./manage-boxes";
// TODO ts
// import open from "open";
import { getBoxConfig } from "./config";
import { TerminatingWarning } from "./errors";

export async function list() {
  const boxes = await getBoxes();
  return boxes;
}

export async function info(boxId) {
  const boxes = await getBoxes();
  const box = boxes.find((b) => b.boxId === boxId);
  console.log(box);
}

export async function start(boxId) {
  return await startOrStopBoxes([boxId], true);
}

export async function ssh(boxId, openConnection) {
  //  First, we need to load box configuration. If it is missing, or we don't
  //  have configuration for the given box, we'll bail.
  const boxesConfig = await getBoxConfig();
  const boxConfig = boxesConfig.boxes[boxId];
  if (!boxConfig) {
    throw new TerminatingWarning(
      `Unable to find box with id '${boxId}' in config file boxes.json`,
    );
  }

  //  Now get the boxes.
  const boxes = await getBoxes();
  const box = boxes.find((b) => b.boxId === boxId);
  if (!box) {
    console.log(`cannot find '${boxId}'`);
    return;
  }

  //  Expand the url string, which'll look something like this:
  //  http://${host}:9091/transmission/web/
  const command = boxConfig.sshCommand
    .replace("${host}", box.instance.PublicDnsName)
    .replace("${username}", boxConfig.username);

  //  If the user has requested to open the connection, open it now.
  if (openConnection) {
    // TODO ts
    // await open(command);
    console.log("TODO typescript refactor");
  }

  return command;
}
