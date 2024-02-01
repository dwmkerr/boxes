import { BoxesConfiguration, getConfiguration } from "../configuration";

export async function config(): Promise<BoxesConfiguration> {
  const configuration = getConfiguration();
  return configuration;
}
