const { getBoxes, startOrStopBoxes } = require('./get-boxes');
const cfg = require('./config');

async function list() {
  const boxes = await getBoxes();
  return boxes;

  //  Show the status of each box.
  boxes.forEach(box => {
    console.log(`${box.name} (${box.boxId}): ${box.status}`);
    console.log(`       DNS: ${box.instance.PublicDnsName}`);
    console.log(`        IP: ${box.instance.PublicIpAddress}`);
  });
}

async function info(boxId) {
  const boxes = await getBoxes();
  const box = boxes.find(b => b.boxId === boxId);
  console.log(box);
}

async function connect(boxId) {
  const boxes = await getBoxes();
  const box = boxes.find(b => b.boxId === boxId);
  if (!box) {
    console.log(`cannot find '${boxId}'`);
    return;
  }

  //  Connection parameters are hard coded for the moment.
  if (box.boxId === 'steambox') {
    console.log(`       URL: dcv://${box.instance.PublicDnsName}:8443/#console`);
  } else if (box.boxId === 'torrentbox') {
    console.log(`       URL: http://${box.instance.PublicDnsName}:9091/transmission/web/`);
  } else {
    throw new Error(`don't know how to connect to find '${boxId}'`);
  }
}

async function start(boxId) {
  return await startOrStopBoxes([boxId], true);
}

async function stop(boxId) {
  return await startOrStopBoxes([boxId], false);
}

async function config() {
  const currentConfig = cfg.load();
  console.log(currentConfig);
}

module.exports = {
  list,
  info,
  connect,
  start,
  stop,
  config,
};
