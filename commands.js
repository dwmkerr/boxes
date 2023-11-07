const { getBoxes, startOrStopBoxes } = require("./get-boxes");
const { getBoxConfig } = require("./config");

async function list() {
  const boxes = await getBoxes();
  return boxes;
}

async function info(boxId) {
  const boxes = await getBoxes();
  const box = boxes.find((b) => b.boxId === boxId);
  console.log(box);
}

async function connect(boxId) {
  //  First, we need to load box configuration. If it is missing, or we don't
  //  have configuration for the given box, we'll bail.
  const boxesConfig = await getBoxConfig();
  const boxConfig = boxesConfig.boxes.find((b) => b.boxId === boxId);
  if (!boxConfig) {
    //  TODO throw error with suggestion.
    throw new Error(
      `unable to find box with id '${boxId}' in config file boxes.json`,
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
  const expandedUrl = boxConfig.connectUrl.replace(
    "${host}",
    box.instance.PublicDnsName,
  );
  return {
    url: expandedUrl,
    username: boxConfig.username,
    password: boxConfig.password,
  };
}

async function start(boxId) {
  return await startOrStopBoxes([boxId], true);
}

async function stop(boxId) {
  return await startOrStopBoxes([boxId], false);
}

module.exports = {
  list,
  info,
  connect,
  start,
  stop,
};
