import { BookOpen, Database, ShieldCheck } from "lucide-react";
import { FullscreenShaderBackground } from "../components/react-bits/fullscreen-shader-background";
import { Card, Notice, VerdictCard } from "../parts";
import { LogoMark, PRODUCT_NAME } from "../shell/Logo";
import { Button } from "../shell/Button";
import "../shell/shell.css";
import "./places.css";

export interface LandingPlaceProps {
  onTryDemo: () => void;
  onSignIn: () => void;
  onShowProof: () => void;
  /** Set when someone arrived on an invite link. */
  invitedTo?: string | null;
  inviteError?: string | null;
  isDark?: boolean;
}

const VALUES = [
  { icon: BookOpen, title: "Team rules in Walrus Memory", text: "Teach a rule once, and every teammate's agent recalls it." },
  { icon: Database, title: "Skills on Walrus Console", text: "Your SKILL.md files live in one shared place, with history." },
  { icon: ShieldCheck, title: "Access checked on Sui", text: "Members are read from the chain through the Tatum Sui RPC." },
] as const;

export function LandingPlace({ onTryDemo, onSignIn, onShowProof, invitedTo, inviteError, isDark }: LandingPlaceProps) {
  const resolvedDark =
    isDark ?? (typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : true);

  return (
    <main className="cc-landing" data-testid="landing-view">
      <FullscreenShaderBackground isDark={resolvedDark} place="landing" />
      <header className="cc-landing__bar">
        <LogoMark size={32} className="cc-brand__mark" glint />
        <span className="cc-landing__name">{PRODUCT_NAME}</span>
      </header>

      {inviteError && <Notice tone="danger" testId="invite-error">{inviteError}</Notice>}
      {invitedTo && !inviteError && (
        <Notice tone="info" testId="invite-banner">
          You are invited to {invitedTo}. Sign in with your wallet to join.
        </Notice>
      )}

      <section className="cc-landing__hero">
        <div className="cc-landing__copy">
          <h1 className="cc-landing__title">Teach your agents once. Every teammate's IDE remembers it.</h1>
          <p className="cc-landing__lead">
            A shared playbook for coding agents, stored on Walrus. Change a rule, and the next agent that recalls it works differently.
          </p>
          <div className="cc-actions" style={{ alignItems: "center" }}>
            <Button variant="primary" onClick={onTryDemo} data-testid="landing-demo">Try the demo</Button>
            <Button onClick={onSignIn} data-testid="landing-signin">Sign in</Button>
            <button type="button" className="cc-textbtn" onClick={onShowProof} data-testid="landing-proof">
              See the proof on mainnet
            </button>
          </div>
        </div>
        <VerdictCard
          title="Before and after"
          check={{
            skillName: "Example",
            task: "reviewing a change to an app you shut down",
            without: "Runs every check, then approves it",
            withRules: "Closes it and skips the checks",
            ruleText: "Skip demo apps we shut down, and close their pull requests.",
            writtenExample: true,
          }}
        />
      </section>

      <section className="cc-landing__values" aria-label="How it works">
        {VALUES.map(({ icon: Icon, title, text }) => (
          <Card key={title}>
            <Icon size={20} strokeWidth={1.75} className="cc-landing__icon" aria-hidden />
            <h2 className="cc-card__title" style={{ margin: "8px 0 4px" }}>{title}</h2>
            <p style={{ margin: 0, color: "var(--cc-ink-2)" }}>{text}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
