// TODO ts
// import clipboard from "clipboardy";
import { getBoxes } from "../lib/get-boxes";
// TODO ts
// import open from "open";
import { getBoxConfig } from "../config";
import { TerminatingWarning } from "../errors";

export async function connect(
  boxId: string,
  openConnection: boolean,
  copyPassword: boolean,
) {
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
  const expandedUrl = boxConfig.connectUrl
    .replace("${host}", box.instance.PublicDnsName)
    .replace("${username}", boxConfig.username);

  //  If the user has asked for the password to be copied, put it on the
  //  clipboard.
  if (copyPassword) {
    // TODO ts
    // clipboard.writeSync(boxConfig.password);
    console.log('Clipboard currently broken, password is:');
    console.log(boxConfig.password);
  }

  //  If the user has requested to open the connection, open it now.
  if (openConnection) {
    // TODO ts
    // await open(expandedUrl);
    console.log('Clipboard currently broken, password is:');
    console.log(boxConfig.password);
  }

  return {
    url: expandedUrl,
    username: boxConfig.username,
    password: boxConfig.password,
  };
}
