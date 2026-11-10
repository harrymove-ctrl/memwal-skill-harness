import { useMemo, useState } from "react";
import { AgentBrandLogo } from "../components/ui/walrus-3d-icons";
import { type ActivityEvent, summarize } from "../hooks/activity";
import { useActivity } from "../hooks/useActivity";
import { useNow } from "../hooks/useNow";
import { Card, Notice } from "../parts";
import { useCopied } from "../parts/IdPill";
import { failureStatus, StateFrame } from "../parts/StateFrame";
import { Button } from "../shell/Button";
import { agoLabel } from "../shell/copy";
import { AGENTS, type AgentId, buildRecallInstruction, buildSetup, KEY_PLACEHOLDER } from "./agentSetup";
import "./places.css";

export interface AgentsPlaceProps {
  namespace: string;
  accountId: string;
  serverUrl: string;
  origin: string;
}

/** Who last used this agent, from its newest recall. Older log lines may not say. */
function lastMember(events: ActivityEvent[], agentLabel: string): string | undefined {
  return events.find((event) => event.kind === "recall" && event.actor === agentLabel)?.member;
}

function CopyBlock({ text, label, primary, testId }: { text: string; label: string; primary?: boolean; testId: string }) {
  const [copied, copy] = useCopied();
  const [failed, setFailed] = useState(false);
  return (
    <div className="cc-setup">
      <pre className="cc-setup__code" tabIndex={0} aria-label={label} data-testid={`${testId}-code`}>
        <code>{text}</code>
      </pre>
      <div className="cc-actions" style={{ alignItems: "center" }}>
        <Button
          variant={primary ? "primary" : "secondary"}
          data-testid={testId}
          onClick={async () => setFailed(!(await copy(text)))}
        >
          {copied ? "Copied" : label}
        </Button>
        {failed && <span className="cc-meta">Your browser blocked copying. Select the text above instead.</span>}
      </div>
    </div>
  );
}

export function AgentsPlace({ namespace, accountId, serverUrl, origin }: AgentsPlaceProps) {
  const [selected, setSelected] = useState<AgentId>("claude-code");
  const activity = useActivity(namespace);
  const now = useNow();
  const summary = useMemo(() => summarize(activity.events, now), [activity.events, now]);
  const agent = AGENTS.find((item) => item.id === selected) ?? AGENTS[0]!;
  const connected = summary.agents.find((item) => item.name === agent.label);
  const setup = useMemo(
    () => buildSetup({ agent: selected, accountId, namespace, serverUrl, origin }),
    [selected, accountId, namespace, serverUrl, origin]
  );

  let statusText = "Checking for recalls";
  let statusDot: "active" | "idle" | "offline" = "offline";
  if (activity.status === "error") statusText = "Could not check for recalls";
  else if (activity.status === "ready") {
    if (connected) {
      const from = connected.skillId ? ` from ${connected.skillId}` : "";
      statusText = `Connected, last recall ${agoLabel(connected.lastAt, now)}${from}`;
      statusDot = connected.status;
    } else {
      statusText = "Waiting for first recall";
    }
  }

  return (
    <div className="cc-place" data-testid="agents-view">
      <div className="cc-agent-tiles" role="group" aria-label="Choose your agent">
        {AGENTS.map((item) => {
          const isConnected = summary.agents.some((row) => row.name === item.label);
          return (
            <button
              key={item.id}
              type="button"
              className="cc-agent-tile"
              aria-pressed={item.id === selected}
              data-testid={`agent-tile-${item.id}`}
              onClick={() => setSelected(item.id)}
            >
              <AgentBrandLogo agent={item.id} size={26} />
              <span className="cc-agent-tile__name">{item.label}</span>
              {isConnected && <span className="cc-meta">Connected</span>}
            </button>
          );
        })}
      </div>

      <Card
        title={`Set up ${agent.label}`}
        meta={
          <span className="cc-setup__status" data-testid="agent-status">
            <span className="cc-dot" data-status={statusDot} aria-hidden />
            {statusText}
          </span>
        }
        testId="agent-setup"
      >
        <p className="cc-setup__step">1. {agent.where}.</p>
        <CopyBlock text={setup} label="Copy setup" primary testId="copy-setup" />
        {setup.includes(KEY_PLACEHOLDER) && (
          <p className="cc-meta" style={{ margin: "8px 0 0" }}>
            Replace {KEY_PLACEHOLDER} with your own key. It stays on your machine and never goes in this app.
          </p>
        )}
        {selected === "claude-code" && (
          <p className="cc-meta" style={{ margin: "8px 0 0" }}>
            Set MEMWAL_PRIVATE_KEY in your shell first. It stays on your machine and never goes in this app.
          </p>
        )}
        <p className="cc-setup__step" style={{ marginTop: 16 }}>
          {selected === "tatum-ai"
            ? "2. Paste this prompt into Tatum AI Builder (dashboard.tatum.io/ai-builder) to run a live recall and code check."
            : "2. Add this to your agent's instructions, so its recalls show up in Live."}
        </p>
        <CopyBlock
          text={buildRecallInstruction(selected, namespace, origin, accountId)}
          label={selected === "tatum-ai" ? "Copy AI Builder prompt" : "Copy instructions"}
          testId="copy-instructions"
        />
        {selected === "tatum-ai" && (
          <p className="cc-meta" style={{ margin: "8px 0 0" }}>
            Open{" "}
            <a
              href="https://dashboard.tatum.io/ai-builder"
              target="_blank"
              rel="noreferrer"
              className="cc-link"
            >
              dashboard.tatum.io/ai-builder
            </a>{" "}
            and paste the prompt above. Each run logs its recall directly to Live.
          </p>
        )}
      </Card>

      <Card title="Connected agents" testId="agents-connected">
        <StateFrame
          status={
            activity.status === "loading"
              ? "loading"
              : activity.status === "error"
                ? failureStatus()
                : summary.agents.length
                  ? "ready"
                  : "empty"
          }
          onRetry={activity.refresh}
          errorText="Recent recalls did not load. Your agents are unaffected."
          empty={<p style={{ margin: 0, color: "var(--cc-ink-2)" }}>No agent has reported a recall yet.</p>}
        >
          {activity.stale && (
            <div style={{ marginBottom: 8 }}>
              <Notice tone="warn" onRetry={activity.refresh}>The latest recalls did not load. This list may be out of date.</Notice>
            </div>
          )}
          <div className="cc-divided">
            {summary.agents.map((row) => {
              const member = lastMember(activity.events, row.name);
              return (
                <div key={row.name} className="cc-agent" data-testid="connected-agent">
                  <AgentBrandLogo agent={row.name} size={26} />
                  <div className="cc-agent__text">
                    <div style={{ fontWeight: 600 }}>{row.name}</div>
                    <div className="cc-meta">
                      {member ? `${member}, ` : ""}last seen {agoLabel(row.lastAt, now)}
                    </div>
                  </div>
                  <span className="cc-dot" data-status={row.status} aria-hidden />
                </div>
              );
            })}
          </div>
        </StateFrame>
      </Card>
    </div>
  );
}
