import { getConfiguration } from "../configuration";

export async function config() {
  const configuration = await getConfiguration();
  return configuration;
}
