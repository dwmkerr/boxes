import {
  EC2Client,
  DescribeInstancesCommand,
  Tag,
} from "@aws-sdk/client-ec2";
import { Box } from "../box";
import { TerminatingWarning } from "./errors";

export async function getBoxes(): Promise<Box[]> {
  const client = new EC2Client({});

  const instancesResponse = await client.send(
    new DescribeInstancesCommand({
      // TODO typescript this seems to not be found...
      // IncludeAllInstances: true,
      Filters: [
        {
          Name: "tag:boxes.boxid",
          Values: ["*"],
        },
      ],
    }),
  );

  if (!instancesResponse || !instancesResponse.Reservations) {
    throw new TerminatingWarning("Failed to query AWS for boxes/reservations");
  }

  //  Filter down to instances which have a state.
  const instances = instancesResponse.Reservations.flatMap((r) => {
    return r.Instances;
  }).filter((instance) => instance !== undefined);

  //  We filter out terminated boxes (otherwise we can get multiple boxes with
  //  the same ID, e.g. if a user quickly terminates and recreates a box).
  const validInstances = instances.filter((i) => i?.State?.Name !== "terminated");

  const boxes = validInstances.map((i) => ({
    boxId: getTagValOr(i?.Tags || [], "boxes.boxid", ""),
    instanceId: i?.InstanceId,
    name: nameFromTags(i?.Tags || []),
    status: i?.State?.Name,
    instance: i,
  }));

  return boxes;
}

const getTagValOr = (tags: Tag[], tagName: string, fallback: string) => {
  return tags.reduce((acc, val) => {
    return val.Key == tagName && val.Value !== undefined ? val.Value : acc;
  }, fallback);
};
const nameFromTags = (tags: Tag[]): string => {
  return getTagValOr(tags, "Name", "<unknown>");
};
