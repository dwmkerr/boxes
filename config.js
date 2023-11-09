import fs from "fs/promises";

export async function getBoxConfig() {
  //  For now, box config is hard coded to the current location.
  const boxConfigPath = "./boxes.json";
  const data = await fs.readFile(boxConfigPath, "utf8");
  const json = JSON.parse(data);
  return json;
}
