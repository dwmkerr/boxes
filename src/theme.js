import colors from "colors/safe.js";

function boxId(boxId) {
  return colors.white.bold(boxId);
}

function state(stateName) {
  const mappings = [
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

export default {
  boxId,
  state,
};
