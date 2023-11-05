const {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
} = require("@aws-sdk/client-ec2");

const getTagValOr = (tags, tagName, fallback) => {
  return tags.reduce((acc, val) => {
    return val.Key == tagName ? val.Value : acc;
  }, fallback);
};
const nameFromTags = (tags) => {
  return getTagValOr(tags, "Name", "<unknown>");
};

module.exports.startOrStopBoxes = async (boxids, start) => {
  //  Get the boxes.
  const boxes = await module.exports.getBoxes();

  //  Start any box that has been requested.
  const boxInstanceIds = boxids.map((boxid) => {
    //  Find the box with the right id.
    const box = boxes.find(b => b.boxId === boxid);
    return {
      boxid,
      instanceId: box ? box.instanceId : undefined,
    };
  });

  const instanceIds = boxInstanceIds.map(biid => biid.instanceId).filter(iid => iid);

  const client = new EC2Client({
    profile: 'dwmkerr',
    region: 'us-west-2',
  });

  //  Start or stop em.
  if (start) {
    const response = await client.send(new StartInstancesCommand({
      InstanceIds: instanceIds,
    }));
  } else {
    const response = await client.send(new StopInstancesCommand({
      InstanceIds: instanceIds,
    }));
  }
};

module.exports.getBoxes = async () => {
  const client = new EC2Client({
    profile: 'dwmkerr',
    region: 'us-west-2',
  });

  const instancesResponse = await client.send(new DescribeInstancesCommand({
    IncludeAllInstances: true,
    Filters: [
      {
        Name: "tag:boxes.cluster",
        Values: [
          "dwmkerr",
        ],
      },
    ],
  }));

  const instances = instancesResponse.Reservations.flatMap(r => r.Instances);

  const boxes = instances.map(i => ({
    boxId: getTagValOr(i.Tags, "boxes.boxid", null),
    instanceId: i.InstanceId,
    name: nameFromTags(i.Tags),
    status: i.State.Name,
    instance: i,
  }));

  return boxes;
};
