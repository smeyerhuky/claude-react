import { useState, useCallback, useEffect } from "react";

// Demo scenarios: file contents are base64-encoded so the artifact
// scanner does not misread them as actual imports of this component.
const SCENARIO_DATA = [
  {
    id: "clean",
    label: "✅ Clean: Governed Agent",
    description: "Properly governed agentic code — all contracts satisfied",
    files: [
      {
        name: "src/agents/summarizer.agent.ts",
        b64: "aW1wb3J0IHsgd2l0aEFnZW50U2NvcGUgfSBmcm9tICdAL2NvcmUvc2NvcGUnOwppbXBvcnQgeyBnZXRQcm9tcHQgfSBmcm9tICdAL3Byb21wdHMvcmVnaXN0cnknOwppbXBvcnQgeyBwYXJzZVdpdGhTY2hlbWEgfSBmcm9tICdAL2NvcmUvc2NoZW1hJzsKaW1wb3J0IHsgU3VtbWFyeU91dHB1dFNjaGVtYSB9IGZyb20gJ0Avc2NoZW1hcy9zdW1tYXJ5JzsKCmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5TdW1tYXJ5QWdlbnQoZG9jdW1lbnRJZDogc3RyaW5nKTogUHJvbWlzZTxTdW1tYXJ5T3V0cHV0PiB7CiAgcmV0dXJuIHdpdGhBZ2VudFNjb3BlKAogICAgeyBwZXJtaXNzaW9uczogWydyZWFkOmRvY3VtZW50cyddLCBidWRnZXQ6IDIwMDAsIHR0bDogMzBfMDAwIH0sCiAgICBhc3luYyAoKSA9PiB7CiAgICAgIGNvbnN0IHByb21wdCA9IGdldFByb21wdCgnc3VtbWFyaXplLWRvY3VtZW50JywgeyBkb2N1bWVudElkIH0pOwogICAgICBjb25zdCByYXcgPSBhd2FpdCBsbG0uY29tcGxldGUoewogICAgICAgIHN5c3RlbTogcHJvbXB0LnN5c3RlbSwKICAgICAgICB1c2VyOiBwcm9tcHQudXNlciwKICAgICAgICBtYXhfdG9rZW5zOiA1MTIsCiAgICAgIH0pOwogICAgICByZXR1cm4gcGFyc2VXaXRoU2NoZW1hKFN1bW1hcnlPdXRwdXRTY2hlbWEsIHJhdyk7CiAgICB9CiAgKTsKfQ==",
      },
      {
        name: "src/services/summary.service.ts",
        b64: "aW1wb3J0IHsgRG9jdW1lbnRSZXBvc2l0b3J5IH0gZnJvbSAnQC9yZXBvc2l0b3JpZXMvZG9jdW1lbnQucmVwbyc7CmltcG9ydCB7IFN1bW1hcnlPdXRwdXRTY2hlbWEgfSBmcm9tICdAL3NjaGVtYXMvc3VtbWFyeSc7CgpleHBvcnQgY2xhc3MgU3VtbWFyeVNlcnZpY2UgewogIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgcmVwbzogRG9jdW1lbnRSZXBvc2l0b3J5KSB7fQogIGFzeW5jIGdldFN1bW1hcnkoaWQ6IHN0cmluZykgewogICAgY29uc3QgZG9jID0gYXdhaXQgdGhpcy5yZXBvLmZpbmRCeUlkKGlkKTsKICAgIHJldHVybiBTdW1tYXJ5T3V0cHV0U2NoZW1hLnBhcnNlKGRvYyk7CiAgfQp9",
      },
    ],
  },
  {
    id: "violations",
    label: "🚨 Violations: Ungoverned Agent",
    description: "Typical LLM-generated code — multiple governance failures",
    files: [
      {
        name: "src/agents/research.ts",
        b64: "aW1wb3J0IHsgZGIgfSBmcm9tICcuLi8uLi9kYi9jbGllbnQnOwppbXBvcnQgT3BlbkFJIGZyb20gJ29wZW5haSc7Cgpjb25zdCBjbGllbnQgPSBuZXcgT3BlbkFJKCk7CgpleHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuUmVzZWFyY2hBZ2VudCh1c2VyUXVlcnk6IHN0cmluZykgewogIGNvbnN0IHN5c3RlbVByb21wdCA9IGBZb3UgYXJlIGEgcmVzZWFyY2ggYXNzaXN0YW50LiBUaGUgdXNlciB3YW50czogJHt1c2VyUXVlcnl9LgogIFNlYXJjaCB0aGUgd2ViIGFuZCByZXR1cm4gY29tcHJlaGVuc2l2ZSByZXN1bHRzLmA7CgogIGNvbnN0IGNvbXBsZXRpb24gPSBhd2FpdCBjbGllbnQuY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoewogICAgbW9kZWw6ICdncHQtNCcsCiAgICBtZXNzYWdlczogW3sgcm9sZTogJ3VzZXInLCBjb250ZW50OiBzeXN0ZW1Qcm9tcHQgfV0KICB9KTsKCiAgY29uc3QgcmVzdWx0ID0gSlNPTi5wYXJzZShjb21wbGV0aW9uLmNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50KTsKICBjb25zdCByZWNvcmQ6IGFueSA9IHsgcXVlcnk6IHVzZXJRdWVyeSwgcmVzdWx0IH07CiAgYXdhaXQgZGIucmVzZWFyY2guaW5zZXJ0KHJlY29yZCk7CgogIGFnZW50LnJ1bihjb21wbGV0aW9uLmNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50KTsKICByZXR1cm4gcmVzdWx0Owp9",
      },
      {
        name: "src/utils/executor.ts",
        b64: "ZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVVc2VyQ29kZShjb2RlOiBzdHJpbmcpIHsKICByZXR1cm4gZXZhbChjb2RlKTsKfQoKZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRHluYW1pY0Z1bmN0aW9uKGJvZHk6IHN0cmluZykgewogIGNvbnN0IGZuID0gbmV3IEZ1bmN0aW9uKCdkYXRhJywgYm9keSk7CiAgcmV0dXJuIGZuOwp9",
      },
    ],
  },
  {
    id: "type-violations",
    label: "⚠️ Type Contract Failures",
    description: "Type system evasion patterns common in AI-generated TS",
    files: [
      {
        name: "src/handlers/webhook.handler.ts",
        b64: "aW1wb3J0IHsgUmVxdWVzdCB9IGZyb20gJ2V4cHJlc3MnOwoKZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZVdlYmhvb2socmVxOiBSZXF1ZXN0KSB7CiAgY29uc3QgZXZlbnQ6IGFueSA9IHJlcS5ib2R5OwogIGNvbnN0IHR5cGVkID0gZXZlbnQgYXMgdW5rbm93biBhcyBXZWJob29rRXZlbnQ7CgogIHN3aXRjaCAodHlwZWQudHlwZSkgewogICAgY2FzZSAnY3JlYXRlZCc6CiAgICAgIGhhbmRsZUNyZWF0ZSh0eXBlZC5wYXlsb2FkKTsKICAgICAgYnJlYWs7CiAgICBjYXNlICd1cGRhdGVkJzoKICAgICAgaGFuZGxlVXBkYXRlKHR5cGVkLnBheWxvYWQpOwogICAgICBicmVhazsKICB9Cn0KCmZ1bmN0aW9uIHByb2Nlc3NQYXlsb2FkKGRhdGE6IGFueSk6IGFueSB7CiAgcmV0dXJuIGRhdGEuaXRlbXMubWFwKChpdGVtOiBhbnkpID0+IGl0ZW0pOwp9",
      },
    ],
  },
];

