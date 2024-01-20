//  Note that 'clipboardy' and 'open' require dynamic imports so that this
//  can be packaged as a commonjs module. The dyanmic imports are directly
//  used in the 'connect' function below.
// import clipboard from "clipboardy";
import { getBoxes } from "../lib/get-boxes";
import { getBoxConfig } from "../config";
import { TerminatingWarning } from "../lib/errors";

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
    throw new TerminatingWarning(`Unable to find box with id '${boxId}'`);
  }

  //  If the box instance is not available, we can't get the address to SSH
  //  to it.
  if (!box.instance) {
    throw new TerminatingWarning(
      `box is not availalble for SSH, current status is: ${box.state}`,
    );
  }

  //  Expand the url string, which'll look something like this:
  //  http://${host}:9091/transmission/web/
  const expandedUrl = boxConfig.connectUrl
    .replace("${host}", box.instance.PublicDnsName)
    .replace("${username}", boxConfig.username);

  //  If the user has asked for the password to be copied, put it on the
  //  clipboard.
  if (copyPassword) {
    const clipboard = (await import("clipboardy")).default;
    clipboard.writeSync(boxConfig.password);
  }

  //  If the user has requested to open the connection, open it now.
  if (openConnection) {
    const open = (await import("open")).default;
    await open(expandedUrl);
  }

  return {
    url: expandedUrl,
    username: boxConfig.username,
    password: boxConfig.password,
  };
}
