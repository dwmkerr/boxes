import fs from "fs/promises";

interface AwsConfig {
  region: string | undefined;
}

export async function getConfiguration() {
  //  For now, box config is hard coded to the current location.
  const boxConfigPath = "./boxes.json";
  const data = await fs.readFile(boxConfigPath, "utf8");
  const json = JSON.parse(data);

  //  If we have an aws key and a region key, set it.
  const awsRegion = json["aws"]?.["region"];
  const awsConfig: AwsConfig = {
    ...(awsRegion && { region: awsRegion }),
  };

  return {
    ...json,
    aws: awsConfig,
  };
}
