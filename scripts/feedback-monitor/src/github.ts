// ═══════════════════════════════════════════════════════════════════
// MyShape Feedback Monitor — GitHub
// ═══════════════════════════════════════════════════════════════════
//
// Uses gh CLI (pre-authenticated) to fetch:
//  - Stars count (and delta)
//  - Recent issues/comments
//  - Repo activity

import { execSync } from "node:child_process";
import { GITHUB_REPOS } from "./config";

export interface GitHubEvent {
  repo: string;
  type: "star" | "issue" | "pr" | "fork" | "comment" | "discussion" | "discussion_comment";
  title: string;
  url: string;
  author: string;
  created_at: string;
}

export interface GitHubStats {
  repo: string;
  stars: number;
  forks: number;
  openIssues: number;
}

/** Fetch current repo stats */
export function getRepoStats(owner: string, repo: string): GitHubStats | null {
  try {
    const raw = execSync(`gh api repos/${owner}/${repo}`, {
      encoding: "utf8",
      timeout: 10000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const data = JSON.parse(raw) as {
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
    };
    return {
      repo: `${owner}/${repo}`,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
    console.warn(`[github] ⚠ ${owner}/${repo} unreachable — ${msg.slice(0, 80)}`);
    return null;
  }
}

interface GhEvent {
  type: string;
  actor: { login: string };
  created_at: string;
  payload: {
    action?: string;
    issue?: { title: string; html_url: string };
    pull_request?: { title: string; html_url: string };
    comment?: { html_url: string; text?: string };
    discussion?: { title: string; html_url: string };
  };
}

/** Fetch recent events (issues, comments, stars) */
export function getRecentEvents(owner: string, repo: string): GitHubEvent[] {
  try {
    const raw = execSync(
      `gh api repos/${owner}/${repo}/events --paginate`,
      { encoding: "utf8", timeout: 15000, maxBuffer: 2 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
    );

    const allEvents = JSON.parse(raw) as GhEvent[];
    const relevant = allEvents.filter((e) =>
      ["IssuesEvent", "IssueCommentEvent", "WatchEvent", "ForkEvent", "PullRequestEvent", "DiscussionEvent", "DiscussionCommentEvent"].includes(e.type)
    );

    return relevant.slice(0, 20).map((e) => {
      const title = e.payload.issue?.title || e.payload.pull_request?.title || e.payload.discussion?.title || "";
      const url = e.payload.issue?.html_url || e.payload.comment?.html_url || e.payload.pull_request?.html_url || e.payload.discussion?.html_url || "";

      return {
        repo: `${owner}/${repo}`,
        type: mapEventType(e.type),
        title,
        url: url || `https://github.com/${owner}/${repo}`,
        author: e.actor?.login || "unknown",
        created_at: e.created_at,
      };
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
    console.warn(`[github] ⚠ events ${owner}/${repo} unreachable — ${msg.slice(0, 80)}`);
    return [];
  }
}

function mapEventType(t: string): GitHubEvent["type"] {
  if (t === "WatchEvent") return "star";
  if (t === "IssuesEvent") return "issue";
  if (t === "IssueCommentEvent") return "comment";
  if (t === "ForkEvent") return "fork";
  if (t === "PullRequestEvent") return "pr";
  if (t === "DiscussionEvent") return "discussion";
  if (t === "DiscussionCommentEvent") return "discussion_comment";
  return "issue";
}

export function getAllEvents(): { stats: GitHubStats[]; events: GitHubEvent[] } {
  const stats: GitHubStats[] = [];
  const events: GitHubEvent[] = [];

  for (const { owner, repo } of GITHUB_REPOS) {
    const s = getRepoStats(owner, repo);
    if (s) stats.push({ ...s, repo: `${owner}/${repo}` });

    const evts = getRecentEvents(owner, repo);
    events.push(...evts);
  }

  console.log(`[github] ${stats.length} repo(s), ${events.length} event(s)`);
  return { stats, events };
}
