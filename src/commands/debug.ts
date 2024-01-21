export async function debug(command: string) {
  console.log(`debug: command - ${command}`);
  if (command === "test-detach") {
    console.log("debug: test-detach");
    return {};
  }
  return {};
}
