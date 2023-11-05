
function load() {
  return {
    // clusterName: process.env['BOXES_CLUSTER_NAME'] || commandLineArgs['clusterName'] || 'boxes',
    clusterName: process.env['BOXES_CLUSTER_NAME'] || 'boxes',
  };
}

module.exports = {
  load,
};
