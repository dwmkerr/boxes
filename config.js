const fs = require("fs/promises");

async function getBoxConfig() {
  //  For now, box config is hard coded to the current location.
  const boxConfigPath = "./boxes.json";
  const data = await fs.readFile(boxConfigPath, "utf8");
  const json = JSON.parse(data);
  return json;
}

module.exports = {
  getBoxConfig,
};
