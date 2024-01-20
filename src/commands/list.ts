import { getBoxes } from "../lib/get-boxes";
import { Box } from "../box";

export async function list(): Promise<Box[]> {
  const boxes = await getBoxes();
  return boxes;
}
