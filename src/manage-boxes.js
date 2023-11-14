import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
} from "@aws-sdk/client-ec2";
import { getBoxes } from "./get-boxes.js";

export async function startOrStopBoxes(boxIds, start) {
  //  Get the boxes.
  const boxes = await getBoxes();

  //  Start any box that has been requested.
  const boxInstanceIds = boxIds.map((boxId) => {
    //  Find the box with the right id.
    const box = boxes.find((b) => b.boxId === boxId);
    return {
      boxId,
      instanceId: box ? box.instanceId : undefined,
    };
  });

  const instanceIds = boxInstanceIds
    .map((biid) => biid.instanceId)
    .filter((iid) => iid);

  const client = new EC2Client();

  //  Start or stop em.
  if (start) {
    const response = await client.send(
      new StartInstancesCommand({
        InstanceIds: instanceIds,
      }),
    );

    //  Map the new state from the response.
    const newInstancesStates = boxInstanceIds.map((biid) => {
      const startingInstance = response.StartingInstances.find(
        (si) => si.InstanceId === biid.instanceId,
      );
      return {
        ...biid,
        currentState: startingInstance.CurrentState.Name,
        previousState: startingInstance.PreviousState.Name,
      };
    });
    return newInstancesStates;
  } else {
    const response = await client.send(
      new StopInstancesCommand({
        InstanceIds: instanceIds,
      }),
    );
    const newInstancesStates = boxInstanceIds.map((biid) => {
      const startingInstance = response.StoppingInstances.find(
        (si) => si.InstanceId === biid.instanceId,
      );
      return {
        ...biid,
        currentState: startingInstance.CurrentState.Name,
        previousState: startingInstance.PreviousState.Name,
      };
    });
    return newInstancesStates;
  }
}
