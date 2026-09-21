// Copied from the existing Yanku draft template module, 2026-09-06.
                                 
             
                
                      
  

                             
             
               
                             
  

                           
                
                     
                   
               
                                      
                                
                         
  

                       
                   
                
  

export const DRAFT_TEMPLATES                  = [
  {
    id: "work-conference",
    name: "年度或半年工作会",
    slots: [
      { id: "opening", label: "开头定调", description: "说明会议目的，统一思想和方向。" },
      { id: "achievements", label: "总结成绩", description: "用事实和数据回顾阶段成果。" },
      { id: "situation", label: "分析形势", description: "研判环境、机遇和挑战。" },
      { id: "problems", label: "指出问题", description: "直面短板，明确差距和成因。" },
      { id: "tasks", label: "部署任务", description: "提出重点工作、责任和节点。" },
      { id: "governance", label: "党建保障", description: "把党的领导和组织保障落到任务。" },
      { id: "closing", label: "结尾动员", description: "坚定信心，凝聚行动合力。" }
    ]
  },
  {
    id: "deployment",
    name: "专题部署会",
    slots: [
      { id: "opening", label: "说明背景", description: "讲清为什么现在部署这项工作。" },
      { id: "situation", label: "统一认识", description: "说明重要性、紧迫性和总体要求。" },
      { id: "tasks", label: "明确目标", description: "界定目标、范围和主要任务。" },
      { id: "measures", label: "细化举措", description: "列出抓手、节点和责任主体。" },
      { id: "governance", label: "压实责任", description: "强化组织领导和协同保障。" },
      { id: "closing", label: "强调纪律", description: "提出执行、监督和作风要求。" }
    ]
  },
  {
    id: "party-building",
    name: "党建工作会",
    slots: [
      { id: "opening", label: "政治定调", description: "明确政治方向和根本要求。" },
      { id: "achievements", label: "总结党建成效", description: "回顾党建工作进展和实践成效。" },
      { id: "problems", label: "分析突出问题", description: "查找责任、基层基础和融合短板。" },
      { id: "tasks", label: "部署重点任务", description: "明确理论武装、组织建设和融合要求。" },
      { id: "governance", label: "压实管党治党责任", description: "把责任传导到组织和岗位。" },
      { id: "closing", label: "提出行动要求", description: "以党建实绩保障改革发展。" }
    ]
  },
  {
    id: "research-talk",
    name: "调研座谈讲话",
    slots: [
      { id: "opening", label: "表明来意", description: "说明调研目的和关注重点。" },
      { id: "achievements", label: "肯定工作", description: "概括亮点、成效和基层实践。" },
      { id: "problems", label: "回应问题", description: "回应诉求并分析制约因素。" },
      { id: "tasks", label: "提出要求", description: "给出方向、方法和重点任务。" },
      { id: "closing", label: "表达期望", description: "鼓励一线担当作为、再创成效。" }
    ]
  },
  {
    id: "work-summary",
    name: "工作总结或报告",
    slots: [
      { id: "opening", label: "总体情况", description: "概括工作背景和总体判断。" },
      { id: "achievements", label: "主要成绩", description: "按主题呈现事实、数据和案例。" },
      { id: "experience", label: "经验认识", description: "提炼规律、方法和长效机制。" },
      { id: "problems", label: "问题不足", description: "实事求是分析差距。" },
      { id: "tasks", label: "下一步安排", description: "明确重点、责任和时间节点。" }
    ]
  },
  {
    id: "statement",
    name: "表态发言",
    slots: [
      { id: "opening", label: "政治态度", description: "表明立场、态度和行动自觉。" },
      { id: "situation", label: "岗位认识", description: "说明职责使命和任务要求。" },
      { id: "tasks", label: "履职举措", description: "提出可执行的工作安排。" },
      { id: "governance", label: "团结协作", description: "强调班子配合和服务大局。" },
      { id: "closing", label: "廉洁自律", description: "作出纪律、作风和廉洁承诺。" }
    ]
  },
  {
    id: "theory-study",
    name: "理论学习发言",
    slots: [
      { id: "opening", label: "学习认识", description: "说明学习主题和总体体会。" },
      { id: "situation", label: "核心要义", description: "把握重要论述的精神实质。" },
      { id: "achievements", label: "联系实际", description: "结合工作基础和实践认识。" },
      { id: "problems", label: "问题反思", description: "检视思想和工作差距。" },
      { id: "tasks", label: "贯彻举措", description: "提出转化运用和落实安排。" }
    ]
  },
  {
    id: "ppt-outline",
    name: "汇报PPT页纲",
    slots: [
      { id: "opening", label: "封面与核心判断", description: "用一句话明确汇报主题。" },
      { id: "situation", label: "背景与形势", description: "说明政策背景和外部环境。" },
      { id: "achievements", label: "成绩与数据", description: "呈现关键事实、指标和案例。" },
      { id: "problems", label: "问题与挑战", description: "概括主要矛盾和风险。" },
      { id: "thinking", label: "总体思路", description: "明确目标、原则和路径。" },
      { id: "tasks", label: "重点任务", description: "形成分页面的任务安排。" },
      { id: "governance", label: "保障措施", description: "说明组织、资源和机制保障。" },
      { id: "closing", label: "结束页", description: "提炼行动号召或汇报结论。" }
    ]
  }
];