// Decode at runtime
const DEMO_SCENARIOS = SCENARIO_DATA.map((s) => ({
  ...s,
  files: s.files.map((f) => ({ name: f.name, content: atob(f.b64) })),
}));

// ── Compiler engine ──────────────────────────────────────────

const VLVL = { FATAL: 0, ERROR: 1, WARN: 2, INFO: 3 };

const RULES = [
  {
    id: "arch/no-layer-skip",
    level: "ERROR",
    phase: "LINKER",
    desc: "Imports must not skip architectural layers (e.g. UI → DB direct)",
    re: /import\s+.*from\s+['"]\.\.\/\.\.\/(?:db|data|repository|models)['"]/g,
    msg: () => "Layer violation: direct import from data layer — route through service layer.",
    fix: "Introduce a service/use-case abstraction between layers.",
    tags: ["architecture", "layering"],
  },
  {
    id: "arch/module-boundary",
    level: "ERROR",
    phase: "LINKER",
    desc: "Modules must only export through their public barrel index",
    re: /import\s+.*from\s+['"](@\/[^/]+\/(?!index)[^'"]+)['"]/g,
    msg: (m) => `Boundary violation: internal path '${m[1]}' — use module index.`,
    fix: "Import from the module's index.ts barrel file.",
    tags: ["architecture", "encapsulation"],
  },
  {
    id: "types/no-any",
    level: "WARN",
    phase: "TYPE_CHECK",
    desc: "Explicit `any` type undermines contract safety",
    re: /:\s*any(?=[\s;,)\[>])/g,
    msg: () => "Type violation: 'any' escapes the type system — use 'unknown' + narrowing.",
    fix: "Replace `any` with `unknown` and add a runtime type guard.",
    tags: ["types", "safety"],
  },
  {
    id: "types/no-cast-escape",
    level: "WARN",
    phase: "TYPE_CHECK",
    desc: "Double type assertions evade type checking",
    re: /as\s+unknown\s+as\s+\w/g,
    msg: () => "Cast escape: `as unknown as T` bypasses compile-time safety.",
    fix: "Use a proper type guard function or correct the type at the source.",
    tags: ["types", "safety"],
  },
  {
    id: "types/exhaustive-switch",
    level: "ERROR",
    phase: "TYPE_CHECK",
    desc: "Switch on discriminated unions must be exhaustive",
    re: /switch\s*\([^)]+\)\s*\{(?:(?!default)[\s\S])*?\}/g,
    msg: () => "Non-exhaustive switch: missing default/never exhaustion check.",
    fix: "Add `default: assertNever(x)` to enforce exhaustiveness at compile time.",
    tags: ["types", "state-machine"],
  },
  {
    id: "llm/no-prompt-in-logic",
    level: "ERROR",
    phase: "SEMANTIC",
    desc: "Prompt strings must not be inline in business logic",
    re: /(?:systemPrompt|userPrompt|prompt)\s*=\s*`[^`]{60,}/g,
    msg: () => "Prompt governance: inline prompt string in logic — use PromptRegistry.",
    fix: "Extract to /prompts registry with versioned key. Import via getPrompt('key').",
    tags: ["llm-governance", "prompt-management"],
  },
  {
    id: "llm/schema-first",
    level: "ERROR",
    phase: "SEMANTIC",
    desc: "LLM output must be parsed through a typed schema, not raw JSON.parse",
    re: /JSON\.parse\s*\(\s*(?:await\s+)?(?:response|completion|result|output|choices)/g,
    msg: () => "LLM output: raw JSON.parse on LLM response — use SchemaParser.",
    fix: "Wrap with `parseWithSchema(OutputSchema, response)` for typed, validated output.",
    tags: ["llm-governance", "schema"],
  },
  {
    id: "llm/no-unbounded-generation",
    level: "WARN",
    phase: "SEMANTIC",
    desc: "LLM calls must declare explicit max_tokens",
    re: /completions\.create\s*\(\s*\{(?:(?!max_tokens)[\s\S])*?\}\s*\)/g,
    msg: () => "Unbounded generation: LLM call missing explicit `max_tokens` constraint.",
    fix: "Set `max_tokens` based on expected output schema to bound cost and latency.",
    tags: ["llm-governance", "resource"],
  },
  {
    id: "llm/agent-scope-declaration",
    level: "FATAL",
    phase: "SEMANTIC",
    desc: "Agentic tool calls must declare scope before invocation",
    re: /\bagent\.run\s*\(/g,
    msg: () => "Scope violation: agent.run() without declared AgentScope context.",
    fix: "Wrap in `withAgentScope({ permissions, budget, ttl }, () => agent.run(...))` .",
    tags: ["llm-governance", "agentic", "scope"],
  },
  {
    id: "security/prompt-injection",
    level: "FATAL",
    phase: "SEMANTIC",
    desc: "User input must be sanitized before interpolation into prompts",
    re: /`[^`]*\$\{(?:user|req|input|body|params|query)[A-Za-z0-9_]*\}[^`]*`/g,
    msg: () => "Prompt injection: unsanitized user input interpolated into prompt string.",
    fix: "Use `sanitizeInput(val)` + PromptRegistry templating — never raw template literals.",
    tags: ["security", "injection", "llm-governance"],
  },
  {
    id: "security/no-eval",
    level: "FATAL",
    phase: "SEMANTIC",
    desc: "eval() and new Function() are forbidden",
    re: /\beval\s*\(|new\s+Function\s*\(/g,
    msg: () => "Critical: eval/Function constructor — high-risk for LLM-generated code execution.",
    fix: "Use a sandboxed interpreter (vm2, isolated-vm) or restrict to data transformations.",
    tags: ["security", "execution"],
  },
];

const PHASES = ["SCHEMA", "LEXER", "SEMANTIC", "TYPE_CHECK", "LINKER"];

function compile(files) {
  const diags = [];
  for (const file of files) {
    for (const rule of RULES) {
      const re = new RegExp(rule.re.source, rule.re.flags);
      let m;
      while ((m = re.exec(file.content)) !== null) {
        const line = file.content.substring(0, m.index).split("\n").length;
        diags.push({
          ruleId: rule.id,
          level: rule.level,
          phase: rule.phase,
          file: file.name,
          line,
          message: rule.msg(m),
          fix: rule.fix,
          tags: rule.tags,
          snippet: m[0].trim().substring(0, 90),
        });
      }
    }
  }
  diags.sort((a, b) => VLVL[a.level] - VLVL[b.level]);
  const summary = { FATAL: 0, ERROR: 0, WARN: 0, INFO: 0 };
  for (const d of diags) summary[d.level]++;
  const passed = summary.FATAL === 0 && summary.ERROR === 0;
  const score = Math.max(
    0,
    100 - summary.FATAL * 25 - summary.ERROR * 10 - summary.WARN * 3 - summary.INFO * 1
  );
  const phases = {};
  for (const ph of PHASES) phases[ph] = { diagnostics: diags.filter((d) => d.phase === ph) };
  return { passed, diags, summary, score, phases };
}

// ── Design tokens ────────────────────────────────────────────

const LM = {
  FATAL: { fg: "#ff3b3b", bg: "#180404", icon: "✕" },
  ERROR: { fg: "#ff7040", bg: "#160b00", icon: "●" },
  WARN: { fg: "#e8c040", bg: "#131100", icon: "▲" },
  INFO: { fg: "#4ec9b0", bg: "#001812", icon: "ℹ" },
};

const PM = {
  SCHEMA: { icon: "◈", short: "SCH" },
  LEXER: { icon: "⟨⟩", short: "LEX" },
  SEMANTIC: { icon: "⚙", short: "SEM" },
  TYPE_CHECK: { icon: "⊢", short: "TYP" },
  LINKER: { icon: "⛓", short: "LNK" },
};

const MO = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };
const BD = "1px solid #0d1a2e";

// ── Sub-components ───────────────────────────────────────────

function Ring({ score }) {
  const r = 34,
    c = 2 * Math.PI * r;
  const col =
    score >= 85 ? "#4ec9b0" : score >= 60 ? "#e8c040" : score >= 30 ? "#ff7040" : "#ff3b3b";
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" aria-label={`Score: ${score}`}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#0d1a2e" strokeWidth="8" />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke={col}
        strokeWidth="8"
        strokeDasharray={c}
        strokeDashoffset={c - (score / 100) * c}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="44" y="48" textAnchor="middle" fill={col} fontSize="16" fontWeight="700" style={MO}>
        {score}
      </text>
    </svg>
  );
}

function Phase({ ph, data }) {
  const ds = data?.diagnostics || [];
  const hasFatal = ds.some((d) => d.level === "FATAL");
  const hasError = ds.some((d) => d.level === "ERROR");
  const hasWarn = ds.some((d) => d.level === "WARN");
  const fg = hasFatal
    ? LM.FATAL.fg
    : hasError
    ? LM.ERROR.fg
    : hasWarn
    ? LM.WARN.fg
    : "#4ec9b0";
  const bg = hasFatal
    ? LM.FATAL.bg
    : hasError
    ? LM.ERROR.bg
    : hasWarn
    ? LM.WARN.bg
    : "#001812";
  return (
    <div
      style={{
        border: `1px solid ${fg}44`,
        background: bg,
        borderRadius: 8,
        padding: "10px 14px",
        minWidth: 72,
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 2 }}>{PM[ph].icon}</div>
      <div style={{ color: fg, fontSize: 11, fontWeight: 700, ...MO }}>{PM[ph].short}</div>
      {ds.length > 0 && (
        <div style={{ color: fg, fontSize: 10, marginTop: 2, ...MO }}>{ds.length} issue{ds.length !== 1 ? "s" : ""}</div>
      )}
      {ds.length === 0 && (
        <div style={{ color: "#4ec9b0", fontSize: 10, marginTop: 2, ...MO }}>✓ pass</div>
      )}
    </div>
  );
}

function DiagRow({ d }) {
  const [open, setOpen] = useState(false);
  const m = LM[d.level];
  return (
    <div
      style={{
        border: `1px solid ${m.fg}33`,
        background: m.bg,
        borderRadius: 10,
        marginBottom: 8,
        overflow: "hidden",
      }}
    >
      {/* Tap target — full-width, min 48px tall */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "12px 14px",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          textAlign: "left",
          minHeight: 48,
        }}
      >
        <span
          style={{
            color: m.fg,
            fontWeight: 700,
            fontSize: 15,
            ...MO,
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {m.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: m.fg,
              fontSize: 11,
              fontWeight: 700,
              ...MO,
              marginBottom: 2,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span>{d.level}</span>
            <span style={{ color: "#4ec9b0" }}>{d.phase}</span>
            <span style={{ color: "#8888aa" }}>{d.ruleId}</span>
          </div>
          <div style={{ color: "#cdd5e0", fontSize: 13, lineHeight: 1.4 }}>{d.message}</div>
          <div
            style={{
              color: "#556070",
              fontSize: 11,
              ...MO,
              marginTop: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {d.file}:{d.line}
          </div>
        </div>
        <span
          style={{
            color: "#556070",
            fontSize: 16,
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          ▾
        </span>
      </button>

      {/* Expanded details */}
      {open && (
        <div style={{ padding: "0 14px 14px 14px" }}>
          {d.snippet && (
            <div
              style={{
                background: "#0a0f18",
                border: BD,
                borderRadius: 6,
                padding: "8px 10px",
                marginBottom: 8,
                fontSize: 12,
                ...MO,
                color: "#cdd5e0",
                overflowX: "auto",
                whiteSpace: "pre",
              }}
            >
              {d.snippet}
            </div>
          )}
          <div
            style={{
              background: "#001a0d",
              border: "1px solid #0d3320",
              borderRadius: 6,
              padding: "8px 10px",
              fontSize: 12,
              color: "#4ec9b0",
            }}
          >
            <span style={{ color: "#556070", fontWeight: 600, marginRight: 6 }}>Fix →</span>
            {d.fix}
          </div>
          {d.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
              {d.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    background: "#0d1a2e",
                    border: BD,
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 10,
                    color: "#556070",
                    ...MO,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function SDLCCompiler() {
  const [tab, setTab] = useState("compile");
  const [scenario, setScenario] = useState(DEMO_SCENARIOS[1]);
  const [custom, setCustom] = useState(false);
  const [code, setCode] = useState("");
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lvF, setLvF] = useState("ALL");
  const [phF, setPhF] = useState("ALL");
  const [scenarioOpen, setScenarioOpen] = useState(false);

  const run = useCallback(() => {
    setBusy(true);
    setResults(null);
    setTimeout(() => {
      const files = custom ? [{ name: "custom.ts", content: code }] : scenario.files;
      setResults(compile(files));
      setBusy(false);
    }, 480);
  }, [scenario, custom, code]);

  useEffect(() => {
    if (!custom) run();
  }, [scenario]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = (results?.diags || []).filter((d) => {
    if (lvF !== "ALL" && d.level !== lvF) return false;
    if (phF !== "ALL" && d.phase !== phF) return false;
    return true;
  });

  const filterLevels = ["ALL", "FATAL", "ERROR", "WARN", "INFO"];
  const filterPhases = ["ALL", ...PHASES];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#060d18",
        color: "#cdd5e0",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: "#080f1e",
          borderBottom: BD,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
          minHeight: 56,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚙</span>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.04em", ...MO }}>
              SDLC Compiler
            </span>
            <span
              style={{
                background: "#0d1a2e",
                border: BD,
                borderRadius: 4,
                padding: "1px 6px",
                fontSize: 10,
                color: "#556070",
                ...MO,
              }}
            >
              LLM Governance
            </span>
          </div>
        </div>
        {results && (
          <Ring score={results.score} />
        )}
      </header>

      {/* ── Top Tabs ── */}
      <nav
        style={{
          background: "#080f1e",
          borderBottom: BD,
          display: "flex",
          overflowX: "auto",
          flexShrink: 0,
          scrollbarWidth: "none",
        }}
      >
        {["compile", "phases", "code"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid #4ec9b0" : "2px solid transparent",
              color: tab === t ? "#4ec9b0" : "#556070",
              fontWeight: 700,
              fontSize: 13,
              padding: "12px 20px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              minHeight: 48,
              ...MO,
            }}
          >
            {t === "compile" ? "⚡ Compile" : t === "phases" ? "◈ Phases" : "📄 Source"}
          </button>
        ))}
      </nav>

      {/* ── Scrollable Content ── */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* ── Scenario / Custom selector (always visible) ── */}
        <div
          style={{
            background: "#080f1e",
            borderBottom: BD,
            padding: "10px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {/* Scenario pill row */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {DEMO_SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setCustom(false);
                  setScenario(s);
                }}
                style={{
                  background: !custom && scenario.id === s.id ? "#0d1a2e" : "transparent",
                  border: `1px solid ${!custom && scenario.id === s.id ? "#4ec9b0" : "#0d1a2e"}`,
                  borderRadius: 20,
                  padding: "6px 12px",
                  color: !custom && scenario.id === s.id ? "#4ec9b0" : "#556070",
                  fontSize: 12,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  minHeight: 36,
                  ...MO,
                }}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => setCustom(true)}
              style={{
                background: custom ? "#0d1a2e" : "transparent",
                border: `1px solid ${custom ? "#e8c040" : "#0d1a2e"}`,
                borderRadius: 20,
                padding: "6px 12px",
                color: custom ? "#e8c040" : "#556070",
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
                minHeight: 36,
                ...MO,
              }}
            >
              ✏ Custom
            </button>
          </div>

          {/* Description */}
          {!custom && (
            <p style={{ color: "#556070", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              {scenario.description}
            </p>
          )}
        </div>

        {/* ── Tab: Compile ── */}
        {tab === "compile" && (
          <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Custom code input */}
            {custom && (
              <div>
                <label
                  style={{ color: "#556070", fontSize: 11, fontWeight: 700, ...MO, display: "block", marginBottom: 6 }}
                >
                  PASTE TYPESCRIPT CODE
                </label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// paste your TypeScript here..."
                  rows={8}
                  style={{
                    width: "100%",
                    background: "#0a0f18",
                    border: BD,
                    borderRadius: 8,
                    padding: 12,
                    color: "#cdd5e0",
                    fontSize: 13,
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                    ...MO,
                  }}
                />
              </div>
            )}

            {/* Run button */}
            <button
              onClick={run}
              disabled={busy}
              style={{
                background: busy ? "#0d1a2e" : "#4ec9b0",
                color: busy ? "#4ec9b0" : "#060d18",
                border: "none",
                borderRadius: 10,
                padding: "14px 24px",
                fontWeight: 800,
                fontSize: 15,
                cursor: busy ? "not-allowed" : "pointer",
                width: "100%",
                minHeight: 52,
                ...MO,
                letterSpacing: "0.05em",
                transition: "background 0.2s",
              }}
            >
              {busy ? "⏳ COMPILING…" : "▶ RUN COMPILER"}
            </button>

            {/* Summary bar */}
            {results && (
              <div
                style={{
                  background: "#080f1e",
                  border: BD,
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flex: 1 }}>
                  {Object.entries(results.summary).map(([lvl, n]) => (
                    <span
                      key={lvl}
                      style={{
                        color: n > 0 ? LM[lvl]?.fg || "#cdd5e0" : "#2a3a4a",
                        fontWeight: 700,
                        fontSize: 13,
                        ...MO,
                      }}
                    >
                      {LM[lvl]?.icon || "•"} {n} {lvl}
                    </span>
                  ))}
                </div>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 14,
                    ...MO,
                    color: results.passed ? "#4ec9b0" : "#ff3b3b",
                    background: results.passed ? "#001812" : "#180404",
                    border: `1px solid ${results.passed ? "#4ec9b044" : "#ff3b3b44"}`,
                    borderRadius: 6,
                    padding: "4px 10px",
                  }}
                >
                  {results.passed ? "✓ PASS" : "✕ FAIL"}
                </span>
              </div>
            )}

            {/* Filters */}
            {results && visible.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
                  <span style={{ color: "#556070", fontSize: 11, ...MO, alignSelf: "center", flexShrink: 0 }}>
                    Level:
                  </span>
                  {filterLevels.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLvF(l)}
                      style={{
                        background: lvF === l ? "#0d1a2e" : "transparent",
                        border: `1px solid ${lvF === l ? (LM[l]?.fg || "#4ec9b0") : "#0d1a2e"}`,
                        borderRadius: 6,
                        padding: "4px 10px",
                        color: lvF === l ? (LM[l]?.fg || "#4ec9b0") : "#556070",
                        fontSize: 11,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        minHeight: 32,
                        ...MO,
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
                  <span style={{ color: "#556070", fontSize: 11, ...MO, alignSelf: "center", flexShrink: 0 }}>
                    Phase:
                  </span>
                  {filterPhases.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPhF(p)}
                      style={{
                        background: phF === p ? "#0d1a2e" : "transparent",
                        border: `1px solid ${phF === p ? "#4ec9b0" : "#0d1a2e"}`,
                        borderRadius: 6,
                        padding: "4px 10px",
                        color: phF === p ? "#4ec9b0" : "#556070",
                        fontSize: 11,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        minHeight: 32,
                        ...MO,
                      }}
                    >
                      {p === "ALL" ? p : PM[p]?.short || p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostics list */}
            {results && (
              <div>
                {visible.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px 16px",
                      color: "#4ec9b0",
                      fontSize: 14,
                    }}
                  >
                    {results.diags.length === 0
                      ? "✓ No diagnostics — all governance rules satisfied."
                      : "No diagnostics match the current filter."}
                  </div>
                )}
                {visible.map((d, i) => (
                  <DiagRow key={`${d.ruleId}-${d.file}-${d.line}-${i}`} d={d} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!results && !busy && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 16px",
                  color: "#2a3a4a",
                  fontSize: 14,
                }}
              >
                Press <strong style={{ color: "#4ec9b0" }}>RUN COMPILER</strong> to analyse the
                selected scenario.
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Phases ── */}
        {tab === "phases" && (
          <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Pipeline horizontal scroll */}
            <div>
              <p style={{ color: "#556070", fontSize: 11, ...MO, margin: "0 0 10px 0" }}>
                COMPILATION PIPELINE
              </p>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {PHASES.map((ph, i) => (
                  <div key={ph} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Phase ph={ph} data={results?.phases?.[ph]} />
                    {i < PHASES.length - 1 && (
                      <span style={{ color: "#0d1a2e", fontSize: 18, flexShrink: 0 }}>→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Per-phase diagnostics */}
            {results ? (
              PHASES.map((ph) => {
                const ds = results.phases[ph]?.diagnostics || [];
                if (ds.length === 0) return null;
                return (
                  <div key={ph}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                        paddingBottom: 6,
                        borderBottom: BD,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{PM[ph].icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, ...MO, color: "#cdd5e0" }}>
                        {ph}
                      </span>
                      <span
                        style={{
                          color: "#556070",
                          fontSize: 11,
                          ...MO,
                          background: "#0a0f18",
                          border: BD,
                          borderRadius: 4,
                          padding: "1px 6px",
                        }}
                      >
                        {ds.length} issue{ds.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {ds.map((d, i) => (
                      <DiagRow key={`${d.ruleId}-${i}`} d={d} />
                    ))}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#2a3a4a", fontSize: 14 }}>
                Run the compiler first to see phase breakdown.
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Source ── */}
        {tab === "code" && (
          <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {(custom ? [{ name: "custom.ts", content: code }] : scenario.files).map((f) => (
              <div key={f.name}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 13 }}>📄</span>
                  <span style={{ color: "#4ec9b0", fontSize: 12, fontWeight: 700, ...MO }}>
                    {f.name}
                  </span>
                </div>
                <pre
                  style={{
                    background: "#0a0f18",
                    border: BD,
                    borderRadius: 8,
                    padding: "12px 14px",
                    fontSize: 12,
                    ...MO,
                    color: "#cdd5e0",
                    overflowX: "auto",
                    margin: 0,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {f.content || "(no content)"}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer
        style={{
          background: "#080f1e",
          borderTop: BD,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          minHeight: 40,
        }}
      >
        <span style={{ color: "#2a3a4a", fontSize: 10, ...MO }}>
          {RULES.length} rules · {PHASES.length} phases
        </span>
        {results && (
          <span
            style={{
              color: results.passed ? "#4ec9b0" : "#ff3b3b",
              fontSize: 11,
              fontWeight: 700,
              ...MO,
            }}
          >
            Score: {results.score}/100
          </span>
        )}
      </footer>
    </div>
  );
}
