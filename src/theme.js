import colors from "colors/safe.js";

function boxId(boxId) {
  return colors.white.bold(boxId);
}

function state(stateName) {
  const mappings = [
    { rex: /\<unknown\>/, colorName: "red" },
    { rex: /stopped/, colorName: "red" },
    { rex: /(stopping|pending)/, colorName: "yellow" },
    { rex: /running/, colorName: "green" },
    { rex: /terminated/, colorName: "grey" },
  ];

  //  Find the first mapping.
  const mapping = mappings.find((m) => m.rex.test(stateName));
  const colorName = mapping ? mapping.colorName : "grey";

  //  Call the color function, e.g. 'color.green('starting')'.
  return colors[colorName](stateName);
}

function printBoxHeading(box, status) {
  console.log(`${boxId(box)}${status ? `: ${state(status)}` : ""}`);
}

function printBoxDetail(name, value) {
  console.log(`  ${colors.white(name)}: ${colors.white(value)}`);
}

function printWarning(message) {
  console.log(colors.yellow(message));
}

export default {
  boxId,
  state,
  printBoxHeading,
  printBoxDetail,
  printWarning,
};
