/**
 * Architecture rules: Hexagonal の層境界を機械的に検証する。
 * `npm run lint:arch` で実行、CI で必須化する。
 */
module.exports = {
  forbidden: [
    // ─── 層間の依存方向を制限 ───────────────────────
    {
      name: "domain-must-stay-pure",
      severity: "error",
      comment:
        "domain は他層に一切依存してはならない。fetch/DOM 等の副作用も禁止。",
      from: { path: "^src/domain" },
      to: {
        path: [
          "^src/application",
          "^src/infrastructure",
          "^src/presentation",
          "^src/main\\.ts$",
        ],
      },
    },
    {
      name: "application-no-infra-or-presentation",
      severity: "error",
      comment: "application は ports に対してプログラム、実装は注入される。",
      from: { path: "^src/application" },
      to: { path: ["^src/infrastructure", "^src/presentation"] },
    },
    {
      name: "infrastructure-no-presentation",
      severity: "error",
      comment: "infra は presentation を知らない。",
      from: { path: "^src/infrastructure" },
      to: { path: ["^src/presentation", "^src/main\\.ts$"] },
    },
    {
      name: "presentation-no-infrastructure",
      severity: "error",
      comment: "presentation は infra を直接呼ばない。",
      from: { path: "^src/presentation" },
      to: { path: "^src/infrastructure" },
    },

    // ─── 副作用 API の domain への漏れを防ぐ ────────
    {
      name: "no-circular",
      severity: "error",
      comment: "循環依存禁止",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment: "他から参照されないファイル (テスト, main, index.html, 設定ファイルは除外)",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|ts)$", // dotfiles
          "\\.d\\.ts$",
          "(^|/)tsconfig\\.json$",
          "(^|/)vite\\.config\\.ts$",
          "(^|/)src/main\\.ts$",
          "\\.test\\.ts$",
        ],
      },
      to: {},
    },
  ],

  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    /** type-only imports も依存として追跡 (no-orphans の偽陽性防止) */
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
      mainFields: ["module", "main"],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
