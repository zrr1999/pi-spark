import type { SparkLocalRpcOutput } from "@zendev-lab/spark-protocol/local-rpc-orpc-contract";
import {
  channelSessionPresentation,
  sessionHasChannelBinding,
} from "@zendev-lab/spark-ui/channel-session";
import type { SparkSessionProjection } from "@zendev-lab/spark-protocol";
import {
  isWorkspaceAdministrator,
  sessionWorkspaceId,
  type SparkWebWorkspace,
} from "./daemon-surface";

export type SidebarSession = Pick<
  SparkSessionProjection,
  | "sessionId"
  | "name"
  | "scope"
  | "lineage"
  | "roleBinding"
  | "placement"
  | "activity"
  | "updatedAt"
  | "bindings"
>;
export type SidebarData = {
  channelAdapters?: SparkLocalRpcOutput<"channel.status">["adapters"];
  workspaces: SparkWebWorkspace[];
  sessions: SidebarSession[];
  unavailable: boolean;
};

export function sidebarChannels(data: SidebarData, selectedSessionId?: string) {
  return data.sessions
    .filter(
      (session) =>
        sessionHasChannelBinding(session) &&
        (session.placement !== "archived" || session.sessionId === selectedSessionId),
    )
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function sidebarGroups(data: SidebarData, selectedSessionId: string | undefined) {
  const groups = new Map<
    string | null,
    { id: string | null; name: string; sessions: SidebarSession[] }
  >(
    data.workspaces.map((workspace) => [
      workspace.id,
      { id: workspace.id, name: workspace.displayName, sessions: [] },
    ]),
  );
  for (const session of data.sessions.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    if (
      isWorkspaceAdministrator(session) ||
      sessionHasChannelBinding(session) ||
      (session.placement === "archived" && session.sessionId !== selectedSessionId)
    )
      continue;
    const id = sessionWorkspaceId(session);
    let group = groups.get(id);
    if (!group) {
      group = { id, name: id ?? "", sessions: [] };
      groups.set(id, group);
    }
    group.sessions.push(session);
  }
  return [...groups.values()].sort(
    (a, b) =>
      (b.sessions[0]?.updatedAt ?? "").localeCompare(a.sessions[0]?.updatedAt ?? "") ||
      a.name.localeCompare(b.name),
  );
}

export function visibleSidebarSessions(
  sessions: SidebarSession[],
  expanded: boolean,
  selectedSessionId?: string,
) {
  if (expanded) return sessions;
  return sessions.filter((session, index) => index < 5 || session.sessionId === selectedSessionId);
}

export function sidebarBotProfile(session: SidebarSession, data: SidebarData) {
  const binding = session.bindings?.find((entry) => entry.kind === "channel");
  const type =
    binding?.adapter ?? channelSessionPresentation(session, { fallback: "" }).channel?.adapter;
  let accounts = (data.channelAdapters ?? []).filter((adapter) => adapter.type === type);
  if (binding?.adapterAccountIdentity)
    accounts = accounts.filter(
      (adapter) => adapter.adapterAccountIdentity === binding.adapterAccountIdentity,
    );
  else if (binding?.adapterId)
    accounts = accounts.filter((adapter) => adapter.id === binding.adapterId);
  return accounts.length === 1 ? accounts[0]?.botProfile : undefined;
}
