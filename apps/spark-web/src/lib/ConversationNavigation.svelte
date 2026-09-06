<script lang="ts">
  import { Icon } from "@zendev-lab/spark-ui";
  import { sidebarGroups, visibleSidebarSessions, type SidebarData } from "./sidebar";
  import type { getDictionary } from "./i18n";

  let { data, pathname, messages, closeNavigation, retry }: {
    data: SidebarData;
    pathname: string;
    messages: ReturnType<typeof getDictionary>;
    closeNavigation: () => void;
    retry: () => void;
  } = $props();
  const copy = $derived(messages.web.shell);
  const selectedSessionId = $derived(pathname.startsWith("/sessions/") ? decodeURIComponent(pathname.slice("/sessions/".length)) : undefined);
  const groups = $derived(sidebarGroups(data, selectedSessionId));
  let collapsed = $state<(string | null)[]>([]);
  let expanded = $state<(string | null)[]>([]);
</script>

<nav class="conversation-navigation" aria-label={copy.primaryNavigation}>
  <div class="navigation-top">
    <a class="nav-link new-conversation" href="/" aria-current={pathname === "/" ? "page" : undefined} onclick={closeNavigation}>
      <Icon name="new-message" size={18} /><span>{copy.overview}</span>
    </a>
  </div>
  <div class="navigation-scroll">
    <a class="nav-link all-sessions" href="/sessions" aria-current={pathname === "/sessions" ? "page" : undefined} onclick={closeNavigation}>
      <Icon name="message" size={17} /><span>{messages.web.home.allSessions}</span>
    </a>
    {#if data.unavailable}
      <div class="navigation-empty" role="status">
        <p>{copy.navigationUnavailable}</p>
        <button class="text-action" type="button" onclick={retry}>{copy.retryNavigation}</button>
      </div>
    {:else if groups.length === 0}
      <p class="navigation-empty">{messages.web.home.noSessions}</p>
    {:else}
      {#each groups as group (group.id)}
        {@const isCollapsed = collapsed.includes(group.id)}
        {@const isExpanded = expanded.includes(group.id)}
        {@const groupName = group.id === null ? messages.web.home.generalContext : group.name}
        {@const visible = visibleSidebarSessions(group.sessions, isExpanded, selectedSessionId)}
        <section class="workspace-group" aria-label={groupName}>
          <div class="group-heading">
            <button class="group-toggle" type="button" aria-label={groupName} aria-expanded={!isCollapsed} onclick={() => collapsed = isCollapsed ? collapsed.filter((id) => id !== group.id) : [...collapsed, group.id]}>
              <Icon name={isCollapsed ? "chevron" : "chevron-down"} size={14} />
            </button>
            {#if group.id !== null}
              <a href="/workspaces/{encodeURIComponent(group.id)}" class="workspace-link" aria-current={pathname === `/workspaces/${encodeURIComponent(group.id)}` ? "page" : undefined} onclick={closeNavigation} title={groupName}>
                <Icon name="folder" size={17} /><span>{groupName}</span>
              </a>
            {:else}
              <span class="workspace-link"><Icon name="message" size={17} /><span>{groupName}</span></span>
            {/if}
          </div>
          {#if !isCollapsed}
            <ul>
              {#each visible as session (session.sessionId)}
                <li>
                  <a class="session-link" href="/sessions/{encodeURIComponent(session.sessionId)}" aria-current={session.sessionId === selectedSessionId ? "page" : undefined} title={session.name || messages.web.home.sessionUntitled} onclick={closeNavigation}>
                    <span>{session.name || messages.web.home.sessionUntitled}</span>
                    {#if session.activity === "running" || session.activity === "queued"}
                      <span class="activity" class:running={session.activity === "running"} role="img" aria-label={messages.shared.status[session.activity] ?? session.activity}></span>
                    {/if}
                  </a>
                </li>
              {/each}
            </ul>
            {#if group.sessions.length > visible.length || isExpanded}
              <button class="text-action show-more" type="button" aria-expanded={isExpanded} onclick={() => expanded = isExpanded ? expanded.filter((id) => id !== group.id) : [...expanded, group.id]}>{isExpanded ? copy.showLessSessions : copy.showMoreSessions}</button>
            {/if}
          {/if}
        </section>
      {/each}
    {/if}
  </div>
  <div class="navigation-footer">
    <a class="nav-link" href="/settings" aria-current={pathname.startsWith("/settings") ? "page" : undefined} onclick={closeNavigation}>
      <Icon name="settings" size={18} /><span>{copy.settings}</span>
    </a>
  </div>
</nav>

<style>
  .conversation-navigation {
    box-sizing: border-box;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    height: 100%;
    min-height: 0;
    min-width: 0;
    padding: var(--spacing-sm) 0;
  }
  .navigation-top, .navigation-footer { padding: 0 var(--spacing-sm); }
  .navigation-top { padding-bottom: var(--spacing-sm); }
  .navigation-footer { border-top: 1px solid var(--color-border-soft); padding-top: var(--spacing-sm); }
  .navigation-scroll {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 0 var(--spacing-sm) var(--spacing-md);
    scrollbar-color: var(--color-border) transparent;
    scrollbar-width: thin;
  }
  a { color: inherit; text-decoration: none; }
  a, button { -webkit-tap-highlight-color: transparent; }
  .nav-link, .session-link, .workspace-link { align-items: center; display: flex; gap: var(--spacing-sm); min-width: 0; }
  .nav-link, .session-link { border-radius: var(--rounded-md); min-height: var(--control-height-default); padding: 0 var(--spacing-sm); }
  .nav-link { color: var(--color-ink-muted); font-size: var(--text-body); font-weight: var(--weight-body-medium); }
  .new-conversation { color: var(--color-ink); }
  .all-sessions { margin-bottom: var(--spacing-md); }
  .workspace-group + .workspace-group { margin-top: var(--spacing-lg); }
  .group-heading { align-items: center; display: flex; gap: 2px; margin-bottom: var(--spacing-xxs); }
  .group-toggle { align-items: center; background: transparent; border: 0; border-radius: var(--rounded-xs); color: var(--color-ink-subtle); cursor: pointer; display: flex; flex: 0 0 24px; height: 32px; justify-content: center; padding: 0; }
  .workspace-link { border-radius: var(--rounded-xs); color: var(--color-ink-muted); flex: 1; font-size: var(--text-body); min-height: 32px; }
  .workspace-link span, .session-link > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .workspace-link :global(svg), .nav-link :global(svg) { flex-shrink: 0; }
  ul { list-style: none; margin: 0; padding: 0; }
  .session-link { color: var(--color-ink-muted); font-size: var(--text-body); justify-content: space-between; padding-inline-start: 28px; }
  .session-link > span:first-child { min-width: 0; }
  a:hover, button:hover { background: var(--color-surface-soft); color: var(--color-ink); }
  a[aria-current="page"] { background: var(--color-primary-weak); color: var(--color-primary); }
  a:focus-visible, button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: -2px; }
  .text-action { background: transparent; border: 0; border-radius: var(--rounded-xs); color: var(--color-ink-subtle); cursor: pointer; font: inherit; font-size: var(--text-caption); min-height: 32px; padding: 0 var(--spacing-xs); text-align: start; }
  .show-more { margin-inline-start: 24px; }
  .navigation-empty { color: var(--color-ink-subtle); font-size: var(--text-caption); line-height: 1.6; margin: var(--spacing-sm); }
  .navigation-empty p { margin: 0; }
  .activity { border: 2px solid var(--color-border); border-radius: 50%; box-sizing: border-box; flex: 0 0 12px; height: 12px; }
  .activity.running { border-color: var(--color-primary-soft); border-top-color: var(--color-primary); animation: activity-spin 1s linear infinite; }
  @keyframes activity-spin { to { transform: rotate(360deg); } }
  @media (max-width: 900px) {
    .nav-link, .session-link, .workspace-link, .group-toggle, .text-action { min-height: var(--control-height-touch); }
    .group-toggle { flex-basis: 32px; }
    .session-link { padding-inline-start: 36px; }
  }
  @media (prefers-reduced-motion: reduce) { .activity.running { animation: none; } }
</style>
