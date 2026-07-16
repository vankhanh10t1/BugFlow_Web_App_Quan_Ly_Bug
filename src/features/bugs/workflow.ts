export const BUG_STATUS_TRANSITIONS = {
  NEW: ["ASSIGNED", "REJECTED", "DUPLICATE"],
  ASSIGNED: ["NEW", "IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["READY_FOR_TEST"],
  READY_FOR_TEST: ["CLOSED", "REOPENED"],
  REOPENED: ["IN_PROGRESS"],
  CLOSED: [],
  REJECTED: [],
  DUPLICATE: [],
} as const;

export type BugStatus = keyof typeof BUG_STATUS_TRANSITIONS;

export function canTransitionBugStatus(from: BugStatus, to: BugStatus): boolean {
  return (BUG_STATUS_TRANSITIONS[from] as readonly BugStatus[]).includes(to);
}
