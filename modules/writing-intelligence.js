// Adapted read-only from the existing Yanku ranking module, 2026-09-06.
const intentSeed = {profiles: []};

                                              

                               
             
                
                   
                
               
                
               
                       
                 
  

                      
             
                
                    
                     
                       
                   
                        
                 
  

                           
                
                 
                        
                              
                  
  

                                                      
           
                     
  

export let intentProfiles = intentSeed.profiles                   ;
export function setIntentProfiles(profiles                 ) { intentProfiles = profiles; }

export const INTENT_EXAMPLES = [
  "成绩值得肯定，但不能躺在功劳簿上",
  "任务已经明确，下一步关键是抓落实",
  "党建要落实到中心工作和一线任务",
  "结尾要提振士气，但不要过于浮夸",
];

export const SCENE_GROUPS = [
  "全部场景",
  "综合工作会议",
  "党建与全面从严治党",
  "改革发展与经营管理",
  "科技创新与数字化",
  "安全质量与风险合规",
  "干部人才与组织建设",
  "调研座谈与现场讲话",
  "表态发言与任职讲话",
  "总结表彰与动员部署",
  "外部交流与成果发布",
]         ;

                                                       

function normalize(value        ) {
  return value
    .toLocaleLowerCase("zh-CN")
    .replace(/[\s，。；：、！？,.!?;:'"“”‘’（）()《》【】\[\]—…·\-]/g, "");
}

function grams(value        ) {
  const normalized = normalize(value);
  const result = new Set        ();
  if (normalized.length < 2) {
    if (normalized) {
      result.add(normalized);
    }
    return result;
  }
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }
  return result;
}

function diceSimilarity(first        , second        ) {
  const firstGrams = grams(first);
  const secondGrams = grams(second);
  if (firstGrams.size === 0 || secondGrams.size === 0) {
    return 0;
  }
  let overlap = 0;
  for (const item of firstGrams) {
    if (secondGrams.has(item)) {
      overlap += 1;
    }
  }
  return (2 * overlap) / (firstGrams.size + secondGrams.size);
}

function profileQueryScore(query        , profile               ) {
  const normalizedQuery = normalize(query);
  let score = diceSimilarity(query, profile.label) * 0.76;

  for (const alias of profile.aliases) {
    const normalizedAlias = normalize(alias);
    if (
      normalizedQuery.length >= 4 &&
      (normalizedQuery.includes(normalizedAlias) ||
        normalizedAlias.includes(normalizedQuery))
    ) {
      score = Math.max(score, 1);
      continue;
    }
    score = Math.max(score, diceSimilarity(query, alias));
  }

  const keywordMatches = profile.keywords.filter((keyword) =>
    normalizedQuery.includes(normalize(keyword)),
  ).length;
  return Math.min(1, score + Math.min(keywordMatches * 0.12, 0.36));
}

function defaultSuggestedSlot(block                 ) {
  if (block.category === "开头破题") {
    return "开头定调";
  }
  if (block.category === "形势判断" || block.category === "过渡衔接") {
    return "形势判断";
  }
  if (
    block.category === "问题剖析" ||
    block.category === "经验提炼" ||
    block.category === "总结提升"
  ) {
    return "成绩与问题";
  }
  if (
    block.category === "拔高结尾" ||
    block.category === "表态发言"
  ) {
    return "收束提气";
  }
  if (
    block.topic.includes("党建") ||
    block.topic.includes("从严治党") ||
    block.topic.includes("廉洁")
  ) {
    return "党建保障";
  }
  return "任务部署";
}

export function rankIntentBlocks                           (
  blocks     ,
  query        ,
)                   {
  const normalizedQuery = normalize(query);
  const profiles = intentProfiles
    .map((profile) => ({ profile, score: profileQueryScore(query, profile) }))
    .filter((item) => item.score >= 0.18)
    .sort((first, second) => second.score - first.score)
    .slice(0, 3);

  return blocks
    .map((block) => {
      const haystack = [
        block.title,
        block.text,
        block.category,
        block.scene,
        block.topic,
        block.tone,
        ...block.highlights,
        ...block.tags,
      ].join(" ");
      const normalizedHaystack = normalize(haystack);
      const direct =
        normalizedQuery.length >= 2 && normalizedHaystack.includes(normalizedQuery);
      let score = direct ? 54 : diceSimilarity(query, haystack) * 26;
      let leadingProfile                                   = null;
      let leadingContribution = 0;

      for (const profileItem of profiles) {
        const { profile, score: queryScore } = profileItem;
        const categoryMatched = profile.categories.includes(block.category);
        const topicMatched = profile.topics.some((topic) =>
          block.topic.includes(topic),
        );
        const fieldSimilarity = Math.max(
          diceSimilarity(profile.label, block.title),
          ...profile.aliases.map((alias) => diceSimilarity(alias, block.title)),
          ...block.highlights.map((highlight) =>
            diceSimilarity(profile.label, highlight),
          ),
        );
        let contribution = fieldSimilarity * queryScore * 18;
        if (categoryMatched) {
          contribution += 9 * queryScore;
        }
        if (topicMatched) {
          contribution += 16 * queryScore;
        }
        const keywordMatches = profile.keywords.filter((keyword) =>
          normalizedHaystack.includes(normalize(keyword)),
        ).length;
        contribution += Math.min(keywordMatches * 4 * queryScore, 20);
        if (contribution > leadingContribution) {
          leadingContribution = contribution;
          leadingProfile = profileItem;
        }
      }

      score += leadingContribution;
      const profile = leadingProfile?.profile ?? null;
      return {
        block,
        match: {
          score,
          direct,
          profileLabel: profile?.label ?? null,
          suggestedSlot: profile?.suggestedSlot ?? defaultSuggestedSlot(block),
          reason: direct
            ? "你的描述与这段素材直接呼应。"
            : profile?.reason ?? "根据主题、写作位置和语气综合匹配。",
        },
      };
    })
    .sort(
      (first, second) =>
        second.match.score - first.match.score ||
        first.block.id.localeCompare(second.block.id),
    );
}

export function sceneGroupFor(scene        )             {
  if (/表态|任职|承诺/.test(scene)) {
    return "表态发言与任职讲话";
  }
  if (/调研|座谈|慰问|现场办公/.test(scene)) {
    return "调研座谈与现场讲话";
  }
  if (/党建|党风|廉政|警示|全面从严|党课|理论学习/.test(scene)) {
    return "党建与全面从严治党";
  }
  if (/干部|组织人事|人才|团队|班子|年轻/.test(scene)) {
    return "干部人才与组织建设";
  }
  if (/科技|创新|人工智能|数字化|数据|成果转化|科技金融/.test(scene)) {
    return "科技创新与数字化";
  }
  if (/安全|风险|合规|内控|质量/.test(scene)) {
    return "安全质量与风险合规";
  }
  if (/品牌|发布|签约|揭牌|外部交流|宣传/.test(scene)) {
    return "外部交流与成果发布";
  }
  if (/改革|经营|董事会|治理|预算|降本|市场|项目|产业链/.test(scene)) {
    return "改革发展与经营管理";
  }
  if (/总结|表彰|动员|攻坚|部署|推进|任务|复盘/.test(scene)) {
    return "总结表彰与动员部署";
  }
  return "综合工作会议";
}
