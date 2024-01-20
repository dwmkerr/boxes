import colors from "colors/safe";

function boxId(boxId: string) {
  //  TODO colors.white.bold should work, but typescript complains...
  return colors.white(colors.bold(boxId));
}

function state(stateName: string) {
  const mappings = [
    { rex: /\<unknown\>/, colorFunc: colors.red },
    { rex: /stopped/, colorFunc: colors.red },
    { rex: /(stopping|pending)/, colorFunc: colors.yellow },
    { rex: /running/, colorFunc: colors.green },
    { rex: /terminated/, colorFunc: colors.grey },
  ];

  //  Find the first mapping.
  const mapping = mappings.find((m) => m.rex.test(stateName));
  const colorFunc = mapping ? mapping.colorFunc : colors.grey;

  //  Call the color function, e.g. 'color.green('starting')'.
  return colorFunc(stateName);
}

function printBoxHeading(box: string, status?: string) {
  console.log(`${boxId(box)}${status ? `: ${state(status)}` : ""}`);
}

function printBoxDetail(name: string, value: string) {
  console.log(`  ${colors.white(name)}: ${colors.white(value)}`);
}

function printWarning(message: string) {
  console.log(colors.yellow(message));
}

export function printError(message: string) {
  console.log(colors.red(message));
}

export default {
  boxId,
  state,
  printBoxHeading,
  printBoxDetail,
  printWarning,
  printError,
};
