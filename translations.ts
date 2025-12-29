
import { Language } from './types';

export const TRANSLATIONS = {
  'en-GB': {
    title: "Dynamic Strength",
    setup: "Setup",
    intro: "Introduction",
    discovery: "Strength Discovery",
    phase1: "Phase 1: Weigh & Assess",
    phase2: "Phase 2: Venture",
    phase3: "Phase 3: Evaluate & Scale",
    workbook: "The WAVES Cycle",
    system: "Dynamic System",
    dashboard: "Daily Routine",
    weekly: "Weekly Reflection",
    quarterly: "Quarterly Check-In",
    
    // Welcome
    welcomeTitle: "Build Strength that Multiplies",
    welcomeDesc: "This isn't another goal-setting tool. It's an invitation to approach your growth differently: by building on what already works (Strength) rather than fixing what doesn't (Deficit).",
    principlesTitle: "How We Work",
    principles: [
      { t: "Action over Theory", d: "Clarity comes from movement. Don't overthink." },
      { t: "Evidence-Based", d: "We look for proof of what works for YOU, not generic formulas." },
      { t: "Amplify, Not Fix", d: "Direction emerges from what you leverage, not what you eliminate." }
    ],
    beginDiscovery: "Start the WAVES Cycle",

    // Phase 0: Discovery
    identifyTitle: "Identify",
    identifyDesc: "Spot your initial strength hypotheses using AI reflection.",
    externalizeTitle: "Externalize",
    externalizeDesc: "Gather evidence from your past and peers.",
    anchorTitle: "Anchor",
    anchorDesc: "Name the patterns that hold you steady in uncertainty.",
    discoveryTitle: "Strength Spotting",
    discoverySubtitle: "Recall moments when you were at your best: effective AND energized.",
    aiReflectionGuide: "AI Strength Spotter",
    sparkPrompt: "Spark Prompt",
    next: "Next",
    jotDown: "Capture your honest reflection below. No right or wrong answers.",
    analyzeSuggest: "Analyze & Suggest Themes",
    selectedHypothesis: "Top 5 Strength Hypotheses",
    selectUpTo5: "Select up to 5 themes to carry into Phase 1.",
    slotEmpty: "Slot empty",
    quickSelect: "Quick Select",
    saveStartPhase1: "Begin Phase 1: Weigh & Assess",
    
    // Discovery - BNO Deck Specific
    bnoContextToggle: "Using the HK BNO / Migrant Workbook?",
    drawCard: "Start 6-Question Journey",
    skipCard: "Skip / New Question",
    cardContext: "Reflecting on Question",
    journeyTitle: "The Migration Arc",
    journeyIntro: "We will answer 6 questions to explore your story from Roots (Past) through Transition (The Shift) to Growth (Future).",
    stageRoots: "Roots (Past)",
    stageTransition: "The Shift (Transition)",
    stageGrowth: "Growth (Future)",
    nextCard: "Next Question",
    analyzeJourney: "Analyze Full Journey",
    journeyProgress: "Question",
    
    // Phase 1: Weigh & Assess
    phase1Title: "Phase 1: Weigh & Assess",
    phase1Subtitle: "\"The past is not a performance review. It's a resource library.\"",
    miningPastTitle: "WEIGH: Mining the Past",
    miningPastDesc: "Before asking others, look at your own year. What created genuine momentum?",
    momentumLabel: "What created genuine momentum?",
    momentumHelp: "What gave you energy? What felt aligned? What patterns created ease?",
    drainingLabel: "What consumed energy without building capacity?",
    drainingHelp: "What effort didn't create leverage? What drained you even if it was 'productive'?",
    assessTitle: "ASSESS: External Evidence",
    assessDesc: "Now, let's validate your self-knowledge with external eyes.",
    top5Hypothesis: "Your Strength Hypotheses",
    externalStories: "External Stories",
    addStory: "Add Evidence",
    askPeople: "Ask 3-5 people: \"When have you seen me at my best?\" Record verbatim.",
    saveContinuePhase2: "Continue to Phase 2: Venture",
    strengthPlaceholder: "Strength #",
    storyPlaceholder: "\"You were amazing when you...\"",
    noStoriesYet: "No stories added yet. Click \"Add Evidence\" to begin.",

    // Phase 2: Venture
    phase2Title: "Phase 2: Venture",
    phase2Subtitle: "Map your landscape with directional intentions.",
    directionalIntention: "Directional Intention",
    yearlyThemeLabel: "One Focused Area or Theme",
    yearlyThemeHelp: "Not a rigid goal, but an intention lens. What territory are you drawn to explore?",
    suggestTheme: "Suggest Theme from Phase 1 Strengths",
    phase1Insight: "Context from Phase 1",
    phase1InsightHelp: "You identified this drain earlier. Now, define a boundary to manage it.",
    candidateAnchors: "Candidate Anchors (From Phase 1)",
    candidateAnchorsHelp: "Select candidates to promote them to Core Anchors.",
    deconstruct: "Deconstruct Your Evidence",
    echoCheck: "Echo Check",
    actionPlaceholder: "Action: What specifically did you do?",
    feelingPlaceholder: "Feeling: How was your energy?",
    patternPlaceholder: "Pattern: What strength was at play?",
    boundaryCheck: "Boundary Check",
    boundaryCheckIntro: "Protect your capacity by identifying what drains you.",
    drainingPattern: "Draining Pattern",
    drainingPatternHelp: "Activities that don't build transferrable capability.",
    reframedBoundary: "Reframed Boundary",
    reframedBoundaryHelp: "Give yourself permission to adjust. (e.g. 'I will pause...', 'I will ask for help...')",
    suggestBoundary: "Suggest Reframe",
    selectBoundary: "Select a boundary idea:",
    finalAnchors: "Name Your Core Anchors",
    finalAnchorsDesc: "These are your 3-5 unique Core Strengths to leverage in uncertainty.",
    anchorDefinition: "A pattern you consistently use that generates supportive outcomes. It feels generative (builds energy) rather than depleting.",
    anchorContext: "We call them 'Anchors' because they hold you steady.",
    proceedPhase3: "Continue to Phase 3: Evaluate & Scale",
    showDefinitions: "View Key Definitions",
    hideDefinitions: "Hide Definitions",
    definitions: [
      {
        term: "Strength",
        def: "A pattern you consistently use that generates supportive outcomes. It feels generative rather than depleting."
      },
      {
        term: "Capability",
        def: "What you can do effectively in specific contexts. Built through repeated practice. You have evidence it works."
      },
      {
        term: "Resource",
        def: "Anything you can draw on to create outcomes (Internal: strengths, energy. External: people, tools)."
      },
      {
        term: "Capacity",
        def: "How much complexity/uncertainty you can hold before effectiveness drops."
      }
    ],
    // UI Helpers Phase 2
    noPhase1Strengths: "No Phase 1 strengths found.",
    themePlaceholder: "e.g., Deepening Expertise, Building Community...",
    phase1StoriesReq: "Please add stories in Phase 1 first.",
    yes: "Yes",
    no: "No",
    mostly: "Mostly",
    noDrainIdentified: "No drain identified in Phase 1",
    boundaryDescription: "Set a boundary that protects your capacity. It doesn't mean stopping work, but changing <i>how</i> you engage.",
    whatIsAnchor: "What is an Anchor?",
    noPatternsFound: "No patterns found yet.",
    anchorPlaceholder: "Core Anchor #",

    // Phase 3: Scale
    phase3Title: "Phase 3: Evaluate & Scale",
    phase3Subtitle: "From Planning to Practice. Awareness alone doesn't improve performance; deliberate practice does.",
    territory: "Territory (Possibility Mapping)",
    territoryOptions: {
        'Work & Career': 'Work & Career',
        'Resources & Assets': 'Resources & Assets',
        'Relationships & Community': 'Relationships & Community',
        'Learning & Growth': 'Learning & Growth',
        'Wellbeing & Presence': 'Wellbeing & Presence',
        'Creativity & Expression': 'Creativity & Expression',
        'Environment & Space': 'Environment & Space',
        'Leadership': 'Leadership'
    },
    poweringAnchor: "Powering Anchor",
    shiftAction: "The 5% Shift",
    suggestIdeas: "AI Suggestions",
    selectAnchor: "Select an Anchor...",
    selectIdea: "Select an idea:",
    practicePlaceholder: "Small, observable action (Morning Anchor)",
    addNewShift: "Add New Practice",
    goToDashboard: "Go to Daily Routine",

    // Dashboard (Updated for Gamification)
    dailyDashboard: "Daily Routine",
    consistentSteps: "Small moves compound into sustained momentum.",
    totalEntries: "Logs",
    todaysLog: "Morning Anchor & Evening Reflection",
    anchorUsed: "Which Anchor will/did I use intentionally?",
    reflectionShifted: "Reflection: What worked well? What's one small adjustment?",
    logEntry: "Log Day & Get Spark",
    activeShifts: "Current Practices",
    momentum: "Momentum",
    recentEntries: "Recent Reflections",
    noEntries: "Start your practice today.",
    energyLabel: "Energy After Practice",
    energyLow: "Drained",
    energyHigh: "Energized",
    strengthSpark: "Strength Echo",
    sparkSubtitle: "Your personal feedback loop.",
    noActiveShifts: "No active shifts defined.",
    
    // Weekly
    weeklyTitle: "Weekly Reflection",
    weeklyContext: "Your Week in Motion",
    weeklyContextDesc: "Review your data to spot patterns before you reflect.",
    keyMoments: "Key Moments",
    autoDraft: "Auto-Draft with AI",
    analyzingLogs: "Analyzing your week...",
    winsLabel: "Momentum Wins",
    challengesLabel: "Adjustments Needed",
    themeLabel: "Theme of the Week",
    weeklySaved: "Weekly reflection saved!",
    noDataYet: "No data yet",
    noLogsThisWeek: "No logs recorded this week.",
    weeklyThemePlaceholder: "e.g. The Week of Persistence",
    
    // Quarterly
    quarterlyTitle: "Quarterly Check-In",
    quarterlyDesc: "Every 3 months, pause to track what really shifts. Measure behavior change, not just feelings.",
    quarterlyRewind: "Quarterly Rewind (Last 90 Days)",
    topAnchor: "Top Anchor",
    totalLogs: "Total Logs",
    avgEnergy: "Avg Energy",
    rewindIntro: "Before you reflect, look at your actual data.",
    saveAndAnalyze: "Save & Generate Strategic Outlook",
    analyzing: "Analyzing Quarter...",
    strategicOutlook: "Strategic Outlook (AI)",
    themesObserved: "Themes Observed",
    growthTrajectory: "Growth Trajectory",
    nextQuarterFocus: "Next Quarter Focus",
    
    q_shifted: "1. What shifted?",
    q_shifted_help: "What improved in your decisions or impacts? What evidence shows growing capability?",
    q_flow: "2. What's creating flow?",
    q_flow_help: "Where are you seeing energy and meaningful impacts?",
    q_adjust: "3. What needs adjustment?",
    q_adjust_help: "Where are patterns not serving you? What experiment could you try?",
    q_emerging: "4. 什麼正在浮現？",
    q_emerging_help: "Unexpected opportunities or new capabilities becoming visible?",
    saveQuarterly: "Save Check-In",
    noWeeklyReflections: "No weekly reflections found.",
    pastCheckIns: "Past Check-Ins",
    analyzedTag: "Analyzed",
    noPastCheckIns: "No past check-ins recorded.",

    // Prompts
    drainPrompts: [
      "Work repeated the same way every time?",
      "Effort that didn't create leverage?",
      "Where did you lack transferrable capability?"
    ],
    prompts: [
      "Recall a moment when you felt completely 'yourself' and energized. What was happening?",
      "Think about a high-stakes situation where you stayed calm. What resources did you draw on?",
      "What is a specific problem friends or colleagues frequently ask you to help solve?",
      "Think about a task you learned quickly while others struggled. Why did it click for you?",
      "Describe a recent time you lost track of time (Flow). What activity absorbed you?"
    ],
    
    // Coach
    coachWelcome: "Hi! I'm your Dynamic Strength Assistant. I follow the WAVES Cycle to help you build momentum. Where should we start?",
    coachError: "I'm having trouble connecting. Please try again later.",
    askGuidance: "Ask for guidance on the WAVES cycle...",
    
    // Help & Guide
    helpTitle: "Workbook Guide",
    helpClose: "Close Guide",
    helpTabs: {
        start: "Quick Start",
        phases: "The Workflow",
        glossary: "Key Terms"
    },
    helpContent: {
        start: [
            "**Welcome to Dynamic Strength.** This isn't just a workbook; it's a practice ground.",
            "**1. The Rule of 5:** A strength isn't proven by a single story. Aim to capture **4-5 stories** across different life areas (Work, Relationships, Crisis) to build a 'Constellation of Evidence'.",
            "**2. Your AI Partner:** The Strength Coach isn't just a chatbot. It's an **Experience Engineer**. It will interview you to uncover patterns you might miss. Let it guide you.",
            "**3. The Process:** \n- **Discovery:** Identify hypotheses.\n- **Phase 1:** Gather evidence (The Constellation).\n- **Phase 2:** Define Anchors & Boundaries.\n- **Phase 3:** Scale with 5% Shifts.",
            "**4. Daily Practice:** Once setup is complete, use the **Dashboard** to log small daily wins. This builds the data for your Quarterly Reviews."
        ],
        phases: [
            { title: "Discovery", desc: "Identify initial hypotheses using the AI Strength Spotter or Migration Arc." },
            { title: "Phase 1: Weigh & Assess", desc: "Build your Constellation of Evidence. Gather 4-5 stories from diverse contexts (Work, Home, Crisis) to prove your strengths are real and transferable." },
            { title: "Phase 2: Venture", desc: "Define your 'Directional Intention'. Convert evidence into Core Anchors and set clear Boundaries against energy drains." },
            { title: "Phase 3: Evaluate & Scale", desc: "Turn anchors into action. Design specific '5% Shift' micro-practices for high-impact territories." },
            { title: "Daily Routine", desc: "The engine room. Log your daily practice, track energy levels, and get instant 'Strength Sparks' (feedback) from the AI." }
        ]
    },

    // Notifications
    notifications: {
      storyAnalyzed: "Story analyzed!",
      failedAnalyze: "Analysis failed.",
      selectTerritory: "Select Territory and Anchor first.",
      failedSuggest: "Suggestion failed.",
      strengthsIdentified: "Strengths identified.",
      failedReflect: "Reflection analysis failed.",
      maxStrengths: "Max 5 strengths allowed.",
      savedPhase1: "Saved to Phase 1.",
      progressSaved: "Progress saved.",
      anchorsLocked: "Anchors locked.",
      systemReady: "System ready.",
      dailyLogged: "Momentum Captured!",
      quarterlySaved: "Quarterly check-in saved.",
      missingDrain: "Define a draining pattern first.",
      jumpingToPhase1: "Jumping to Phase 1 to review your new insights."
    }
  },
  'zh-HK': {
    title: "動態優勢",
    setup: "設定",
    intro: "簡介",
    discovery: "發掘優勢",
    phase1: "第一階段：衡量與評估",
    phase2: "第二階段：探索",
    phase3: "第三階段：評估與擴展",
    workbook: "WAVES 循環",
    system: "動態系統",
    dashboard: "每日日常",
    weekly: "每週反思",
    quarterly: "季度檢視",
    
    // Welcome
    welcomeTitle: "建立倍增的優勢",
    welcomeDesc: "這不是另一個目標設定工具。這是一個邀請，讓你以不同的方式成長：建立在已經有效的基礎上（優勢），而不是修補無效的（缺失）。",
    principlesTitle: "我們的工作方式",
    principles: [
      { t: "行動重於理論", d: "清晰來自於行動，不要過度思考。" },
      { t: "基於證據", d: "我們尋找對「你」有效的證據，而非通用公式。" },
      { t: "放大而非修補", d: "方向來自於你如何運用優勢，而非你消除了什麼。" }
    ],
    beginDiscovery: "開始 WAVES 循環",

    // Phase 0
    identifyTitle: "識別",
    identifyDesc: "使用 AI 反思工具識別你的初步優勢假設。",
    externalizeTitle: "外在印證",
    externalizeDesc: "從過去和他人那裡收集證據。",
    anchorTitle: "錨點",
    anchorDesc: "命名那些在不確定中讓你保持穩定的模式。",
    discoveryTitle: "優勢識別",
    discoverySubtitle: "回想那些你表現最佳且充滿活力的時刻。",
    aiReflectionGuide: "AI 優勢識別器",
    sparkPrompt: "靈感提示",
    next: "下一個",
    jotDown: "在下方記下你的誠實反思。沒有對錯之分。",
    analyzeSuggest: "分析並建議主題",
    selectedHypothesis: "首 5 個優勢假設",
    selectUpTo5: "選擇最多 5 個主題進入第一階段。",
    slotEmpty: "空缺",
    quickSelect: "快速選擇",
    saveStartPhase1: "開始第一階段：衡量與評估",
    
    // Discovery - BNO Deck Specific
    bnoContextToggle: "使用 BNO / 移英港人練習冊？",
    drawCard: "開始 6 問題旅程",
    skipCard: "跳過 / 換一題",
    cardContext: "反思問題",
    journeyTitle: "移民歷程",
    journeyIntro: "我們將抽取 6 個問題，從根源（過去）、轉變（變動）到成長（未來）探索你的故事。",
    stageRoots: "根源 (過去)",
    stageTransition: "轉變 (變動)",
    stageGrowth: "成長 (未來)",
    nextCard: "下一題",
    analyzeJourney: "分析完整旅程",
    journeyProgress: "問題",

    // Phase 1
    phase1Title: "第一階段：衡量與評估",
    phase1Subtitle: "「過去不是績效評估，而是一個資源庫。」",
    miningPastTitle: "衡量：挖掘過去",
    miningPastDesc: "在詢問他人之前，先審視自己的一年。什麼創造了真正的動力？",
    momentumLabel: "什麼創造了真正的動力？",
    momentumHelp: "什麼給了你能量？什麼感覺是一致的？什麼模式創造了輕鬆感？",
    drainingLabel: "什麼消耗了能量卻沒有建立能力？",
    drainingHelp: "什麼努力沒有創造槓桿作用？即使「有生產力」但讓你精疲力竭的是什麼？",
    assessTitle: "評估：外在證據",
    assessDesc: "現在，讓我們用外在的眼光來驗證你的自我認知。",
    top5Hypothesis: "你的優勢假設",
    externalStories: "外在故事",
    addStory: "新增證據",
    askPeople: "詢問 3-5 人：「你何時見過我表現最好？」逐字記錄。",
    saveContinuePhase2: "繼續第二階段：探索",
    strengthPlaceholder: "優勢 #",
    storyPlaceholder: "「當你...的時候真的很棒」",
    noStoriesYet: "尚未新增故事。點擊「新增證據」開始。",

    // Phase 2
    phase2Title: "第二階段：探索 (Venture)",
    phase2Subtitle: "用方向性意圖繪製你的藍圖。",
    directionalIntention: "方向性意圖",
    yearlyThemeLabel: "一個專注的領域或主題",
    yearlyThemeHelp: "不是僵化的目標，而是一個意圖透鏡。你被吸引去探索哪個領域？",
    suggestTheme: "從第一階段優勢建議主題",
    phase1Insight: "第一階段的背景",
    phase1InsightHelp: "你早前識別了這個消耗點。現在，定義一個界線來管理它。",
    candidateAnchors: "候選錨點 (來自第一階段)",
    candidateAnchorsHelp: "選擇候選項目將其晉升為核心錨點。",
    deconstruct: "解構你的證據",
    echoCheck: "共鳴檢查",
    actionPlaceholder: "行動：你具體做了什麼？",
    feelingPlaceholder: "感受：你的能量如何？",
    patternPlaceholder: "模式：什麼優勢在起作用？",
    boundaryCheck: "界線檢查",
    boundaryCheckIntro: "透過識別消耗你的事物來保護你的容量。",
    drainingPattern: "耗能模式",
    drainingPatternHelp: "那些無法建立可轉移能力的活動。",
    reframedBoundary: "重構界線",
    reframedBoundaryHelp: "允許自己進行調整。（例如：「我會暫停...」、「我會尋求幫助...」）",
    suggestBoundary: "建議重構",
    selectBoundary: "選擇一個界線想法：",
    finalAnchors: "命名你的核心錨點",
    finalAnchorsDesc: "這是你 3-5 個獨特的核心優勢，用於在不確定中發揮槓桿作用。",
    anchorDefinition: "一種你持續使用並產生支持性成果的模式。它感覺是再生性的（增加能量），而不是消耗性的。",
    anchorContext: "我們稱之為「錨點」，因為它們讓你保持穩定。",
    proceedPhase3: "繼續第三階段：評估與擴展",
    showDefinitions: "查看關鍵定義",
    hideDefinitions: "隱藏定義",
    definitions: [
      {
        term: "優勢 (Strength)",
        def: "一種你持續使用並產生支持性成果的模式。它感覺是再生性的，而不是消耗性的。"
      },
      {
        term: "能力 (Capability)",
        def: "你在特定情境下能有效執行的事。透過重複練習建立。你有證據證明它有效。"
      },
      {
        term: "資源 (Resource)",
        def: "任何你可以用來創造成果的東西（內在：優勢、能量。外在：人脈、工具）。"
      },
      {
        term: "容量 (Capacity)",
        def: "在效能下降之前，你能承受多少複雜性/不確定性。"
      }
    ],
    // UI Helpers Phase 2
    noPhase1Strengths: "未找到第一階段的優勢。",
    themePlaceholder: "例如：深化專業、建立社群...",
    phase1StoriesReq: "請先在第一階段新增故事。",
    yes: "是",
    no: "否",
    mostly: "大部分",
    noDrainIdentified: "第一階段未識別出消耗點",
    boundaryDescription: "設定一個保護你能量的界線。這不代表停止工作，而是改變你<i>投入的方式</i>。",
    whatIsAnchor: "什麼是錨點？",
    noPatternsFound: "尚未發現模式。",
    anchorPlaceholder: "核心錨點 #",

    // Phase 3
    phase3Title: "第三階段：評估與擴展",
    phase3Subtitle: "從計畫到實踐。光有意識不會提高表現；刻意練習才會。",
    territory: "範疇 (可能性繪圖)",
    territoryOptions: {
        'Work & Career': '工作與事業',
        'Resources & Assets': '資源與資產',
        'Relationships & Community': '人際關係與社群',
        'Learning & Growth': '學習與成長',
        'Wellbeing & Presence': '身心健康與當下',
        'Creativity & Expression': '創意與表達',
        'Environment & Space': '環境與空間',
        'Leadership': '領導力'
    },
    poweringAnchor: "驅動錨點",
    shiftAction: "5% 微調",
    suggestIdeas: "AI 建議",
    selectAnchor: "選擇錨點...",
    selectIdea: "選擇一個想法：",
    practicePlaceholder: "微小、可觀察的行動 (晨間錨點)",
    addNewShift: "新增練習",
    goToDashboard: "前往每日日常",

    // Dashboard
    dailyDashboard: "每日日常",
    consistentSteps: "微小的行動累積成持續的動力。",
    totalEntries: "日誌",
    todaysLog: "晨間錨點 & 晚間反思",
    anchorUsed: "我將/我有意地使用了哪個錨點？",
    reflectionShifted: "反思：什麼運作良好？有一個什麼小調整？",
    logEntry: "記錄並獲得火花",
    activeShifts: "當前練習",
    momentum: "動力",
    recentEntries: "最近反思",
    noEntries: "今天開始你的練習。",
    energyLabel: "練習後的能量",
    energyLow: "消耗",
    energyHigh: "充能",
    strengthSpark: "優勢回響",
    sparkSubtitle: "你的個人反饋循環。",
    noActiveShifts: "未定義當前的練習。",

    // Weekly
    weeklyTitle: "每週反思",
    weeklyContext: "你的一週動態",
    weeklyContextDesc: "在反思前，先檢視你的數據以發現模式。",
    keyMoments: "關鍵時刻",
    autoDraft: "AI 自動草擬",
    analyzingLogs: "正在分析你的一週...",
    winsLabel: "動力勝利",
    challengesLabel: "需要調整",
    themeLabel: "本週主題",
    weeklySaved: "每週反思已儲存！",
    noDataYet: "尚無數據",
    noLogsThisWeek: "本週無日誌記錄。",
    weeklyThemePlaceholder: "例如：堅持的一週",

    // Quarterly
    quarterlyTitle: "季度檢視",
    quarterlyDesc: "每 3 個月，暫停一下追蹤什麼真正改變了。衡量行為改變，而不僅僅是感覺。",
    quarterlyRewind: "季度回顧 (過去 90 天)",
    topAnchor: "最高頻錨點",
    totalLogs: "總日誌",
    avgEnergy: "平均能量",
    rewindIntro: "在反思之前，看看你的實際數據。",
    saveAndAnalyze: "儲存並生成策略展望",
    analyzing: "正在分析季度...",
    strategicOutlook: "策略展望 (AI)",
    themesObserved: "觀察到的主題",
    growthTrajectory: "成長軌跡",
    nextQuarterFocus: "下季焦點",

    q_shifted: "1. 什麼改變了？",
    q_shifted_help: "你的決定或影響有什麼改善？有什麼證據顯示能力增長？",
    q_flow: "2. 什麼正在創造心流？",
    q_flow_help: "你在哪裡看到能量和有意義的影響？",
    q_adjust: "3. 什麼需要調整？",
    q_adjust_help: "哪些模式不再為你服務？你可以嘗試什麼實驗？",
    q_emerging: "4. 什麼正在浮現？",
    q_emerging_help: "意想不到的機會或新能力變得可見？",
    saveQuarterly: "儲存檢視",
    noWeeklyReflections: "未找到每週反思。",
    pastCheckIns: "過往檢視",
    analyzedTag: "已分析",
    noPastCheckIns: "無過往檢視記錄。",

    // Prompts
    drainPrompts: [
      "每次都以相同方式重複的工作？",
      "沒有創造槓桿作用的努力？",
      "你在哪裡缺乏可轉移的能力？"
    ],
    prompts: [
      "回想一個你感到完全「做自己」且充滿活力的時刻。當時發生了什麼？",
      "回想一個你在高壓下仍保持冷靜的情境。你動用了什麼資源？",
      "朋友或同事經常請你幫忙解決什麼具體問題？",
      "想一個別人覺得難但你學得很快的任務。為什麼你這麼快上手？",
      "描述最近一次你廢寢忘食的經歷 (心流)。什麼活動讓你如此投入？"
    ],
    
    // Coach
    coachWelcome: "你好！我是你的動態優勢助理。我遵循 WAVES 循環來協助你建立動力。我們從哪裡開始？",
    coachError: "我現在連接有點問題，請稍後再試。",
    askGuidance: "詢問關於 WAVES 循環的指引...",
    
    // Help & Guide
    helpTitle: "使用指南",
    helpClose: "關閉指南",
    helpTabs: {
        start: "快速開始",
        phases: "工作流程",
        glossary: "關鍵術語"
    },
    helpContent: {
        start: [
            "**歡迎來到動態優勢。** 這不僅是一本練習冊，而是一個修練場。",
            "**1. 五項法則 (The Rule of 5)：** 一個故事不足以證明優勢。目標是在不同生活範疇（工作、關係、危機）收集 **4-5 個故事**，建立你的「優勢星系 (Constellation of Evidence)」。",
            "**2. 你的 AI 夥伴：** 優勢教練不僅僅是聊天機器人，它是你的 **體驗工程師**。它會透過訪談幫你挖掘你可能忽略的模式。請讓它引導你。",
            "**3. 流程：** \n- **發掘：** 識別假設。\n- **第一階段：** 收集證據（星系）。\n- **第二階段：** 定義錨點與界線。\n- **第三階段：** 透過 5% 微調進行擴展。",
            "**4. 每日練習：** 設定完成後，使用 **每日日常** 記錄小勝利。這將為你的季度檢視累積數據。"
        ],
        phases: [
            { title: "發掘優勢", desc: "使用 AI 優勢識別器或移民歷程問題識別初步假設。" },
            { title: "第一階段：衡量與評估", desc: "建立你的證據星系。收集 4-5 個來自不同情境（工作、家庭、危機）的故事，以證明你的優勢是真實且可轉移的。" },
            { title: "第二階段：探索", desc: "定義你的「方向性意圖」。將證據轉化為核心錨點，並針對能量消耗設定清晰的界線。" },
            { title: "第三階段：評估與擴展", desc: "將錨點轉化為行動。為高影響力的生活範疇設計具體的「5% 微調」練習。" },
            { title: "每日日常", desc: "引擎室。記錄你的每日練習、追蹤能量，並獲得 AI 的即時「優勢回響」(Strength Sparks)。" }
        ]
    },

    // Notifications
    notifications: {
      storyAnalyzed: "故事已分析！",
      failedAnalyze: "分析失敗。",
      selectTerritory: "請先選擇範疇和錨點。",
      failedSuggest: "建議失敗。",
      strengthsIdentified: "已識別優勢。",
      failedReflect: "反思分析失敗。",
      maxStrengths: "最多 5 項。",
      savedPhase1: "已儲存至第一階段。",
      progressSaved: "進度已儲存。",
      anchorsLocked: "錨點已鎖定。",
      systemReady: "系統就緒。",
      dailyLogged: "動力已捕捉！",
      quarterlySaved: "季度檢視已儲存。",
      missingDrain: "請先定義耗能模式。",
      jumpingToPhase1: "正在跳轉至第一階段以檢視你的新洞察。"
    }
  }
};
