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

module.exports.startOrStopBoxes = async (boxIds, start) => {
  //  Get the boxes.
  const boxes = await module.exports.getBoxes();

  //  Start any box that has been requested.
  const boxInstanceIds = boxIds.map((boxId) => {
    //  Find the box with the right id.
    const box = boxes.find(b => b.boxId === boxId);
    return {
      boxId,
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

    //  Map the new state from the response.
    const newInstancesStates = boxInstanceIds.map(biid => {
      const startingInstance = response.StartingInstances.find(si => si.InstanceId === biid.instanceId);
      return {
        ...biid,
        currentState: startingInstance.CurrentState.Name,
        previousState: startingInstance.PreviousState.Name,
      }
    });
    return newInstancesStates;
  } else {
    const response = await client.send(new StopInstancesCommand({
      InstanceIds: instanceIds,
    }));
    const newInstancesStates = boxInstanceIds.map(biid => {
      const startingInstance = response.StoppingInstances.find(si => si.InstanceId === biid.instanceId);
      return {
        ...biid,
        currentState: startingInstance.CurrentState.Name,
        previousState: startingInstance.PreviousState.Name,
      }
    });
    return newInstancesStates;
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