export function defaultDraftConfig()              {
  return {
    title: "未命名写作任务",
    templateId: DRAFT_TEMPLATES[0].id,
    audience: "",
    tone: "庄重有力",
    assignments: {},
    facts: {},
    pendingItems: []
  };
}

function safeText(value         , maximum        ) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function normalizeDraftConfig(value         )              {
  const fallback = defaultDraftConfig();
  if (!value || typeof value !== "object") {
    return fallback;
  }
  const source = value                        ;
  const template = DRAFT_TEMPLATES.find((item) => item.id === source.templateId) ??
    DRAFT_TEMPLATES[0];
  const allowedSlots = new Set(template.slots.map((slot) => slot.id));
  const assignments                         = {};
  if (source.assignments && typeof source.assignments === "object") {
    for (const [blockId, slotId] of Object.entries(source.assignments).slice(0, 1000)) {
      if (
        /^[a-z0-9][a-z0-9_-]{1,63}$/i.test(blockId) &&
        typeof slotId === "string" &&
        allowedSlots.has(slotId)
      ) {
        assignments[blockId] = slotId;
      }
    }
  }
  const facts                         = {};
  if (source.facts && typeof source.facts === "object") {
    for (const slot of DRAFT_TEMPLATES.flatMap(t => t.slots)) {
      const fact = safeText(source.facts[slot.id], 1200);
      if (fact) {
        facts[slot.id] = fact;
      }
    }
  }
  const pendingItems = Array.isArray(source.pendingItems)
    ? source.pendingItems
        .map((item) => safeText(item, 120))
        .filter(Boolean)
        .slice(0, 30)
    : [];
  return {
    title: safeText(source.title, 80) || fallback.title,
    templateId: template.id,
    audience: safeText(source.audience, 80),
    tone: safeText(source.tone, 40) || fallback.tone,
    assignments,
    facts,
    pendingItems
  };
}

export function loadDraftConfig() {
  try {
    return normalizeDraftConfig(
      JSON.parse(localStorage.getItem("writing-draft-v2") ?? "null"),
    );
  } catch {
    return defaultDraftConfig();
  }
}

export function templateForDraft(config             ) {
  return DRAFT_TEMPLATES.find((item) => item.id === config.templateId) ??
    DRAFT_TEMPLATES[0];
}

export function suggestSlotIdForBlock(
  block                ,
  templateId        ,
  suggestedLabel         ,
) {
  const template = DRAFT_TEMPLATES.find((item) => item.id === templateId) ??
    DRAFT_TEMPLATES[0];
  if (suggestedLabel) {
    const suggested = template.slots.find(
      (slot) =>
        slot.label.includes(suggestedLabel) || suggestedLabel.includes(slot.label),
    );
    if (suggested) {
      return suggested.id;
    }

    const suggestedPriorities                           = {
      成绩与问题: ["problems", "achievements", "situation"],
      任务部署: ["tasks", "measures", "thinking"],
      形势判断: ["situation", "opening"],
      收束提气: ["closing"],
      党建保障: ["governance", "tasks"],
      组织保障: ["governance", "tasks"],
      工作要求: ["tasks", "measures", "thinking"],
      经验认识: ["experience", "achievements"],
      开头定调: ["opening"],
    };
    for (const id of suggestedPriorities[suggestedLabel] ?? []) {
      if (template.slots.some((slot) => slot.id === id)) {
        return id;
      }
    }
  }
  const preferredIds =
    block.category === "开头破题"
      ? ["opening"]
      : block.category === "形势判断" || block.category === "过渡衔接"
        ? ["situation", "opening"]
        : block.category === "问题剖析"
          ? ["problems", "achievements"]
          : block.category === "总结提升" || block.category === "经验提炼"
            ? ["experience", "achievements", "problems"]
            : block.category === "拔高结尾" || block.category === "表态发言"
              ? ["closing"]
              : block.topic.includes("党建") ||
                  block.topic.includes("从严治党") ||
                  block.topic.includes("廉洁")
                ? ["governance", "tasks"]
                : ["tasks", "measures", "thinking"];
  for (const id of preferredIds) {
    if (template.slots.some((slot) => slot.id === id)) {
      return id;
    }
  }
  return template.slots[0].id;
}
