export default async () => {
  //  It is essential we explicitly set the timezone so that our tests that
  //  check around edge cases for dates run deterministically in all environments.
  process.env.TZ = "America/Los_Angeles";
};
