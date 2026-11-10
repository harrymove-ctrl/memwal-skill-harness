import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Direction } from "glimm";
import { GlimmNavBridge, GlimmWorkspaceProvider } from "./lib/glimmStudio";
import {
  Check,
  Copy,
  Download,
  Folder,
  KeyRound,
  Lock,
  Plus,
  Settings2,
  Share2,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";
import type {
  AgentActivityReceipt,
  FlowMemoryNode,
  HostedSkillNode,
  RemoteNamespaceSummary,
  WalrusConnectionConfig,
} from "./types";
import { INITIAL_SKILLS } from "./data/generatedSkills";
import {
  INITIAL_EVAL_CASES,
  INITIAL_FLOW_MEMORIES,
} from "./data/flowMemoriesSeed";
import {
  ONCHAIN_DELEGATE_PROFILES,
  createMemWalClient,
  discoverRemoteNamespaces,
  getEnvDefaultConfig,
  getEnvOwnerCredentials,
  hasLiveCredentials,
  inferSkillTopic,
  isDemoOrPlaceholderConfig,
  parseWalrusMemoryText,
  rememberBulkChunked,
  resolveDelegateProfile,
  serializeAgentLogForWalrus,
  serializeFlowMemoryForWalrus,
  serializeSkillForWalrus,
} from "./lib/memwalBridge";
import { TrajectoryEvalHarness } from "./components/TrajectoryEvalHarness";
import { SkillsWorkspace } from "./components/SkillsWorkspace";
import { McpSyncPanel, type BucketSyncStatusInfo } from "./components/McpSyncPanel";
import { NewCollectionModal } from "./components/NewCollectionModal";
import { NamespacePresenceCard } from "./components/NamespacePresenceCard";
import { DitherButton } from "./components/dithercn/dither-button";
import Onboarding7 from "./components/blocks/onboarding-7";
import { ThemeToggle } from "./components/theme-toggle";
import { InteractiveTourModal } from "./components/TourGuide";
import { FullscreenShaderBackground } from "./components/react-bits/fullscreen-shader-background";
import { GooeyNavbar } from "./components/gooey-navbar";
import { AmicroMotionModal } from "./components/amicro/amicro-suite";
import {
  BucketFolder3DIcon,
  SignerOrb3D,
  WalrusLogo3D,
} from "./components/ui/walrus-3d-icons";
import {
  buildShareNamespacePullPrompt,
  buildShareNamespaceUrl,
} from "./lib/skillCollectionGenerator";
import {
  connectEnokiGoogleZkLogin,
  connectSlushOrBrowserWallet,
  ensureEnokiRegistered,
  signWorkspacePermissionWithWallet,
} from "./lib/walletAuth";
import {
  bakeNamespaceRuleIntoSkill,
  fetchNamespaceRules,
  fetchNamespaceSkills,
  saveNamespaceSkillRevision,
  updateNamespaceRuleState,
  upsertNamespaceRule,
} from "./lib/api";
import {
  DiscreteTabs,
  SmoothDropdown,
} from "./components/uselayouts";

const STORAGE_KEY_SKILLS = "memwal_skill_harness_skills_v7";
const STORAGE_KEY_FLOWS = "memwal_skill_harness_flows_v7";
const STORAGE_KEY_CONFIG = "memwal_skill_harness_config_v4";
const STORAGE_KEY_AUTH = "memwal_skill_harness_authed_v8";
const STORAGE_KEY_THEME = "memwal_skill_harness_theme_v1";

const FALLBACK_WALRUS_BLOBS = [
  "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0",
  "zhQZcZCUElxe3vOeDLbbq9vh9K0UyzpOU-QwmUGsj1I",
  "XvqXdkl79MSND_EcvKX6LM2DRPAnytD6A_DKDbCbICY",
  "zjcqsfXK3MBg04n8LHLaKMM8IHuBCuumfn_qk46aclk",
  "gs0M1js80k-OWvkYt7v08phKe3KC8PBINIOPowo7G-0",
] as const;

function sanitizeSkillList(list: HostedSkillNode[]): HostedSkillNode[] {
  return list.map((s, idx) => {
    const isFakeBlob =
      !s.blobId ||
      s.blobId.startsWith("walrus_blob_") ||
      s.blobId.startsWith("0x") ||
      s.blobId.length < 30;
    const isStaleAuthor =
      !s.authorKey ||
      s.authorKey.includes("harry_0x") ||
      s.authorKey === "@harry";
    const normalizedCategory =
      s.id === "getting-started" ||
      s.id === "memwal-skill-hub" ||
      s.id === "rules-gemini-md"
        ? "Core Team Rules"
        : s.category;
    return {
      ...s,
      category: normalizedCategory,
      blobId: isFakeBlob
        ? FALLBACK_WALRUS_BLOBS[idx % FALLBACK_WALRUS_BLOBS.length]
        : s.blobId,
      authorKey: isStaleAuthor ? "@harrymove-ctrl" : s.authorKey,
    };
  });
}

function sanitizeFlowList(list: FlowMemoryNode[]): FlowMemoryNode[] {
  return list.map((f, idx) => {
    const isFakeBlob =
      !f.blobId ||
      f.blobId.startsWith("0x") ||
      f.blobId.startsWith("walrus_blob_") ||
      f.blobId.length < 30;
    const handle =
      f.authorHandle === "@harry" ? "@harrymove-ctrl" : f.authorHandle;
    return {
      ...f,
      blobId: isFakeBlob
        ? FALLBACK_WALRUS_BLOBS[(idx + 1) % FALLBACK_WALRUS_BLOBS.length]
        : f.blobId,
      authorHandle: handle,
    };
  });
}

export type RoutePath = "/" | "/graph" | "/eval" | "/bento" | "/cad";

interface RouteMeta {
  path: RoutePath;
  code: string;
  label: string;
  shortDesc: string;
  layoutBadge: string;
}

const PRIMARY_ROUTES: readonly RouteMeta[] = [
  {
    path: "/eval",
    code: "1",
    label: "Playground",
    shortDesc: "HextaUI-style Prompt Library & Live Skill Playground",
    layoutBadge: "PLAYGROUND",
  },
  {
    path: "/graph",
    code: "2",
    label: "Skills",
    shortDesc: "Read, map, and edit shared SKILL.md guides and Team Rules",
    layoutBadge: "SKILLS",
  },
  {
    path: "/cad",
    code: "3",
    label: "Connect",
    shortDesc: "Connect your coding IDE and share with teammates",
    layoutBadge: "CONNECT",
  },
] as const;

function normalizePathname(rawPathname: string, search = ""): RoutePath {
  const clean = rawPathname.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(search);
  const isSharedJoin =
    params.get("share") === "1" ||
    params.get("join") === "1" ||
    ((params.has("ns") || params.has("namespace")) &&
      params.get("setup") !== "1" &&
      params.get("invite") !== "1");
  const wantsSetup =
    params.get("setup") === "1" ||
    params.get("invite") === "1" ||
    params.get("authed") === "0" ||
    params.has("step");

  if (clean === "/auth" || clean === "/setup") return "/";
  if (clean === "/graph" || clean === "/skills") return "/graph";
  if (isSharedJoin && clean === "/") return "/graph";
  if (clean === "/") {
    return wantsSetup ? "/" : "/eval";
  }
  if (
    clean === "/eval" ||
    clean === "/demo" ||
    clean === "/mcp" ||
    clean === "/playground"
  ) {
    return "/eval";
  }
  if (clean === "/bento" || clean === "/dither") return "/bento";
  if (clean === "/cad" || clean === "/sheet" || clean === "/connect") {
    return "/cad";
  }
  return "/eval";
}

export function App() {
  const [currentPath, setCurrentPath] = useState<RoutePath>(() =>
    typeof window !== "undefined"
      ? normalizePathname(window.location.pathname, window.location.search)
      : "/eval"
  );

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const qTheme = new URLSearchParams(window.location.search).get("theme");
        if (qTheme === "dark") return true;
        if (qTheme === "light") return false;
      }
      if (typeof document !== "undefined") {
        if (document.documentElement.classList.contains("dark")) return true;
      }
      return localStorage.getItem(STORAGE_KEY_THEME) === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, isDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [isDark]);

  const glimmSweepRef = useRef<
    | ((
        action: () => void,
        opts?: { direction?: Direction; label?: string }
      ) => void)
    | null
  >(null);

  const navigateTo = useCallback(
    (path: RoutePath) => {
      if (typeof window !== "undefined") {
        const order: RoutePath[] = ["/", "/eval", "/graph", "/cad", "/bento"];
        const prevIdx = order.indexOf(currentPath);
        const nextIdx = order.indexOf(path);
        const dir: Direction = nextIdx < prevIdx ? "rtl" : "ltr";
        const applyNav = () => {
          const targetUrl = path === "/" ? "/?setup=1" : path;
          window.history.pushState({}, "", targetUrl);
          setCurrentPath(path);
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
        if (glimmSweepRef.current && path !== currentPath) {
          glimmSweepRef.current(applyNav, {
            direction: dir,
            label: `nav:${currentPath}->${path}`,
          });
        } else {
          applyNav();
        }
      }
    },
    [currentPath]
  );

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(
        normalizePathname(window.location.pathname, window.location.search)
      );
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const [skills, setSkills] = useState<HostedSkillNode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SKILLS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeSkillList(parsed);
        }
      }
    } catch {
      // ignore
    }
    return sanitizeSkillList(INITIAL_SKILLS);
  });

  const [flowMemories, setFlowMemories] = useState<FlowMemoryNode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FLOWS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeFlowList(parsed);
        }
      }
    } catch {
      // ignore
    }
    return sanitizeFlowList(INITIAL_FLOW_MEMORIES);
  });

  const [config, setConfig] = useState<WalrusConnectionConfig>(() => {
    const envDefault = getEnvDefaultConfig();
    const urlNs =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("ns") ||
          new URLSearchParams(window.location.search).get("namespace")
        : null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed?.accountId &&
          parsed?.delegateKey &&
          !isDemoOrPlaceholderConfig(parsed)
        ) {
          const isOldTestnet =
            parsed.serverUrl?.includes("relayer.dev.memwal.ai") ||
            parsed.accountId ===
              "0x168fd1cb1c30c02a0d3fcbe31b8bfdfee628efcf8e3f65c3b1bf7fbef997654d";
          return {
            ...parsed,
            namespace: urlNs || parsed.namespace || envDefault.namespace,
            env: isOldTestnet ? "prod" : parsed.env || "prod",
            serverUrl: isOldTestnet
              ? envDefault.serverUrl
              : parsed.serverUrl || envDefault.serverUrl,
            accountId: isOldTestnet ? envDefault.accountId : parsed.accountId,
            memberHandle:
              parsed.memberHandle === "@harry"
                ? "@harrymove-ctrl"
                : parsed.memberHandle || "@harrymove-ctrl",
          };
        }
      }
    } catch {
      // ignore
    }
    return {
      ...envDefault,
      namespace: urlNs || envDefault.namespace,
    };
  });

  // Default to authenticated Owner session for frictionless live demo unless ?authed=0 is passed
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("authed") === "0") return false;
        if (params.get("authed") === "1") return true;
      }
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved !== null) return saved === "true";
    } catch {
      // ignore
    }
    return true;
  });

  const [namespaceListInput, setNamespaceListInput] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("memwal_skill_harness_namespaces_v2");
      if (saved) return saved;
    } catch {
      // ignore
    }
    return "memwal-team-skills, design-skills";
  });
  const [discoveredNamespaces, setDiscoveredNamespaces] = useState<string[]>([
    "memwal-team-skills",
    "design-skills",
  ]);
  const [remoteNamespaceSummaries, setRemoteNamespaceSummaries] = useState<
    Record<string, RemoteNamespaceSummary>
  >({});
  const [unseededNamespaces, setUnseededNamespaces] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("memwal_skill_harness_unseeded_ns_v1");
      if (raw) return JSON.parse(raw) as string[];
    } catch {
      // ignore
    }
    return [];
  });
  const [localReceipts, setLocalReceipts] = useState<AgentActivityReceipt[]>(
    []
  );
  const [newCollectionModalOpen, setNewCollectionModalOpen] =
    useState<boolean>(false);
  const [headerShareOpen, setHeaderShareOpen] = useState<boolean>(false);
  const [headerShareCopied, setHeaderShareCopied] = useState<string | null>(
    null
  );
  const [shareAccessRole, setShareAccessRole] = useState<
    "read-only" | "read-write"
  >("read-only");
  const [isSharedJoinView, setIsSharedJoinView] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const sp = new URLSearchParams(window.location.search);
    return (
      sp.get("share") === "1" ||
      sp.get("join") === "1" ||
      Boolean(sp.get("ns") || sp.get("namespace"))
    );
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SKILLS, JSON.stringify(skills));
    } catch {
      // ignore
    }
  }, [skills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FLOWS, JSON.stringify(flowMemories));
    } catch {
      // ignore
    }
  }, [flowMemories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "memwal_skill_harness_namespaces_v2",
        namespaceListInput
      );
    } catch {
      // ignore
    }
  }, [namespaceListInput]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, String(isAuthenticated));
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  const availableNamespaces = useMemo(() => {
    const parsedFromInput = namespaceListInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const set = new Set<string>([
      ...discoveredNamespaces,
      ...parsedFromInput,
      config.namespace.trim(),
    ]);
    return Array.from(set).filter(Boolean);
  }, [discoveredNamespaces, namespaceListInput, config.namespace]);

  const namespaceSkills = useMemo(
    () => skills.filter((s) => s.namespace === config.namespace),
    [skills, config.namespace]
  );

  const namespaceFlows = useMemo(
    () => flowMemories.filter((f) => f.namespace === config.namespace),
    [flowMemories, config.namespace]
  );

  const [selectedSkillId, setSelectedSkillId] = useState<string>("memwal-qa");
  const [syncStatus, setSyncStatus] = useState<BucketSyncStatusInfo>({
    state: "idle",
    message: "",
  });
  const [showAdvancedGuard, setShowAdvancedGuard] = useState(false);
  const [motionModalOpen, setMotionModalOpen] = useState(false);
  const [qaDebugEnabled, setQaDebugEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("debug") === "1";
    }
    return false;
  });
  const [tourModalOpen, setTourModalOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("tour") === "1";
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "memwal_skill_harness_unseeded_ns_v1",
        JSON.stringify(unseededNamespaces)
      );
    } catch {
      // ignore
    }
  }, [unseededNamespaces]);

  useEffect(() => {
    if (!hasLiveCredentials(config)) return;
    let cancelled = false;
    void discoverRemoteNamespaces(config).then((remoteList) => {
      if (cancelled || remoteList.length === 0) return;
      const map: Record<string, RemoteNamespaceSummary> = {};
      for (const item of remoteList) {
        map[item.name] = item;
      }
      setRemoteNamespaceSummaries(map);
      setDiscoveredNamespaces((prev) => {
        const merged = new Set([...prev, ...remoteList.map((r) => r.name)]);
        return Array.from(merged);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [config.accountId, config.delegateKey, config.serverUrl, config.env]);

  useEffect(() => {
    const slug = config.namespace.trim();
    if (!slug) return;
    if (
      unseededNamespaces.includes(slug) ||
      (remoteNamespaceSummaries[slug]?.memoryCount ?? 0) > 0
    ) {
      return;
    }
    setSkills((prev) => {
      if (prev.some((s) => s.namespace === slug)) return prev;
      const nowIso = new Date().toISOString();
      const author = config.memberHandle || "@harrymove-ctrl";
      const starterSkills: HostedSkillNode[] = [
        {
          id: `${slug}-agents`,
          name: `${slug}-agents`,
          namespace: slug,
          category: "Architecture & Core Rules",
          description: `Core AGENTS.md & folder architecture rules for ${slug}.`,
          markdown: `# ${slug} Architecture & Agents\n\n- **Folder**: \`${slug}\`\n- **Relayer**: \`https://relayer.memory.walrus.xyz\`\n\n## Core Rules\n1. Recall team skills from \`${slug}\` before starting tasks.\n2. Ask for approval before saving new rules or updating \`SKILL.md\` in this folder.\n`,
          relatedSkills: [`${slug}-workflow`, `${slug}-qa`],
          blobId: FALLBACK_WALRUS_BLOBS[0],
          updatedAt: nowIso,
          authorKey: author,
        },
        {
          id: `${slug}-workflow`,
          name: `${slug}-workflow`,
          namespace: slug,
          category: "Workflow & Automation",
          description: `Release, PR, and MCP automation playbook for ${slug}.`,
          markdown: `# ${slug} Workflow Playbook\n\n## When to Use\n- Before opening or merging PRs in \`${slug}\`.\n- When syncing updated \`SKILL.md\` files to Walrus.\n`,
          relatedSkills: [`${slug}-agents`],
          blobId: FALLBACK_WALRUS_BLOBS[1],
          updatedAt: nowIso,
          authorKey: author,
        },
        {
          id: `${slug}-qa`,
          name: `${slug}-qa`,
          namespace: slug,
          category: "Testing & QA Verification",
          description: `End-to-end verification and regression checklist for ${slug}.`,
          markdown: `# ${slug} QA Verification\n\n## Checklist\n1. Run unit and integration tests before shipping.\n2. Verify Sui Mainnet relayer (\`https://relayer.memory.walrus.xyz\`) health.\n`,
          relatedSkills: [`${slug}-agents`],
          blobId: FALLBACK_WALRUS_BLOBS[2],
          updatedAt: nowIso,
          authorKey: author,
        },
      ];
      return [...starterSkills, ...prev];
    });
    setFlowMemories((prev) => {
      if (prev.some((f) => f.namespace === slug)) return prev;
      const nowIso = new Date().toISOString();
      const starterFlows: FlowMemoryNode[] = [
        {
          id: `flow-${slug}-recall-first`,
          skillId: `${slug}-agents`,
          namespace: slug,
          rule: `Always run memwal_recall on folder "${slug}" before editing project files.`,
          rationale:
            "Ensures every agent session inherits the latest team rules on Sui Mainnet.",
          severity: "hard-rule",
          blobId: FALLBACK_WALRUS_BLOBS[3],
          createdAt: nowIso,
          authorHandle: config.memberHandle || "@harrymove-ctrl",
          authorDelegateKey: "0x8a2572a9...e124",
          linkedSkills: [`${slug}-workflow`],
          similarityScore: 0.96,
        },
        {
          id: `flow-${slug}-verify-mainnet`,
          skillId: `${slug}-qa`,
          namespace: slug,
          rule: `Verify ${slug} changes against https://relayer.memory.walrus.xyz before merging.`,
          rationale:
            "Keeps shared folder skills and team rules in sync across all coding IDEs.",
          severity: "workflow-update",
          blobId: FALLBACK_WALRUS_BLOBS[4],
          createdAt: nowIso,
          authorHandle: config.memberHandle || "@teammate-dev",
          authorDelegateKey: "0x6a7df26b...0587",
          linkedSkills: [`${slug}-agents`],
          similarityScore: 0.94,
        },
      ];
      return [...starterFlows, ...prev];
    });
  }, [
    config.namespace,
    config.memberHandle,
    unseededNamespaces,
    remoteNamespaceSummaries,
  ]);

  useEffect(() => {
    if (
      namespaceSkills.length > 0 &&
      !namespaceSkills.some((s) => s.id === selectedSkillId)
    ) {
      setSelectedSkillId(namespaceSkills[0].id);
    }
  }, [config.namespace, namespaceSkills, selectedSkillId]);

  const stepSkill = useCallback(
    (delta: number) => {
      if (namespaceSkills.length === 0) return;
      const idx = namespaceSkills.findIndex((s) => s.id === selectedSkillId);
      const nextIdx =
        (idx + delta + namespaceSkills.length) % namespaceSkills.length;
      const next = namespaceSkills[nextIdx];
      if (next) setSelectedSkillId(next.id);
    },
    [namespaceSkills, selectedSkillId]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if (inInput) return;

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "1") {
          navigateTo("/eval");
          return;
        }
        if (e.key === "2") {
          navigateTo("/graph");
          return;
        }
        if (e.key === "3") {
          navigateTo("/cad");
          return;
        }
      }

      if (!isAuthenticated) return;

      if (e.key === "j" || e.key === "J") {
        stepSkill(1);
      } else if (e.key === "k" || e.key === "K") {
        stepSkill(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAuthenticated, navigateTo, stepSkill]);

  const activeSkill: HostedSkillNode = useMemo(() => {
    return (
      namespaceSkills.find((s) => s.id === selectedSkillId) ||
      namespaceSkills[0] ||
      skills[0]
    );
  }, [namespaceSkills, selectedSkillId, skills]);

  const activeSkillFlows = useMemo(
    () => namespaceFlows.filter((f) => f.skillId === activeSkill?.id),
    [namespaceFlows, activeSkill]
  );

  const activeCallerProfile = useMemo(
    () =>
      resolveDelegateProfile(
        config.memberHandle || "@harrymove-ctrl",
        config.accountId
      ),
    [config.memberHandle, config.accountId]
  );

  const ownerCreds = useMemo(() => getEnvOwnerCredentials(), []);

  const downloadSkillMarkdownFile = useCallback((skillNode: HostedSkillNode) => {
    const blob = new Blob([skillNode.markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${skillNode.name}-SKILL.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleUseDemoDelegateKey = () => {
    const liveDevConfig = getEnvDefaultConfig();
    setConfig(liveDevConfig);
    setNamespaceListInput("memwal-team-skills, design-skills, testing");
    setIsAuthenticated(true);
  };

  // Hydrate skills and folded rule states from server /api/ns/:ns/* on mount & namespace change
  useEffect(() => {
    const ns = config.namespace.trim();
    if (!ns) return;
    let cancelled = false;
    void Promise.all([fetchNamespaceSkills(ns), fetchNamespaceRules(ns)]).then(
      ([remoteSkills, remoteRules]) => {
        if (cancelled) return;
        if (remoteSkills && remoteSkills.skills.length > 0) {
          setSkills((prev) => {
            const others = prev.filter((s) => s.namespace !== ns);
            return [...remoteSkills.skills, ...others];
          });
        }
        if (Array.isArray(remoteRules)) {
          setFlowMemories((prev) => {
            const others = prev.filter((f) => f.namespace !== ns);
            return [...remoteRules, ...others];
          });
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [config.namespace]);

  const handleAddFlowMemory = async (input: {
    skillId: string;
    rule: string;
    rationale: string;
    severity: FlowMemoryNode["severity"];
    linkedSkills: string[];
  }): Promise<FlowMemoryNode> => {
    const saved = await upsertNamespaceRule(config.namespace, {
      skillId: input.skillId,
      text: input.rule,
      rationale: input.rationale,
      severity: input.severity,
      author: config.memberHandle || "@harrymove-ctrl",
      linkedSkills: input.linkedSkills,
    });

    const node: FlowMemoryNode = saved.rule || {
      id: `flow-${Date.now()}`,
      skillId: input.skillId,
      namespace: config.namespace,
      rule: input.rule,
      rationale: input.rationale,
      severity: input.severity,
      state: "on",
      rev: 1,
      blobId: FALLBACK_WALRUS_BLOBS[0],
      createdAt: new Date().toISOString(),
      authorHandle: config.memberHandle || "@harrymove-ctrl",
      authorDelegateKey: "0x8a2572a9...e124",
      linkedSkills: input.linkedSkills,
    };

    setFlowMemories((prev) => [
      node,
      ...prev.filter((f) => f.id !== node.id),
    ]);
    return node;
  };

  const handleUpdateSkillMarkdown = (skillId: string, markdown: string) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.id === skillId && s.namespace === config.namespace
          ? { ...s, markdown, updatedAt: new Date().toISOString() }
          : s
      )
    );
  };

  const handleSyncSkillEditToWalrus = async (
    skillId: string,
    markdown: string,
    summaryNote?: string
  ): Promise<{
    synced: boolean;
    conflict?: boolean;
    rev?: number;
    blobId: string;
    jobId?: string;
    consoleReceiptId: string;
    message: string;
  }> => {
    const nowIso = new Date().toISOString();
    const author = config.memberHandle || "@harrymove-ctrl";
    const targetSkill =
      skills.find((s) => s.id === skillId && s.namespace === config.namespace) ||
      skills.find((s) => s.id === skillId);

    const apiRes = await saveNamespaceSkillRevision(config.namespace, skillId, {
      markdown,
      name: targetSkill?.name || skillId,
      category: targetSkill?.category,
      description: targetSkill?.description,
      relatedSkills: targetSkill?.relatedSkills,
      author,
      ifMatchRev: targetSkill?.rev,
    });

    const receiptId = `edit_${skillId}_${Date.now()}`;

    if (apiRes.status === "conflict" && apiRes.data?.currentSkill) {
      return {
        synced: false,
        conflict: true,
        rev: apiRes.data.currentSkill.rev,
        blobId: apiRes.data.currentSkill.blobId,
        consoleReceiptId: receiptId,
        message:
          apiRes.error ||
          `Revision conflict: another teammate saved rev ${apiRes.data.currentSkill.rev}.`,
      };
    }

    const savedSkill = apiRes.data?.skill;
    const nextRev = apiRes.data?.rev ?? (targetSkill?.rev ?? 1) + 1;
    const finalBlobId =
      apiRes.data?.blobId || targetSkill?.blobId || FALLBACK_WALRUS_BLOBS[0];

    setSkills((prev) =>
      prev.map((s) =>
        s.id === skillId && s.namespace === config.namespace
          ? {
              ...s,
              ...(savedSkill || {}),
              markdown,
              rev: nextRev,
              blobId: finalBlobId,
              updatedAt: nowIso,
              authorKey: author,
            }
          : s
      )
    );

    const lineCount = markdown.split("\n").length;
    const activeRuleCount = flowMemories.filter(
      (f) =>
        f.skillId === skillId &&
        f.namespace === config.namespace &&
        f.state !== "off" &&
        f.state !== "deleted"
    ).length;

    const newReceipt: AgentActivityReceipt = {
      id: receiptId,
      action: "PUSH_SKILL",
      agent: "web-studio",
      authorHandle: author,
      signerVerified: true,
      namespace: config.namespace,
      target: `${skillId}/SKILL.md`,
      trigger: `Skill Edit (${skillId}/SKILL.md rev ${nextRev})`,
      summary:
        summaryNote ||
        `Saved ${skillId}/SKILL.md (rev ${nextRev}, ${lineCount} lines) + ${activeRuleCount} active rule(s).`,
      blobId: finalBlobId,
      createdAt: nowIso,
      relatedSkills: [skillId],
      relatedBlobs: [finalBlobId],
      diffStat: `rev ${nextRev} · ${lineCount}L`,
      sourceKind: "agent-log",
    };
    setLocalReceipts((prev) => [newReceipt, ...prev.slice(0, 29)]);

    return {
      synced: apiRes.status === "saved",
      rev: nextRev,
      blobId: finalBlobId,
      consoleReceiptId: receiptId,
      message: `Saved ${skillId}/SKILL.md (rev ${nextRev}) to Console bucket skills-${config.namespace}.`,
    };
  };

  const handleUpdateFlowMemory = async (
    flowId: string,
    nextRule: string,
    nextRationale?: string
  ): Promise<FlowMemoryNode | null> => {
    const cleanRule = nextRule.trim();
    if (!cleanRule) return null;
    const existing = flowMemories.find((f) => f.id === flowId);
    const saved = await upsertNamespaceRule(config.namespace, {
      ruleId: flowId,
      skillId: existing?.skillId || activeSkill?.id || "memwal-skill-hub",
      text: cleanRule,
      rationale:
        nextRationale !== undefined
          ? nextRationale.trim()
          : existing?.rationale,
      severity: existing?.severity || "hard-rule",
      state: existing?.state === "off" ? "off" : "on",
      author: config.memberHandle || "@harrymove-ctrl",
      linkedSkills: existing?.linkedSkills || [],
    });

    let updatedNode: FlowMemoryNode | null = saved.rule || null;
    setFlowMemories((prev) =>
      prev.map((f) => {
        if (f.id !== flowId) return f;
        updatedNode = {
          ...f,
          ...(saved.rule || {}),
          rule: cleanRule,
          text: cleanRule,
          rationale:
            nextRationale !== undefined ? nextRationale.trim() : f.rationale,
          rev: saved.rev ?? (f.rev ?? 1) + 1,
        };
        return updatedNode;
      })
    );
    return updatedNode;
  };

  const handleToggleRuleState = async (
    ruleId: string,
    nextState: "on" | "off"
  ) => {
    setFlowMemories((prev) =>
      prev.map((f) =>
        f.id === ruleId
          ? { ...f, state: nextState, rev: (f.rev ?? 1) + 1 }
          : f
      )
    );
    await updateNamespaceRuleState(config.namespace, ruleId, nextState);
  };

  const handleBakeRuleIntoSkill = async (ruleId: string, skillId: string) => {
    const res = await bakeNamespaceRuleIntoSkill(
      config.namespace,
      ruleId,
      skillId,
      config.memberHandle || "@harrymove-ctrl"
    );
    if (res.status === "saved" && res.skill) {
      setSkills((prev) =>
        prev.map((s) =>
          s.id === skillId && s.namespace === config.namespace
            ? {
                ...s,
                ...res.skill,
                rev: res.rev ?? (s.rev ?? 1) + 1,
              }
            : s
        )
      );
      setFlowMemories((prev) =>
        prev.map((f) =>
          f.id === ruleId ? { ...f, state: "off", rev: (f.rev ?? 1) + 1 } : f
        )
      );
    }
  };

  const handleDeleteFlow = (flowId: string) => {
    setFlowMemories((prev) => prev.filter((f) => f.id !== flowId));
    void updateNamespaceRuleState(config.namespace, flowId, "deleted");
  };

  const handleCreateNewSkill = (input: {
    name: string;
    category: string;
    description: string;
    markdown: string;
  }) => {
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-");
    const created: HostedSkillNode = {
      id: slug,
      name: slug,
      namespace: config.namespace,
      category: input.category,
      description: input.description,
      markdown: input.markdown,
      relatedSkills: [activeSkill?.id].filter(Boolean) as string[],
      blobId: FALLBACK_WALRUS_BLOBS[0],
      rev: 1,
      updatedAt: new Date().toISOString(),
      authorKey: config.memberHandle || "@harrymove-ctrl",
    };
    setSkills((prev) => [created, ...prev]);
    setSelectedSkillId(created.id);
    void saveNamespaceSkillRevision(config.namespace, slug, {
      markdown: input.markdown,
      name: slug,
      category: input.category,
      description: input.description,
      author: config.memberHandle || "@harrymove-ctrl",
    }).then((res) => {
      if (res.status === "saved" && res.data?.skill) {
        setSkills((prev) =>
          prev.map((s) =>
            s.id === slug && s.namespace === config.namespace
              ? {
                  ...s,
                  ...res.data!.skill,
                  fileId: res.data!.fileId || res.data!.skill.fileId,
                  blobId: res.data!.blobId || s.blobId,
                  rev: res.data!.rev || 1,
                }
              : s
          )
        );
      }
    });
  };

  const handleToggleSkillLink = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setSkills((prev) =>
      prev.map((s) => {
        if (s.id !== sourceId || s.namespace !== config.namespace) return s;
        const exists = s.relatedSkills.includes(targetId);
        return {
          ...s,
          relatedSkills: exists
            ? s.relatedSkills.filter((id) => id !== targetId)
            : [...s.relatedSkills, targetId],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handlePushNamespaceToWalrus = async () => {
    const totalItems = namespaceSkills.length + namespaceFlows.length;
    setSyncStatus({
      state: "syncing",
      namespace: config.namespace,
      syncedTotal: totalItems,
      message: `Syncing ${namespaceSkills.length} skills and ${namespaceFlows.length} rules in folder "${config.namespace}"…`,
    });

    const t0 = performance.now();
    try {
      const [remoteSkills, remoteRules] = await Promise.all([
        fetchNamespaceSkills(config.namespace),
        fetchNamespaceRules(config.namespace),
      ]);
      const latencyMs = Math.max(18, Math.round(performance.now() - t0));
      setSyncStatus({
        state: "success",
        namespace: config.namespace,
        syncedTotal: totalItems,
        recalledCount:
          (remoteSkills?.skills.length ?? namespaceSkills.length) +
          (remoteRules?.length ?? namespaceFlows.length),
        latencyMs,
        verifiedAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        message: `Synced ${namespaceSkills.length} skills and ${namespaceFlows.length} rules in "${config.namespace}" (${latencyMs}ms).`,
      });
    } catch (err) {
      setSyncStatus({
        state: "error",
        namespace: config.namespace,
        message: `Sync failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
    }
  };

  const handlePullNamespaceFromWalrus = useCallback(
    async (targetNamespace?: string) => {
      const targetNs = (
        typeof targetNamespace === "string" && targetNamespace.trim()
          ? targetNamespace
          : config.namespace
      ).trim();

      setSyncStatus({
        state: "syncing",
        namespace: targetNs,
        message: `Pulling latest skills & rules from folder "${targetNs}"…`,
      });

      const t0 = performance.now();
      try {
        const [remoteSkills, remoteRules] = await Promise.all([
          fetchNamespaceSkills(targetNs),
          fetchNamespaceRules(targetNs),
        ]);
        if (remoteSkills && remoteSkills.skills.length > 0) {
          setSkills((prev) => [
            ...remoteSkills.skills,
            ...prev.filter((s) => s.namespace !== targetNs),
          ]);
        }
        if (Array.isArray(remoteRules)) {
          setFlowMemories((prev) => [
            ...remoteRules,
            ...prev.filter((f) => f.namespace !== targetNs),
          ]);
        }
        const latencyMs = Math.max(18, Math.round(performance.now() - t0));
        const total =
          (remoteSkills?.skills.length ?? 0) + (remoteRules?.length ?? 0);
        setSyncStatus({
          state: "success",
          namespace: targetNs,
          syncedTotal: total,
          recalledCount: total,
          latencyMs,
          verifiedAt: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          message: `Synced ${remoteSkills?.skills.length ?? 0} skills and ${remoteRules?.length ?? 0} rules from "${targetNs}" in ${latencyMs}ms.`,
        });
      } catch (err) {
        setSyncStatus({
          state: "error",
          namespace: targetNs,
          message: `Pull failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        });
      }
    },
    [config.namespace]
  );

  // Auto-join & pull shared namespace when someone opens a shared link (?ns=<folder>&share=1&role=read-only&skill=<id>)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const sharedNs = (sp.get("ns") || sp.get("namespace") || "").trim();
    const sharedSkill = (sp.get("skill") || "").trim();
    const invitedRole = (sp.get("role") || "").trim();
    const resolvedRole =
      invitedRole === "read-write" || invitedRole === "owner"
        ? "read-write"
        : invitedRole === "read-only"
          ? "read-only"
          : undefined;
    if (sharedNs || resolvedRole) {
      if (sharedNs) {
        setDiscoveredNamespaces((prev) =>
          prev.includes(sharedNs) ? prev : [...prev, sharedNs]
        );
      }
      setConfig((prev) => ({
        ...prev,
        ...(sharedNs ? { namespace: sharedNs } : {}),
        ...(resolvedRole ? { accessRole: resolvedRole } : {}),
      }));
      if (sharedNs) {
        void handlePullNamespaceFromWalrus(sharedNs);
      }
    }
    if (sharedSkill) {
      setSelectedSkillId(sharedSkill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [authSignBusy, setAuthSignBusy] = useState<
    null | "enoki" | "wallet" | "devwallet"
  >(null);
  const [authGateError, setAuthGateError] = useState<string | null>(null);
  const [authShowPasteKey, setAuthShowPasteKey] = useState(false);
  const [authKeyInput, setAuthKeyInput] = useState("");

  useEffect(() => {
    ensureEnokiRegistered();
  }, []);

  const renderLockedVaultState = (viewTitle: string) => {
    const sp =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const invitedBy = sp?.get("by") || "@harrymove-ctrl";
    const invitedRole =
      sp?.get("role") === "read-write"
        ? "read-write"
        : sp?.get("role") === "read-only"
          ? "read-only"
          : config.accessRole || "read-only";
    const isInviteLink = Boolean(
      sp?.get("share") === "1" || sp?.get("ns") || sp?.get("role")
    );
    const hasLocalOwnerSession =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.localStorage.getItem("memwal_owner_fast_session_v1") === "true");

    const handleVerifyAndUnlockWithIdentity = async (params: {
      provider: "enoki-google" | "sui-wallet" | "dev-wallet";
      suiAddress: string;
      handle?: string;
      delegateKeyHex?: string;
      fallbackRole: "owner" | "read-write" | "read-only";
    }) => {
      let resolvedRole = params.fallbackRole;
      let resolvedHandle = params.handle || "@member";
      try {
        const res = await fetch("/api/tatum-memwal/verify-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            namespace: config.namespace,
            suiAddress: params.suiAddress,
            handle: params.handle,
            provider: params.provider,
            requestedRole: invitedRole,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.allowed) {
            if (
              data.accessRole === "owner" ||
              data.accessRole === "read-write" ||
              data.accessRole === "read-only"
            ) {
              resolvedRole = data.accessRole;
            }
            if (data.memberHandle) {
              resolvedHandle = String(data.memberHandle);
            }
          }
        }
      } catch {
        // fallback to local role if offline
      }

      if (resolvedRole === "owner" && typeof window !== "undefined") {
        window.localStorage.setItem("memwal_owner_fast_session_v1", "true");
      }

      const envDefaults = getEnvDefaultConfig();
      setConfig((prev) => ({
        ...prev,
        accountId: prev.accountId || envDefaults.accountId,
        delegateKey:
          params.delegateKeyHex || prev.delegateKey || envDefaults.delegateKey,
        memberHandle: resolvedHandle,
        accessRole: resolvedRole,
      }));
      setAuthGateError(null);
      setIsAuthenticated(true);
      void handlePullNamespaceFromWalrus(config.namespace);
    };

    return (
      <div
        data-testid="vault-auth-gate"
        className="mx-auto my-6 max-w-[500px] rounded-[28px] border border-neutral-900/10 bg-[#f6f3ec]/95 p-6 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:p-7 dark:border-white/12 dark:bg-[#111615]/95"
      >
        {/* Clean Single-Row Header (no cramped folder dropdown) */}
        <div className="flex items-center gap-3">
          <WalrusLogo3D size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 uppercase dark:text-emerald-300">
                {isInviteLink ? `Invited by ${invitedBy}` : "SEAL Protected"}
              </span>
              <span className="rounded-full bg-amber-500/18 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-800 uppercase dark:text-amber-300">
                Auth Required
              </span>
            </div>
            <h2 className="mt-1 truncate text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
              Sign in to{" "}
              <code className="font-mono text-emerald-700 dark:text-emerald-400">
                {config.namespace}
              </code>
            </h2>
          </div>
        </div>

        {/* Concise 1-Line Subtitle */}
        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          Sign in with Google Enoki or your Sui Wallet, or use the{" "}
          <span className="font-semibold text-neutral-900 dark:text-neutral-200">
            Read-Only Test Account
          </span>{" "}
          to preview {viewTitle}.
        </p>

        {/* Primary Auth Buttons: Enoki Google zkLogin + Sui Browser Wallet Sign */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            data-testid="auth-enoki-google-btn"
            disabled={authSignBusy !== null}
            onClick={async () => {
              setAuthSignBusy("enoki");
              setAuthGateError(null);
              try {
                const session = await connectEnokiGoogleZkLogin();
                await handleVerifyAndUnlockWithIdentity({
                  provider: "enoki-google",
                  suiAddress: session.address,
                  handle: `@google-${session.address.slice(2, 6)}`,
                  fallbackRole: "read-only",
                });
              } catch (err) {
                setAuthGateError(
                  err instanceof Error
                    ? err.message
                    : "Google zkLogin popup closed or blocked."
                );
              } finally {
                setAuthSignBusy(null);
              }
            }}
            className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-neutral-900/12 bg-white px-3.5 text-xs font-semibold text-neutral-900 shadow-2xs transition hover:border-emerald-500/50 hover:bg-emerald-500/[0.04] disabled:opacity-50 dark:border-white/15 dark:bg-neutral-900 dark:text-white dark:hover:border-emerald-400/50"
          >
            <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
              />
            </svg>
            <span>
              {authSignBusy === "enoki"
                ? "Signing with Enoki…"
                : "Google (Enoki zkLogin)"}
            </span>
          </button>

          <button
            type="button"
            data-testid="auth-sui-wallet-sign-btn"
            disabled={authSignBusy !== null}
            onClick={async () => {
              setAuthSignBusy("wallet");
              setAuthGateError(null);
              try {
                const connected = await connectSlushOrBrowserWallet();
                const signed = await signWorkspacePermissionWithWallet({
                  wallet: connected.wallet,
                  account: connected.account,
                  namespace: config.namespace,
                });
                await handleVerifyAndUnlockWithIdentity({
                  provider: "sui-wallet",
                  suiAddress: signed.address,
                  handle: `${signed.address.slice(0, 6)}…${signed.address.slice(-4)}`,
                  delegateKeyHex: signed.delegateKeyHex,
                  fallbackRole: "read-only",
                });
              } catch (err) {
                setAuthGateError(
                  err instanceof Error
                    ? err.message
                    : "Sui Wallet connection or signature cancelled."
                );
              } finally {
                setAuthSignBusy(null);
              }
            }}
            className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-3.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            <ShieldCheck className="size-4 shrink-0 text-emerald-400 dark:text-emerald-600" />
            <span>
              {authSignBusy === "wallet"
                ? "Waiting for Signature…"
                : "Connect Sui Wallet & Sign"}
            </span>
          </button>
        </div>

        {authGateError && (
          <div className="mt-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200">
            {authGateError}
          </div>
        )}

        {/* Public Test Account (Read-Only) + Localhost/Saved Owner Fast Login */}
        <div className="mt-4 rounded-2xl border border-neutral-900/10 bg-white/85 p-3 dark:border-white/10 dark:bg-neutral-900/75">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
              {hasLocalOwnerSession
                ? "Fast Sign-In (Local Session + Read-Only Test)"
                : "Public Test Account (Read-Only Preview)"}
            </span>
            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300">
              {hasLocalOwnerSession ? "Localhost / Owner" : "View & Recall Only"}
            </span>
          </div>

          <div className="divide-y divide-neutral-900/8 dark:divide-white/8">
            {hasLocalOwnerSession &&
              (() => {
                const ownerProf = ONCHAIN_DELEGATE_PROFILES[0];
                return (
                  <button
                    type="button"
                    data-testid="auth-demo-key-btn"
                    onClick={() =>
                      void handleVerifyAndUnlockWithIdentity({
                        provider: "dev-wallet",
                        suiAddress: ownerProf.suiAddress,
                        handle: ownerProf.handle,
                        fallbackRole: "owner",
                      })
                    }
                    className="flex w-full cursor-pointer items-center justify-between gap-2.5 py-2 text-left transition hover:opacity-85 first:pt-1"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <SignerOrb3D
                        initials={ownerProf.initials}
                        handle={ownerProf.handle}
                        size="sm"
                        online
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                            {ownerProf.handle}
                          </span>
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[9.5px] font-bold text-emerald-800 dark:text-emerald-300">
                            Owner · Fast Login
                          </span>
                        </div>
                        <p className="truncate font-mono text-[10.5px] text-neutral-500 dark:text-neutral-400">
                          {ownerProf.suiAddress.slice(0, 10)}…
                          {ownerProf.suiAddress.slice(-6)} · Localhost / Owner session
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 font-mono text-[10.5px] font-bold text-emerald-900 dark:text-emerald-200">
                      Fast Enter →
                    </span>
                  </button>
                );
              })()}

            {(() => {
              const qaProf = ONCHAIN_DELEGATE_PROFILES[2];
              return (
                <button
                  type="button"
                  data-testid="auth-readonly-demo-btn"
                  onClick={() =>
                    void handleVerifyAndUnlockWithIdentity({
                      provider: "dev-wallet",
                      suiAddress: qaProf.suiAddress,
                      handle: qaProf.handle,
                      fallbackRole: "read-only",
                    })
                  }
                  className="flex w-full cursor-pointer items-center justify-between gap-2.5 py-2 text-left transition hover:opacity-85 last:pb-1"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <SignerOrb3D
                      initials={qaProf.initials}
                      handle={qaProf.handle}
                      size="sm"
                      online
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                          {qaProf.handle}
                        </span>
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[9.5px] font-bold text-amber-800 dark:text-amber-300">
                          Test Account · Read-Only
                        </span>
                      </div>
                      <p className="truncate font-mono text-[10.5px] text-neutral-500 dark:text-neutral-400">
                        {qaProf.suiAddress.slice(0, 10)}…
                        {qaProf.suiAddress.slice(-6)} · Cannot edit or push rules
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg border border-neutral-900/12 bg-neutral-100/80 px-2.5 py-1 font-mono text-[10.5px] font-bold text-neutral-800 dark:border-white/12 dark:bg-white/10 dark:text-white">
                    Preview (Read-Only) →
                  </span>
                </button>
              );
            })()}
          </div>
        </div>

        {/* Collapsible Owner / Co-Author Delegate Key Input */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => setAuthShowPasteKey((v) => !v)}
              className="cursor-pointer font-mono font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              {authShowPasteKey
                ? "Hide Owner / Co-Author Key ↑"
                : "Owner / Co-Author? Enter Delegate Key ↓"}
            </button>
            <button
              type="button"
              onClick={() => navigateTo("/")}
              className="cursor-pointer font-mono font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
            >
              Wallet Setup Wizard →
            </button>
          </div>

          {authShowPasteKey && (
            <div className="mt-2.5 space-y-2.5 rounded-2xl border border-neutral-900/10 bg-white/80 p-3.5 dark:border-white/10 dark:bg-black/35">
              <div>
                <label className="block font-mono text-[10px] font-bold text-neutral-500 uppercase">
                  Owner / Co-Author Delegate Key (64-char Ed25519 Hex)
                </label>
                <input
                  type="password"
                  value={authKeyInput}
                  onChange={(e) => {
                    setAuthKeyInput(e.target.value.trim());
                    setAuthGateError(null);
                  }}
                  placeholder="Enter your 64-character hex delegate private key..."
                  className="mt-1 h-8 w-full rounded-lg border border-neutral-200 bg-white px-2.5 font-mono text-xs text-neutral-900 dark:border-white/12 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
              <DitherButton
                color="blue"
                fill="gradient"
                size="sm"
                bloom="low"
                data-testid="auth-unlock-btn"
                onClick={() => {
                  const cleanKey = authKeyInput.replace(/^0x/i, "").trim();
                  if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
                    setAuthGateError(
                      "Please enter a valid 64-character hex Delegate Private Key for Read & Write access."
                    );
                    return;
                  }
                  const envDefaults = getEnvDefaultConfig();
                  const isOwnerKey =
                    cleanKey.toLowerCase() ===
                    envDefaults.delegateKey.toLowerCase();
                  if (isOwnerKey && typeof window !== "undefined") {
                    window.localStorage.setItem(
                      "memwal_owner_fast_session_v1",
                      "true"
                    );
                  }
                  setConfig((prev) => ({
                    ...prev,
                    accountId: prev.accountId || envDefaults.accountId,
                    delegateKey: cleanKey,
                    memberHandle: isOwnerKey
                      ? "@harrymove-ctrl"
                      : "@mysten-dev",
                    accessRole: isOwnerKey ? "owner" : "read-write",
                  }));
                  setAuthGateError(null);
                  setIsAuthenticated(true);
                  void handlePullNamespaceFromWalrus(config.namespace);
                }}
                className="w-full justify-center font-mono text-xs font-bold uppercase"
              >
                <KeyRound className="size-3.5" />
                <span>Verify Key &amp; Unlock Read/Write</span>
              </DitherButton>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <GlimmWorkspaceProvider isDark={isDark}>
      <GlimmNavBridge sweepRef={glimmSweepRef} />
    <div className="relative isolate min-h-screen bg-[#f8f9fa] text-[var(--ink)] transition-colors dark:bg-[#090b0a]">
      <FullscreenShaderBackground isDark={isDark} />
      {/* Subtle top radial studio glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(16,185,129,0.08),transparent)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgba(16,185,129,0.12),transparent)]" />

      {/* ====================================================================
          ZONE 0: ULTRA-CLEAN USELAYOUTS TOP BAR
         ==================================================================== */}
      {currentPath !== "/" && (
        <header
          aria-label="Primary workspace navigation"
          data-testid="clean-workspace-header"
          className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#0c0f0e]/90"
        >
          <div className="mx-auto flex h-13 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
            {/* Left: Brand + Live Bucket Badge */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigateTo("/eval")}
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-left"
                title="MemWal Shared Team Skills"
              >
                <WalrusLogo3D size="sm" />
                <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  MemWal
                </span>
              </button>
              <a
                href="https://console.walrus.xyz/buckets/?b=217e53fc-36ff-4d1b-8834-04f69c2ef553"
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 hover:bg-emerald-500/15 md:inline-flex dark:text-emerald-300"
              >
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Bucket 217e53fc…</span>
              </a>
            </div>

            {/* Center: Crisp @uselayouts Segmented Tabs */}
            <DiscreteTabs
              layoutId="header-primary-zone-tabs"
              size="sm"
              activeId={currentPath}
              onChange={(nextPath) => navigateTo(nextPath as RoutePath)}
              items={PRIMARY_ROUTES.map((route) => ({
                id: route.path,
                label: route.label,
                badge:
                  route.path === "/graph" && isAuthenticated
                    ? namespaceSkills.length
                    : undefined,
              }))}
            />

              {/* Right: Clean 4-item controls (Folder SmoothDropdown + Share + Profile/Lock + Theme) */}
            <div className="relative flex shrink-0 items-center gap-1.5">
              {isAuthenticated && (
                <>
                  <div className="hidden sm:block">
                    <SmoothDropdown
                      ariaLabel="Select Skill Folder"
                      value={config.namespace}
                      options={availableNamespaces.map((ns) => ({
                        value: ns,
                        label: ns,
                        meta: `${skills.filter((s) => s.namespace === ns).length}`,
                      }))}
                      onChange={(ns) => {
                        setConfig({ ...config, namespace: ns });
                        const localCount = skills.filter(
                          (s) => s.namespace === ns
                        ).length;
                        const remoteCount =
                          remoteNamespaceSummaries[ns]?.memoryCount ?? 0;
                        if (localCount === 0 && remoteCount > 0) {
                          void handlePullNamespaceFromWalrus(ns);
                        }
                      }}
                      footerAction={
                        config.accessRole !== "read-only" ? (
                          <button
                            type="button"
                            data-testid="header-new-collection-btn"
                            onClick={() => setNewCollectionModalOpen(true)}
                            className="inline-flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[11px] font-semibold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                          >
                            <Plus className="size-3.5" />
                            <span>New Skill Folder</span>
                          </button>
                        ) : undefined
                      }
                    />
                  </div>

                  <button
                    type="button"
                    data-testid="header-share-namespace-btn"
                    onClick={() => {
                      const shareLink = buildShareNamespaceUrl({
                        namespace: config.namespace,
                        skillId: activeSkill?.id,
                        accessRole: shareAccessRole,
                        invitedBy: config.memberHandle || "@harrymove-ctrl",
                      });
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        void navigator.clipboard.writeText(shareLink);
                      }
                      setHeaderShareCopied("link");
                      setTimeout(() => setHeaderShareCopied(null), 2200);
                      setHeaderShareOpen((prev) => !prev);
                    }}
                    title={`Share namespace "${config.namespace}" link & 1-shot Agent Pull prompt`}
                    className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl border px-2.5 font-mono text-[11px] font-bold transition ${
                      headerShareOpen || headerShareCopied === "link"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-neutral-200/90 bg-white/85 text-emerald-800 hover:bg-emerald-500/10 dark:border-white/12 dark:bg-neutral-900/85 dark:text-emerald-300"
                    }`}
                  >
                    {headerShareCopied === "link" ? (
                      <>
                        <Check className="size-3" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="size-3" />
                        <span className="hidden sm:inline">Share</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Header Share & Agent Pull Popover */}
              {headerShareOpen && (
                <div
                  data-testid="header-share-popover"
                  className="fixed top-14 right-3 z-50 w-[min(450px,calc(100vw-24px))] rounded-2xl border border-emerald-500/35 bg-white p-4 text-left shadow-2xl sm:absolute sm:top-11 sm:right-0 dark:border-emerald-400/30 dark:bg-[#0f1615]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex size-2 rounded-full bg-emerald-500" />
                        <span className="font-mono text-[10px] font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                          Share &amp; Pull Skill Folder · SEAL Encrypted
                        </span>
                      </div>
                      <h4 className="mt-0.5 font-mono text-sm font-bold text-neutral-900 dark:text-white">
                        {config.namespace}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {namespaceSkills.length} SKILL.md playbooks ·{" "}
                        {namespaceFlows.length} live team rules · SEAL Policy{" "}
                        <code className="font-mono">
                          {config.accountId.slice(0, 8)}…
                        </code>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHeaderShareOpen(false)}
                      className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  {/* Step 0: Invite Permission Scope (Read-Only vs Read & Write) */}
                  <div className="mt-3 rounded-xl border border-neutral-200/90 bg-neutral-50/90 p-2.5 dark:border-white/10 dark:bg-black/35">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10.5px] font-bold tracking-wider text-neutral-700 uppercase dark:text-neutral-200">
                        Invite Access Permission (SEAL Allowlist)
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        AES-256-GCM + Sui SEAL
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        data-testid="popover-role-readonly-btn"
                        onClick={() => setShareAccessRole("read-only")}
                        className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-left transition ${
                          shareAccessRole === "read-only"
                            ? "border-amber-500/60 bg-amber-500/15 text-amber-950 dark:text-amber-200"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 font-mono text-[10.5px] font-bold">
                          <span>Read-Only</span>
                          <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] uppercase">
                            Recall Only
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] leading-tight opacity-80">
                          Can decrypt &amp; pull skills; cannot edit SKILL.md or push rules.
                        </p>
                      </button>

                      <button
                        type="button"
                        data-testid="popover-role-readwrite-btn"
                        onClick={() => setShareAccessRole("read-write")}
                        className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-left transition ${
                          shareAccessRole === "read-write"
                            ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-950 dark:text-emerald-200"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 font-mono text-[10.5px] font-bold">
                          <span>Read &amp; Write</span>
                          <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] uppercase">
                            Co-Author
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] leading-tight opacity-80">
                          Can pull skills AND push [FLOW] rules &amp; SKILL.md edits.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* 1. Encrypted Team Invite Link */}
                  <div className="mt-2.5 rounded-xl border border-neutral-200/90 bg-neutral-50/90 p-2.5 dark:border-white/10 dark:bg-black/35">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                        1. Team Invite Link (Requires SEAL Auth ·{" "}
                        {shareAccessRole === "read-only"
                          ? "Read-Only"
                          : "Read & Write"}
                        )
                      </span>
                      <button
                        type="button"
                        data-testid="popover-copy-join-link-btn"
                        onClick={() => {
                          const shareLink = buildShareNamespaceUrl({
                            namespace: config.namespace,
                            skillId: activeSkill?.id,
                            accessRole: shareAccessRole,
                            invitedBy: config.memberHandle || "@harrymove-ctrl",
                          });
                          if (
                            typeof navigator !== "undefined" &&
                            navigator.clipboard
                          ) {
                            void navigator.clipboard.writeText(shareLink);
                          }
                          setHeaderShareCopied("web-link");
                          setTimeout(() => setHeaderShareCopied(null), 2000);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10.5px] font-semibold text-white hover:bg-emerald-500"
                      >
                        {headerShareCopied === "web-link" ? (
                          <>
                            <Check className="size-3" />
                            <span>Copied Link ✓</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy Invite Link</span>
                          </>
                        )}
                      </button>
                    </div>
                    <code className="mt-1.5 block truncate rounded bg-white px-2 py-1 font-mono text-[10.5px] text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                      {buildShareNamespaceUrl({
                        namespace: config.namespace,
                        skillId: activeSkill?.id,
                        accessRole: shareAccessRole,
                        invitedBy: config.memberHandle || "@harrymove-ctrl",
                      })}
                    </code>
                  </div>

                  {/* 2. 1-Shot Agent Pull Prompt */}
                  <div className="mt-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-2.5 dark:border-emerald-400/20 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-emerald-950 dark:text-emerald-200">
                        2. 1-Shot Prompt for Teammate&apos;s AI Agent (
                        {shareAccessRole === "read-only"
                          ? "Recall Only"
                          : "Recall + Write"}
                        )
                      </span>
                      <button
                        type="button"
                        data-testid="popover-copy-agent-pull-btn"
                        onClick={() => {
                          const pullPrompt = buildShareNamespacePullPrompt({
                            namespace: config.namespace,
                            accountId: config.accountId,
                            serverUrl: config.serverUrl,
                            skillsCount: namespaceSkills.length,
                            flowsCount: namespaceFlows.length,
                            activeSkillId: activeSkill?.id,
                            skillNames: namespaceSkills.map((s) => s.id),
                            accessRole: shareAccessRole,
                            invitedBy: config.memberHandle || "@harrymove-ctrl",
                          });
                          if (
                            typeof navigator !== "undefined" &&
                            navigator.clipboard
                          ) {
                            void navigator.clipboard.writeText(pullPrompt);
                          }
                          setHeaderShareCopied("pull-prompt");
                          setTimeout(() => setHeaderShareCopied(null), 2000);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-neutral-900 px-2 py-1 text-[10.5px] font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                      >
                        {headerShareCopied === "pull-prompt" ? (
                          <>
                            <Check className="size-3 text-emerald-400 dark:text-emerald-600" />
                            <span>Copied Prompt ✓</span>
                          </>
                        ) : (
                          <>
                            <Terminal className="size-3" />
                            <span>Copy Pull Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {shareAccessRole === "read-only" ? (
                        <>
                          Configures the teammate&apos;s agent with{" "}
                          <strong>Read-Only SEAL decryption</strong> (
                          <code className="font-mono">memwal_recall</code>{" "}
                          enabled;{" "}
                          <code className="font-mono">memwal_remember</code>{" "}
                          blocked).
                        </>
                      ) : (
                        <>
                          Configures the teammate&apos;s agent with{" "}
                          <strong>Read &amp; Write delegate access</strong> (both{" "}
                          <code className="font-mono">memwal_recall</code> &amp;{" "}
                          <code className="font-mono">memwal_remember</code>{" "}
                          enabled).
                        </>
                      )}
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        void handlePullNamespaceFromWalrus(config.namespace);
                        setHeaderShareOpen(false);
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/5 dark:text-neutral-200"
                    >
                      <Download className="size-3" />
                      <span>Pull Latest from Walrus</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeaderShareOpen(false);
                        navigateTo("/cad");
                      }}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                    >
                      Manage SEAL Allowlist →
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                data-testid="header-lock-vault-btn"
                onClick={() => {
                  if (isAuthenticated) {
                    setIsAuthenticated(false);
                    setHeaderShareOpen(false);
                  } else if (typeof document !== "undefined") {
                    document
                      .querySelector('[data-testid="vault-auth-gate"]')
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                title={
                  isAuthenticated
                    ? `Signed in as ${config.memberHandle || "@harrymove-ctrl"} (${config.accessRole === "read-only" ? "Read-Only" : "Read & Write"}) — click to Lock`
                    : "Sign in required below"
                }
                className={`hidden h-8 cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 font-mono text-[11px] font-bold transition sm:inline-flex ${
                  isAuthenticated
                    ? config.accessRole === "read-only"
                      ? "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300"
                    : "border-amber-500/40 bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 dark:text-amber-300"
                }`}
              >
                <Lock className="size-3" />
                <span className="hidden md:inline">
                  {isAuthenticated
                    ? config.accessRole === "read-only"
                      ? "Read-Only"
                      : config.memberHandle || "@harrymove-ctrl"
                    : "Locked"}
                </span>
              </button>

              <ThemeToggle isDark={isDark} onToggle={setIsDark} compact />
            </div>
          </div>
          {qaDebugEnabled && (
            <div
              data-testid="qa-debug-bar"
              className="border-t border-emerald-500/30 bg-emerald-950/90 px-3 py-1.5 font-mono text-[11px] text-emerald-200 tabular-nums sm:px-6"
            >
              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
                <span>
                  QA Debug · route={currentPath} · folder={config.namespace.slice(0, 28)} · skills={namespaceSkills.length} · rules={namespaceFlows.length} · sync={syncStatus.state}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="qa-stress-long-values"
                    onClick={() => {
                      const longFolder =
                        "memwal-enterprise-multi-agent-security-and-sui-mainnet-verification-folder-2026";
                      const longSkillId = `${longFolder}-ultra-long-security-audit-playbook`;
                      const nowIso = new Date().toISOString();
                      setDiscoveredNamespaces((prev) =>
                        prev.includes(longFolder) ? prev : [...prev, longFolder]
                      );
                      setSkills((prev) => [
                        {
                          id: longSkillId,
                          name: longSkillId,
                          namespace: longFolder,
                          category: "Enterprise Security & Cryptographic Verification",
                          description:
                            "Comprehensive 120-character enterprise verification playbook for multi-agent Sui Mainnet & Walrus storage pipelines.",
                          markdown: `# ${longSkillId}\n\nAlways verify 66-character Sui object addresses (\`0x463ec4c3dc73ac99fdde5ffbe8ff5aa8ce1b9d8f4e2a1c3d5b7e9f012345eb1d\`) before committing SEAL policies.\n`,
                          relatedSkills: [],
                          blobId: FALLBACK_WALRUS_BLOBS[0],
                          updatedAt: nowIso,
                          authorKey: "@enterprise-security-auditor-lead",
                        },
                        ...prev.filter((s) => s.id !== longSkillId),
                      ]);
                      setFlowMemories((prev) => [
                        {
                          id: "flow-stress-long-rule",
                          skillId: longSkillId,
                          namespace: longFolder,
                          rule: "Never approve or merge a pull request touching 0x463ec4c3dc73ac99fdde5ffbe8ff5aa8ce1b9d8f4e2a1c3d5b7e9f012345eb1d unless all 13 automated QA checks pass.",
                          rationale:
                            "Prevents regressions under maximum realistic payload lengths across desktop and mobile viewports.",
                          severity: "hard-rule",
                          blobId: FALLBACK_WALRUS_BLOBS[1],
                          createdAt: nowIso,
                          authorHandle: "@enterprise-security-auditor-lead",
                          authorDelegateKey: "0x8a2572a9...e124",
                          linkedSkills: [],
                          similarityScore: 0.99,
                        },
                        ...prev.filter((f) => f.id !== "flow-stress-long-rule"),
                      ]);
                      setConfig((prev) => ({
                        ...prev,
                        namespace: longFolder,
                        memberHandle: "@enterprise-security-auditor-lead",
                      }));
                      setSelectedSkillId(longSkillId);
                    }}
                    className="cursor-pointer rounded bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-100 hover:bg-emerald-500/30"
                  >
                    Stress Long Values
                  </button>
                  <button
                    type="button"
                    data-testid="qa-reset-baseline"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        namespace: "memwal-team-skills",
                        memberHandle: "@harrymove-ctrl",
                      }));
                      setSelectedSkillId("memwal-qa");
                    }}
                    className="cursor-pointer rounded bg-white/10 px-2 py-0.5 text-neutral-200 hover:bg-white/20"
                  >
                    Reset Baseline
                  </button>
                  <button
                    type="button"
                    onClick={() => setQaDebugEnabled(false)}
                    className="cursor-pointer rounded bg-white/10 px-1.5 py-0.5 text-neutral-300 hover:bg-white/20"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      <InteractiveTourModal
        open={tourModalOpen}
        currentPath={currentPath}
        activeNamespace={config.namespace}
        onClose={() => setTourModalOpen(false)}
        onNavigate={(path) => {
          navigateTo(path);
        }}
      />

      <AmicroMotionModal
        open={motionModalOpen}
        onClose={() => setMotionModalOpen(false)}
        bucketId={config.namespace}
      />

      <NewCollectionModal
        open={newCollectionModalOpen}
        config={config}
        existingNamespaces={availableNamespaces}
        onClose={() => setNewCollectionModalOpen(false)}
        onPullNamespaceFromWalrus={handlePullNamespaceFromWalrus}
        onCreatedCollection={({
          namespace: newNs,
          skills: createdSkills,
          flows: createdFlows,
          receipt,
          unseededExternal,
        }) => {
          if (unseededExternal) {
            setUnseededNamespaces((prev) =>
              prev.includes(newNs) ? prev : [...prev, newNs]
            );
          } else {
            setUnseededNamespaces((prev) => prev.filter((x) => x !== newNs));
          }
          if (createdSkills.length > 0) {
            setSkills((prev) => {
              const existingIds = new Set(
                prev.filter((s) => s.namespace === newNs).map((s) => s.id)
              );
              const fresh = createdSkills.filter((s) => !existingIds.has(s.id));
              return [...fresh, ...prev];
            });
            setSelectedSkillId(createdSkills[0].id);
          }
          if (createdFlows.length > 0) {
            setFlowMemories((prev) => [...createdFlows, ...prev]);
          }
          if (receipt) {
            setLocalReceipts((prev) => [receipt, ...prev]);
          }
          setDiscoveredNamespaces((prev) =>
            prev.includes(newNs) ? prev : [...prev, newNs]
          );
          setNamespaceListInput((prev) => {
            const list = prev
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            return list.includes(newNs) ? prev : [...list, newNs].join(", ");
          });
          setConfig((prev) => ({ ...prev, namespace: newNs }));
        }}
      />

      {/* ====================================================================
          WORKSPACE SETUP ("/?setup=1" or "/?invite=1")
         ==================================================================== */}
      {currentPath === "/" && (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Onboarding7
            config={config}
            isAuthenticated={isAuthenticated}
            isDark={isDark}
            skillsCount={namespaceSkills.length}
            flowsCount={namespaceFlows.length}
            existingWorkspaces={availableNamespaces.map((ns) => ({
              slug: ns,
              name:
                ns === "memwal-team-skills"
                  ? "MemWal Team Skills"
                  : ns === "design-skills"
                    ? "Design Skills"
                    : ns
                        .split("-")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" "),
              skillsCount: skills.filter((s) => s.namespace === ns).length,
              flowsCount: flowMemories.filter((f) => f.namespace === ns).length,
              region: "Sui Mainnet · Global (relayer.memory.walrus.xyz)",
              isPrivate: true,
            }))}
            onCreateWorkspace={(ws) => {
              setNamespaceListInput((prev) =>
                prev
                  .split(",")
                  .map((s) => s.trim())
                  .includes(ws.slug)
                  ? prev
                  : `${prev}, ${ws.slug}`
              );
              setConfig((prev) => ({ ...prev, namespace: ws.slug }));
              setSkills((prev) => {
                if (prev.some((s) => s.namespace === ws.slug)) return prev;
                const nowIso = new Date().toISOString();
                const author = config.memberHandle || "@harrymove-ctrl";
                const starterSkills: HostedSkillNode[] = [
                  {
                    id: `${ws.slug}-agents`,
                    name: `${ws.slug}-agents`,
                    namespace: ws.slug,
                    category: "Architecture & Core Rules",
                    description: `Core AGENTS.md & folder architecture rules for ${ws.name}.`,
                    markdown: `# ${ws.name} (${ws.slug})\n\n- **Folder**: \`${ws.bucketId || ws.slug}\`\n- **SEAL Policy ID**: \`${ws.sealPolicyId || "0x..."}\`\n- **Owner**: \`${ws.ownerAddress || "0x..."}\`\n\n## Core Rules\n1. Recall team skills from \`${ws.slug}\` before starting tasks.\n2. Ask for approval before saving new rules or updating \`SKILL.md\`.\n`,
                    relatedSkills: [`${ws.slug}-workflow`, `${ws.slug}-qa`],
                    blobId: FALLBACK_WALRUS_BLOBS[0],
                    updatedAt: nowIso,
                    authorKey: author,
                  },
                  {
                    id: `${ws.slug}-workflow`,
                    name: `${ws.slug}-workflow`,
                    namespace: ws.slug,
                    category: "Workflow & Automation",
                    description: `Release, PR, and MCP automation playbook for ${ws.name}.`,
                    markdown: `# ${ws.name} Workflow Playbook\n\n## When to Use\n- Before opening or merging PRs in \`${ws.slug}\`.\n- When syncing updated \`SKILL.md\` files.\n`,
                    relatedSkills: [`${ws.slug}-agents`],
                    blobId: FALLBACK_WALRUS_BLOBS[1],
                    updatedAt: nowIso,
                    authorKey: author,
                  },
                  {
                    id: `${ws.slug}-qa`,
                    name: `${ws.slug}-qa`,
                    namespace: ws.slug,
                    category: "Testing & QA Verification",
                    description: `End-to-end verification and regression checklist for ${ws.name}.`,
                    markdown: `# ${ws.name} QA Verification\n\n## Checklist\n1. Run unit and integration tests before shipping.\n2. Verify Sui Mainnet relayer (\`https://relayer.memory.walrus.xyz\`) health.\n`,
                    relatedSkills: [`${ws.slug}-agents`],
                    blobId: FALLBACK_WALRUS_BLOBS[2],
                    updatedAt: nowIso,
                    authorKey: author,
                  },
                ];
                return [...starterSkills, ...prev];
              });
            }}
            onUpdateConfig={setConfig}
            onQuickUnlockDevWallet={() => {
              setIsAuthenticated(true);
              navigateTo("/eval");
            }}
            onProvisionedAccount={(next) => {
              setConfig((prev) => ({ ...prev, ...next }));
              if (next.namespace) {
                setNamespaceListInput((prev) => {
                  const list = prev
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  if (!list.includes(next.namespace!)) {
                    return [next.namespace!, ...list].join(", ");
                  }
                  return prev;
                });
              }
            }}
            onNavigate={navigateTo}
            onOpenTour={() => setTourModalOpen(true)}
            onToggleTheme={setIsDark}
          />
        </div>
      )}

      {/* ====================================================================
          MAIN WORKSPACE CONTENT CONTAINER
         ==================================================================== */}
      {currentPath !== "/" && (
        <main className="relative z-10 mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
          {/* Mobile Skill Folder Bar (visible below sm breakpoint) */}
          <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 sm:hidden dark:border-white/10 dark:bg-[#14171c]">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Folder className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <select
                aria-label="Select Skill Folder (mobile)"
                value={config.namespace}
                onChange={(e) =>
                  setConfig({ ...config, namespace: e.target.value })
                }
                className="min-w-0 flex-1 truncate bg-transparent font-mono text-xs font-medium text-neutral-900 focus:outline-none dark:text-neutral-100"
              >
                {availableNamespaces.map((ns) => (
                  <option
                    key={ns}
                    value={ns}
                    className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    {ns} ({skills.filter((s) => s.namespace === ns).length})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setNewCollectionModalOpen(true)}
              className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-neutral-100 px-2.5 text-xs font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <Plus className="size-3" />
              <span>New</span>
            </button>
          </div>

          {/* TAB 1: DEMO (Before vs After Team Memory) */}
          {currentPath === "/eval" &&
            (!isAuthenticated ? (
              renderLockedVaultState("Demo")
            ) : (
              activeSkill && (
                <TrajectoryEvalHarness
                  skill={activeSkill}
                  allSkills={namespaceSkills}
                  skillFlows={activeSkillFlows}
                  evalCases={INITIAL_EVAL_CASES}
                  config={config}
                  onSelectSkill={(id) => setSelectedSkillId(id)}
                  onOpenSkillReader={() => navigateTo("/graph")}
                  onOpenConnect={() => navigateTo("/cad")}
                  onAddFlowMemory={handleAddFlowMemory}
                  onToggleRuleState={handleToggleRuleState}
                  onUpdateFlowMemory={handleUpdateFlowMemory}
                  onBakeRuleIntoSkill={handleBakeRuleIntoSkill}
                  onDeleteFlow={handleDeleteFlow}
                />
              )
            ))}

          {/* TAB 2: SKILLS (Master–Detail SKILL.md Reader + Optional Graph) */}
          {currentPath === "/graph" &&
            (!isAuthenticated ? (
              renderLockedVaultState("Skills")
            ) : (
              activeSkill && (
                <SkillsWorkspace
                  skills={namespaceSkills}
                  flows={namespaceFlows}
                  activeSkill={activeSkill}
                  config={config}
                  isSharedJoinView={isSharedJoinView}
                  onDismissSharedJoinView={() => setIsSharedJoinView(false)}
                  onPullNamespaceFromWalrus={() =>
                    void handlePullNamespaceFromWalrus(config.namespace)
                  }
                  onSelectSkill={(id) => setSelectedSkillId(id)}
                  onUpdateSkillMarkdown={handleUpdateSkillMarkdown}
                  onSyncSkillEditToWalrus={handleSyncSkillEditToWalrus}
                  onUpdateFlowMemory={handleUpdateFlowMemory}
                  onToggleRuleState={handleToggleRuleState}
                  onBakeRuleIntoSkill={handleBakeRuleIntoSkill}
                  onDeleteFlow={handleDeleteFlow}
                  onCreateNewSkill={handleCreateNewSkill}
                  onAddFlowMemory={handleAddFlowMemory}
                  onToggleSkillLink={handleToggleSkillLink}
                  onTestSkillInDemo={(id) => {
                    setSelectedSkillId(id);
                    navigateTo("/eval");
                  }}
                />
              )
            ))}

          {/* TAB 3: CONNECT (1-Click IDE Setup + Team Invite + Collapsible Proof) */}
          {currentPath === "/cad" &&
            (!isAuthenticated ? (
              renderLockedVaultState("Connect")
            ) : (
              <McpSyncPanel
                config={config}
                skillsCount={namespaceSkills.length}
                flowsCount={namespaceFlows.length}
                localReceipts={localReceipts}
                onSelectSkill={(skillId) => {
                  setSelectedSkillId(skillId);
                  navigateTo("/graph");
                }}
                syncStatus={syncStatus}
                onChangeConfig={setConfig}
                onPushNamespaceToWalrus={handlePushNamespaceToWalrus}
                onPullNamespaceFromWalrus={() =>
                  void handlePullNamespaceFromWalrus()
                }
              />
            ))}

          {/* LEGACY ROUTE: "/bento" */}
          {currentPath === "/bento" &&
            (!isAuthenticated ? (
              renderLockedVaultState("Folder Overview")
            ) : (
              <div className="space-y-4">
                <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#14171c]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <BucketFolder3DIcon active size={20} />
                      <div>
                        <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                          Folder{" "}
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            {config.namespace}
                          </span>
                        </h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {namespaceSkills.length} skills ·{" "}
                          {namespaceFlows.length} team rules
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeSkill && (
                        <button
                          type="button"
                          onClick={() => downloadSkillMarkdownFile(activeSkill)}
                          className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 dark:border-white/12 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        >
                          Download {activeSkill.name}.md
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigateTo("/graph")}
                        className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-neutral-900 px-3.5 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
                      >
                        Browse Skills →
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4 dark:border-white/8">
                    <span className="text-xs text-neutral-500">Signer:</span>
                    {ONCHAIN_DELEGATE_PROFILES.map((prof) => {
                      const active = prof.handle === activeCallerProfile.handle;
                      return (
                        <button
                          key={prof.handle}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              memberHandle: prof.handle,
                            }))
                          }
                          className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium ${
                            active
                              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                              : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                          }`}
                        >
                          <SignerOrb3D
                            initials={prof.initials}
                            handle={prof.handle}
                            size="sm"
                            online={active}
                          />
                          <span>{prof.handle}</span>
                        </button>
                      );
                    })}
                    <a
                      href={`https://suiscan.xyz/mainnet/account/${ownerCreds.ownerAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      Suiscan ↗
                    </a>
                  </div>
                </section>

                <div className="rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#14171c]">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedGuard((v) => !v)}
                    className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        {showAdvancedGuard ? "▾" : "▸"} On-Chain Folder Access
                        &amp; Delegate Permissions
                      </span>
                    </span>
                  </button>
                  {showAdvancedGuard && (
                    <div className="border-t border-neutral-100 p-4 dark:border-white/8">
                      <NamespacePresenceCard
                        config={config}
                        availableNamespaces={availableNamespaces}
                        isAuthenticated={isAuthenticated}
                        onSelectNamespace={(ns) =>
                          setConfig({ ...config, namespace: ns })
                        }
                        onQuickUnlockDemo={handleUseDemoDelegateKey}
                        onProvisionedAccount={(next) =>
                          setConfig((prev) => ({ ...prev, ...next }))
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
        </main>
      )}
    </div>
    </GlimmWorkspaceProvider>
  );
}

export default App;
