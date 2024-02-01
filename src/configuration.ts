import fs from "fs";

export interface BoxConfiguration {
  connectUrl?: string;
  username?: string;
  password?: string;
  sshCommand?: string;
}

export interface AwsConfiguration {
  region?: string;
}

export interface BoxesConfiguration {
  boxes?: Record<string, BoxConfiguration>;
  aws?: AwsConfiguration;
  archiveVolumesOnStop?: boolean;
  debugEnable?: string;
}

export function getConfiguration(): BoxesConfiguration {
  //  For now, box config is hard coded to the current location.
  const boxConfigPath = "./boxes.json";
  const data = fs.readFileSync(boxConfigPath, "utf8");
  const json = JSON.parse(data);

  //  Map the boxes configuration.
  const boxes = Object.getOwnPropertyNames(json?.boxes).reduce(
    (acc: Record<string, BoxConfiguration>, boxId: string) => {
      acc[boxId] = {
        connectUrl: json?.boxes?.[boxId]?.connectUrl,
        username: json?.boxes?.[boxId]?.username,
        password: json?.boxes?.[boxId]?.password,
        sshCommand: json?.boxes?.[boxId]?.sshCommand,
      };
      return acc;
    },
    {},
  );

  return {
    boxes,
    aws: {
      region: json?.aws?.region,
    },
    archiveVolumesOnStop: json?.archiveVolumesOnStop,
    debugEnable: json?.debugEnable,
  };
}
