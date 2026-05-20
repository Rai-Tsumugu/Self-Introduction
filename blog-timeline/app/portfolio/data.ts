export const DATA = {
  identity: {
    name: "Rai Tsumugu",
    nameJp: "らっく",
    kana: "らっく",
    tagline: "学生デベロッパー。VRと記録の境目で\nプロトタイプを作っています。",
    titles: ["Student (大学1年)", "Web / VR prototyper", "Hackathon participant"],
    handles: [
      { svc: "alias",  val: "らっく",       url: null, primary: true },
      { svc: "name",   val: "Rai Tsumugu",  url: null },
      { svc: "github", val: "Rai-Tsumugu",  url: "https://github.com/Rai-Tsumugu" },
    ],
  },

  core: { focus: "VR & Logs", tags: ["VR", "Logs", "Prototyping"] },

  now: [
    {
      status: "building",
      title: "Process Note を推進中",
      body: "起業家甲子園で受賞した内容をもとに、制作過程の自動記録・言語化ツールを継続開発。",
    },
    {
      status: "learning",
      title: "C言語 × 低レイヤ",
      body: "大学1年の授業を起点に、基本的なアルゴリズムとデータ構造をCで書き直して復習中。",
    },
    {
      status: "exploring",
      title: "VRでの立体的な音楽表現",
      body: "音→映像、3Dオーディオやシェーダーを組み合わせた空間体験に興味あり。",
    },
  ],

  awards: [
    {
      date: "2026.3.10", dateShort: "2026 / 3",
      title: "Hokkaido アプリコンテスト2026",
      meta: "HICTA(北海道IT推進協会)賞 / メディアマジック賞",
      project: "QuestLogic",
      summary: "子供が学習を丁寧に行なった度合いを可視化して、丁寧に行うほど報酬としてのゲーム時間が増える家庭内学習・ゲーム管理ツール",
      major: true,
    },
    {
      date: "2025.11.29", dateShort: "2025 / 11",
      title: "北海道 起業家甲子園 2025",
      meta: "北海道総合通信局長賞 / NTTドコモ北海道支社賞",
      project: "Process Note",
      summary: "ProcessNoteを推進した内容を発表。",
      major: true,
    },
    {
      date: "2025.10.19", dateShort: "2025 / 10",
      title: "JPHACKS 2025",
      meta: "札幌会場ブロックスポンサー賞 ディップ株式会社 賞",
      project: "Process Log",
      summary: "クリエイティブ × Tech をテーマに、ProcessNoteのアイデアの一部を形にし、画面からの記録作成を実装。",
      major: true,
    },
    {
      date: "2025.09.14", dateShort: "2025 / 09",
      title: "Deep Tech CORE XR Ideathon 2025",
      meta: "優秀賞 / Excellence Award",
      project: "モノ探し (チーム: メガネ)",
      summary: "空港や買い物の待ち時間で、3面モニターを用いた入り込めるモノ探し体験を提供するプロトタイプを提案。",
      major: false,
    },
    {
      date: "2025.09.12", dateShort: "2025 / 09",
      title: "Lean Launchpad Hokkaido 2025",
      meta: "最優秀賞 / Best Award",
      project: "ProcessNote",
      summary: "デザインの制作過程を自動記録・言語化し、プロセスの価値を活用するツールを提案。",
      major: true,
    },
  ],

  languages: [
    { name: "JavaScript", role: "Main",     headline: "プロトタイプ / Web制作" },
    { name: "Python",     role: "Main",     headline: "自動化 / AI連携" },
    { name: "C",          role: "Learning", headline: "基礎演習・大学1年授業" },
    { name: "C#",         role: "Learning", headline: "Unity / VRChat" },
    { name: "Java",       role: "Learning", headline: "シミュレーション" },
  ],
  frameworks: [
    { name: "React",    note: "TypeScriptベースでWeb UIを制作" },
    { name: "Three.js", note: "WebGLデモ・インタラクティブプロトタイプ" },
    { name: "Unity",    note: "VRChatのワールドアセット制作" },
  ],
  ai: {
    daily:  ["ChatGPT", "Gemini", "NotebookLM", "Perplexity"],
    coding: ["Codex", "Gemini", "GitHub Copilot"],
  },

  works: [
    {
      repo: "Rai-Tsumugu/process-note",
      name: "Process Note",
      desc: "デザイン制作過程を自動記録・言語化するツール。Lean Launchpad 最優秀賞 / 起業家甲子園 受賞作。",
      tags: ["React", "TypeScript", "受賞作"],
      live: null as string | null,
      featured: true,
    },
    {
      repo: "jphacks/sp_2501",
      name: "Process Log",
      desc: "JPHACKS 2025 出展作。画面キャプチャから制作過程を記録する。札幌会場ブロックスポンサー賞 ディップ株式会社 賞 受賞。",
      tags: ["JPHACKS", "TypeScript", "受賞作"],
      live: null as string | null,
      featured: true,
    },
    {
      repo: "Rai-Tsumugu/self-introduce",
      name: "このポートフォリオ",
      desc: "大学で友人が始めたWebホスティング上で公開している個人サイト。",
      tags: ["React", "自作"],
      live: null as string | null,
    },
    {
      repo: "Rai-Tsumugu/daily-log",
      name: "日常生活の記録ツール",
      desc: "行動・開始時刻・詳細を記録するWebアプリ。高校以来3年分のログを蓄積している私のオリジン的作品。",
      tags: ["Web", "個人ツール", "3年運用"],
      live: null as string | null,
    },
    {
      repo: "Rai-Tsumugu/vrc-signboard",
      name: "VRChat 案内表示板",
      desc: "指定経路に沿って案内矢印が動くVRChat用ワールドアセット。Codex補助でロジック実装。",
      tags: ["Unity", "C#", "VRChat"],
      live: null as string | null,
    },
    {
      repo: "Rai-Tsumugu/password-strength",
      name: "パスワード強度計測 (CUDA)",
      desc: "総当たり攻撃を想定した強度計測プログラム。文字種や長さに応じた解答時間を算出。",
      tags: ["C", "CUDA", "学習"],
      live: null as string | null,
    },
  ],

  timeline: ([
    { date: "2026.03.10", title: "Hokkaido アプリコンテスト2026 受賞", desc: "HICTA(北海道IT推進協会)賞 / メディアマジック賞", major: true },
    { date: "2026.02.25", title: "LLP 全国大会 出場", desc: "Lean Launchpad Hokkaido 最優秀賞を経て全国最終発表に出場。", major: true },
    { date: "2026.02.12", title: "NTTdocomo 見学", desc: "NTTドコモ北海道支社への企業見学に参加。", major: false },
    { date: "2026.02.03", title: "SAPPORO データアイデアソン 参加", desc: "Day1・Day2の2日間にわたるデータ活用アイデアソンに出場。", major: false },
    { date: "2025.12.01", endDate: "2026.02.28", title: "大学間越境学習プログラム", desc: "複数大学間の越境学習プログラムで横浜へ。Day1〜Day4の合宿型プログラム。", major: false },
    { date: "2026.01.24", title: "VKet Real in Sapporo 参加", desc: "リアル開催のVketイベントに参加。（2回目）", major: false },
    { date: "2025.11.29", title: "起業家甲子園 2025 受賞", desc: "北海道総合通信局長賞 / NTTドコモ北海道支社賞", major: true },
    { date: "2025.10.19", title: "JPHACKS 2025 受賞",       desc: "札幌会場ブロックスポンサー賞 ディップ株式会社 賞", major: true },
    { date: "2025.10.11", title: "No maps函館 参加", desc: "北海道発のクリエイティブ系カンファレンスに参加。", major: false },
    { date: "2025.09.14", title: "Deep Tech CORE XR Ideathon 優秀賞", desc: "", major: false },
    { date: "2025.09.12", title: "Lean Launchpad Hokkaido 最優秀賞",  desc: "", major: true },
    { date: "2025.07.21", title: "Vket Real in Sapporo 参加", desc: "リアル開催のVketイベントに参加。", major: false },
    { date: "2025.07.19", title: "全日本AIハッカソン 北海道大会 参加", desc: "ビギナー部門に出場。", major: false },
    { date: "2025.06.07", title: "北大祭VR体験会", desc: "北海道大学祭にてVR体験会を実施。", major: false },
    { date: "2025.04.01", endDate: "2026.03.31", title: "大学入学・1年次", desc: "C言語を起点に低レイヤの学習を開始。", major: true },
    { date: "2023.04.01", endDate: "2025.03.31", title: "日常生活の記録ツールを制作・運用", desc: "高校時代から3年分のログを蓄積中。", major: false },
    { date: "2022.04.01", title: "JavaScriptに触れる", desc: "高校生の頃からWeb制作を開始。", major: false },
  ] as { date: string; endDate?: string; title: string; desc?: string; major?: boolean }[]),

  pcs: [
    {
      kind: "Laptop",
      specs: [
        ["OS",  "Windows 11 Home"],
        ["CPU", "Intel Core i5-1335U"],
        ["GPU", "Intel Iris Xe"],
        ["RAM", "32 GB"],
        ["SSD", "NVMe 1 TB"],
      ] as [string, string][],
      note: "外出先で、大学課題・コーディング作業などタスクごとのタスクビューを切り替えて使用。",
    },
    {
      kind: "Desktop",
      specs: [
        ["OS",  "Windows 11 Pro"],
        ["CPU", "Intel Core i7-12700"],
        ["GPU", "NVIDIA RTX 3050"],
        ["RAM", "32 GB"],
        ["SSD", "NVMe 1 TB × 2"],
      ] as [string, string][],
      note: "そろそろGPUをアップグレードして、VR開発とローカルAIモデルの実行環境を強化したい。",
    },
  ],
};
