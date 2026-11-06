import type { ActivityEvent, LiveSummary } from "../hooks/activity";
import { ActivityRow, Card, Notice } from "../parts";
import { agoLabel, plural } from "../shell/copy";
import "./places.css";

function changeLine(summary: LiveSummary): string {
  const skills = summary.skillsToday > 0 ? `across ${plural(summary.skillsToday, "skill")}` : "";
  const direction =
    summary.today > summary.yesterday ? "up from" : summary.today < summary.yesterday ? "down from" : "same as";
  const compare = `${direction} ${summary.yesterday.toLocaleString("en-US")} yesterday`;
  return skills ? `${skills}, ${compare}` : compare;
}

function agentLine(agent: LiveSummary["agents"][number], now: number): string {
  if (agent.status === "active") return agent.skillId ? `Recalling ${agent.skillId}` : "Recalling rules";
  if (agent.status === "idle") return `Idle, last recall ${agoLabel(agent.lastAt, now)}`;
  return `Offline, last recall ${agoLabel(agent.lastAt, now)}`;
}

function hourLabel(hoursAgo: number): string {
  if (hoursAgo === 0) return "this hour";
  return hoursAgo === 1 ? "1 hour ago" : `${hoursAgo} hours ago`;
}

function RecallBars({ hours }: { hours: number[] }) {
  const peak = Math.max(1, ...hours);
  return (
    <figure style={{ margin: 0 }}>
      <div className="cc-bars" aria-hidden data-testid="live-bars">
        {hours.map((count, index) => {
          const label = `${plural(count, "recall")}, ${hourLabel(hours.length - 1 - index)}`;
          return (
            <div key={index} className="cc-bars__col" data-tip={label} data-testid="live-bar">
              <div
                className="cc-bars__bar"
                data-empty={count === 0 || undefined}
                style={{ height: count === 0 ? 2 : `${Math.max(6, (count / peak) * 100)}%` }}
              />
            </div>
          );
        })}
      </div>
      <figcaption className="cc-bars__axis cc-meta" aria-hidden>
        <span>12 hours ago</span>
        <span>Now</span>
      </figcaption>
      <table className="cc-visually-hidden">
        <caption>Recalls per hour for the last 12 hours</caption>
        <tbody>
          {hours.map((count, index) => (
            <tr key={index}>
              <th scope="row">{hourLabel(hours.length - 1 - index)}</th>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export interface LiveProps {
  events: ActivityEvent[];
  summary: LiveSummary;
  stale: boolean;
  onRetry: () => void;
  onReopenChecklist?: () => void;
  now: number;
}

/** The Home view once a teammate and an agent are at work. */
export function Live({ events, summary, stale, onRetry, onReopenChecklist, now }: LiveProps) {
  const active = summary.activeCount;
  return (
    <div className="cc-place" data-testid="live-view">
      <div className="cc-place__intro">
        <span>What your agents are doing with the team's rules</span>
        <span className="cc-livepill" data-quiet={active === 0 || undefined} data-testid="live-pill">
          <span className="cc-dot" data-status={active > 0 ? "active" : "offline"} aria-hidden />
          {active > 0 ? `${plural(active, "agent")} active` : "No agent active"}
        </span>
      </div>

      {onReopenChecklist && (
        <div className="cc-activated" data-testid="activated-line">
          Activated.
          <button type="button" className="cc-textbtn" onClick={onReopenChecklist} data-testid="reopen-checklist">
            Show the checklist
          </button>
        </div>
      )}

      {stale && (
        <Notice tone="warn" onRetry={onRetry} testId="live-stale">
          The latest activity did not load. These numbers may be out of date.
        </Notice>
      )}

      <div className="cc-place__split">
        <Card title="Rule recalls today" testId="live-metric">
          <p className="cc-metric" data-testid="live-count">
            {summary.today.toLocaleString("en-US")}
          </p>
          <div className="cc-meta">{changeLine(summary)}</div>
          <RecallBars hours={summary.hours} />
        </Card>

        <Card title="Agents now" testId="live-agents">
          <div className="cc-divided">
            {summary.agents.map((agent) => (
              <div key={agent.name} className="cc-agent" data-testid="live-agent">
                <div className="cc-agent__text">
                  <div style={{ fontWeight: 600 }}>{agent.name}</div>
                  <div className="cc-meta">{agentLine(agent, now)}</div>
                </div>
                <span className="cc-dot" data-status={agent.status} aria-hidden />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Stream" testId="live-stream">
        <div className="cc-divided">
          {events.slice(0, 30).map((event) => (
            <ActivityRow key={event.id} event={event} now={now} />
          ))}
        </div>
      </Card>
    </div>
  );
}
