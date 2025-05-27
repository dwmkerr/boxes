import dbg from "debug";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import {
  CreateTagsCommand,
  DescribeInstancesCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import { TerminatingWarning } from "../lib/errors";
import { getConfiguration } from "../lib/configuration";
import { tagsAsObject } from "../lib/aws-helpers";
import { tagNames } from "../lib/constants";

const debug = dbg("boxes:import");

type ImportOptions = {
  instanceId: string;
  boxId: string;
  overwrite: boolean;
  region?: string;
};

async function updateBoxesConfig(
  boxId: string,
  overwrite: boolean,
  region?: string,
): Promise<void> {
  // Find the boxes.json file
  const boxConfigPaths = [
    path.join(path.resolve(), "./boxes.json"),
    path.join(os.homedir(), ".boxes.json"),
  ];

  const configPath = boxConfigPaths.find((p) => {
    try {
      return existsSync(p);
    } catch {
      return false;
    }
  });

  if (!configPath) {
    throw new TerminatingWarning(`Failed to find config at: ${boxConfigPaths}`);
  }

  // Read current configuration
  const configData = await fs.readFile(configPath, "utf8");
  const config = JSON.parse(configData);

  // Check if box already exists
  if (config.boxes && config.boxes[boxId] && !overwrite) {
    throw new TerminatingWarning(
      `Box '${boxId}' already exists in configuration. Use --overwrite to replace it.`,
    );
  }

  // Initialize boxes object if it doesn't exist
  if (!config.boxes) {
    config.boxes = {};
  }

  // Add the new box configuration with common commands
  config.boxes[boxId] = {
    commands: {
      ssh: {
        command: "ssh -i ~/.ssh/boxes-key.pem ubuntu@${host}",
        copyCommand: "ssh -i ~/.ssh/boxes-key.pem ubuntu@${host}",
      },
      connect: {
        command: "open rdp://ubuntu@${host}:3389",
        copyCommand: "ubuntu",
      },
      transmission: {
        command: "open http://${host}:9091/transmission/web/",
        copyCommand: "transmission",
      },
      squid: {
        command: "curl -x ${host}:3128 http://httpbin.org/ip",
        copyCommand: "Proxy: ${host}:3128",
      },
    },
  };

  // Add region if specified
  if (region) {
    config.boxes[boxId].region = region;
  }

  // Write back the updated configuration
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
  debug(`Updated boxes configuration at ${configPath} with box '${boxId}'`);
}

export async function importBox(options: ImportOptions): Promise<void> {
  const { instanceId, boxId, overwrite, region } = options;

  //  Create an EC2 client.
  const { aws: awsConfig } = await getConfiguration();

  // Use the specified region or fall back to the default configuration
  const clientConfig = {
    ...awsConfig,
    ...(region && { region }),
  };

  const client = new EC2Client(clientConfig);

  //  Get our AWS instances, we'll search for the instance and check for
  //  conflicts.
  debug(
    `preparing to describe all instances in region ${
      region || awsConfig?.region || "default"
    }...`,
  );
  const response = await client.send(new DescribeInstancesCommand({}));
  if (!response || !response.Reservations) {
    throw new TerminatingWarning("Failed to query AWS for boxes/reservations");
  }
  debug("...described successfully");

  //  Find the instance. If it doesn't exist, fail.
  const instance = response.Reservations?.flatMap((r) => r.Instances).find(
    (instance) => instance?.InstanceId === instanceId,
  );

  //  If there is no instance with the provided instance id, fail.
  if (!instance) {
    throw new TerminatingWarning(`Instance with id '${instanceId}' not found`);
  }

  //  If this instance already has a box id, but we have not chosen to
  //  overwrite it, then fail.
  const tags = tagsAsObject(instance?.Tags);
  if (tags.hasOwnProperty(tagNames.boxId) && !overwrite) {
    throw new TerminatingWarning(
      `Instance '${instanceId}' is already tagged with box id '${
        tags[tagNames.boxId]
      }`,
    );
  }

  //  Get any volumes ids that we will tag.
  const volumeIds =
    instance?.BlockDeviceMappings?.map((bdm) => bdm.Ebs?.VolumeId).filter(
      (volumeId): volumeId is string => !!volumeId,
    ) || [];

  //  Send the 'start instances' command. Find the status of the starting
  //  instance in the respose.
  debug(
    `preparing to tag instance ${instanceId} and volumes ${volumeIds} with ${tagNames.boxId}=${boxId}...`,
  );
  await client.send(
    new CreateTagsCommand({
      Resources: [instanceId, ...volumeIds],
      Tags: [
        {
          Key: tagNames.boxId,
          Value: boxId,
        },
      ],
    }),
  );
  debug(`...AWS tagging complete`);

  // Update the boxes configuration file
  await updateBoxesConfig(boxId, overwrite, region);
  debug(`...configuration file update complete`);
}
