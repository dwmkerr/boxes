import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
} from "@aws-sdk/client-ec2";

export async function getBoxes() {
  const client = new EC2Client();

  const instancesResponse = await client.send(
    new DescribeInstancesCommand({
      IncludeAllInstances: true,
      Filters: [
        {
          Name: "tag:boxes.boxid",
          Values: ["*"],
        },
      ],
    }),
  );

  const instances = instancesResponse.Reservations.flatMap((r) => r.Instances);

  //  We filter out terminated boxes (otherwise we can get multiple boxes with
  //  the same ID, e.g. if a user quickly terminates and recreates a box).
  const validInstances = instances.filter((i) => i.State.Name !== "terminated");

  const boxes = validInstances.map((i) => ({
    boxId: getTagValOr(i.Tags, "boxes.boxid", null),
    instanceId: i.InstanceId,
    name: nameFromTags(i.Tags),
    status: i.State.Name,
    instance: i,
  }));

  return boxes;
}

const getTagValOr = (tags, tagName, fallback) => {
  return tags.reduce((acc, val) => {
    return val.Key == tagName ? val.Value : acc;
  }, fallback);
};
const nameFromTags = (tags) => {
  return getTagValOr(tags, "Name", "<unknown>");
};
