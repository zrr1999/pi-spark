import { describe, expect, it } from "vitest";
import { sidebarGroups, visibleSidebarSessions, type SidebarSession } from "./sidebar";

function sidebarSession(
  sessionId: string,
  overrides: Partial<SidebarSession> = {},
): SidebarSession {
  return {
    sessionId,
    name: sessionId,
    scope: { kind: "workspace", workspaceId: "spark" },
    lineage: { kind: "child", parentSessionId: "administrator", origin: { kind: "session" } },
    roleBinding: { kind: "none" },
    placement: "active",
    activity: "idle",
    updatedAt: "2026-09-06T00:00:00.000Z",
    ...overrides,
  };
}

describe("conversation sidebar grouping", () => {
  it("groups recent conversations by owner, excludes administrators and archives, and preserves the selected archive", () => {
    const data = {
      unavailable: false,
      workspaces: [],
      sessions: [
        sidebarSession("old"),
        sidebarSession("recent", { updatedAt: "2026-09-06T01:00:00.000Z" }),
        sidebarSession("admin", {
          lineage: { kind: "root" },
          roleBinding: { kind: "explicit", roleRef: "role:builtin-administrator" },
        }),
        sidebarSession("archived", { placement: "archived" }),
        sidebarSession("general", { scope: { kind: "daemon", daemonId: "daemon" } }),
      ],
    };
    const groups = sidebarGroups(data, undefined);
    expect(
      groups.map((group) => [group.id, group.sessions.map((session) => session.sessionId)]),
    ).toEqual([
      ["spark", ["recent", "old"]],
      [null, ["general"]],
    ]);
    expect(
      sidebarGroups(data, "archived")
        .flatMap((group) => group.sessions)
        .map((session) => session.sessionId),
    ).toContain("archived");
  });
  it("keeps a selected older conversation visible beside the five recent ones", () => {
    const sessions = Array.from({ length: 12 }, (_, index) => sidebarSession(`session-${index}`));
    expect(
      visibleSidebarSessions(sessions, false, "session-9").map((session) => session.sessionId),
    ).toEqual(["session-0", "session-1", "session-2", "session-3", "session-4", "session-9"]);
    expect(visibleSidebarSessions(sessions, true)).toEqual(sessions);
  });
});
