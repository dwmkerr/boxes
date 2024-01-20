import {
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
} from "@aws-sdk/client-ec2";
import { getBoxes } from "./get-boxes";

export interface BoxTransition {
  boxId: string;
  instanceId: string | undefined;
  currentState: string;
  previousState: string;
}

export async function startOrStopBoxes(
  boxIds: string[],
  start: boolean,
): Promise<BoxTransition[]> {
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
    .filter((iid): iid is string => !!iid);

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
      const startingInstance = response.StartingInstances?.find(
        (si) => si.InstanceId === biid.instanceId,
      );
      const currentStateName =
        startingInstance?.CurrentState?.Name || "unknown";
      const previousStateName =
        startingInstance?.PreviousState?.Name || "unknown";
      return {
        ...biid,
        currentState: currentStateName,
        previousState: previousStateName,
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
      const startingInstance = response.StoppingInstances?.find(
        (si) => si.InstanceId === biid.instanceId,
      );
      const currentStateName =
        startingInstance?.CurrentState?.Name || "unknown";
      const previousStateName =
        startingInstance?.PreviousState?.Name || "unknown";
      return {
        ...biid,
        currentState: currentStateName,
        previousState: previousStateName,
      };
    });
    return newInstancesStates;
  }
}
