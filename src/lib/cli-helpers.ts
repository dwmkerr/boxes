import { TerminatingWarning } from "./errors";

export async function assertConfirmation(
  //  Commander JS uses 'any' for options, so disable the warning.
  //  eslint-disable-next-line  @typescript-eslint/no-explicit-any
  options: any,
  confirmationFlag: string,
  message: string,
) {
  //  If the user has provided the required confirmation option, we can return
  //  safely.
  if (options[confirmationFlag] === true) {
    return;
  }

  //  The user has not provided the required confirmation flag, so we must warn
  //  and fail.
  throw new TerminatingWarning(message);
}
