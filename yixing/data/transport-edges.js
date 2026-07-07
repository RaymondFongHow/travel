/*
 * transportEdges —— 交通时间唯一数据源（占位估算 / PLACEHOLDER）
 *
 * schema 见 docs/network-map-model.md。按地点 id 记录确认过的直接交通；
 * 没有区域矩阵，缺边即代表「需单独确认」。
 *
 * 本版本所有时间均为人工粗估，confidence 一律 "low"，label 带「估」。
 * 地点池确认后需逐条用高德 / 百度重新核实。
 *
 * 边是无向的：查询时 from/to 两个方向都会匹配。
 * 注意：stay-dingshu-lake（丁蜀 / 湖边住宿）位置未定，故意没有任何边。
 */

window.YX = window.YX || {};

window.YX.transportEdges = [
  /* ---------- 丁蜀内部 ---------- */
  {
    id: "shushan-ceramics-museum",
    from: "shushan-old-street",
    to: "ceramics-museum",
    mode: "walk-or-short-car",
    minutes: 10,
    range: [5, 15],
    direct: true,
    confidence: "low",
    label: "估 5-15 分钟",
    notes: "同在丁蜀，步行或短驳。"
  },
  {
    id: "shushan-taoerchang",
    from: "shushan-old-street",
    to: "taoerchang",
    mode: "walk-or-short-car",
    minutes: 13,
    range: [8, 18],
    direct: true,
    confidence: "low",
    label: "估 8-18 分钟",
    notes: "同属丁蜀线，可作为连续陶艺段。"
  },
  {
    id: "taoerchang-ucca",
    from: "taoerchang",
    to: "ucca-clay",
    mode: "walk",
    minutes: 5,
    range: [3, 8],
    direct: true,
    confidence: "low",
    label: "估 3-8 分钟",
    notes: "UCCA Clay 在陶二厂片区内，步行可达。"
  },
  {
    id: "shushan-zisha-workshop",
    from: "shushan-old-street",
    to: "zisha-workshop",
    mode: "walk",
    minutes: 8,
    range: [5, 12],
    direct: true,
    confidence: "low",
    label: "估 5-12 分钟",
    notes: "假设手作工作室就在古南街片区，待定。"
  },
  {
    id: "ceramics-museum-taoerchang",
    from: "ceramics-museum",
    to: "taoerchang",
    mode: "walk-or-short-car",
    minutes: 10,
    range: [5, 15],
    direct: true,
    confidence: "low",
    label: "估 5-15 分钟",
    notes: "丁蜀内部短驳。"
  },
  {
    id: "zisha-workshop-taoerchang",
    from: "zisha-workshop",
    to: "taoerchang",
    mode: "walk-or-short-car",
    minutes: 13,
    range: [8, 18],
    direct: true,
    confidence: "low",
    label: "估 8-18 分钟",
    notes: "丁蜀内部短驳。"
  },

  /* ---------- 城区 <-> 丁蜀 ---------- */
  {
    id: "center-shushan",
    from: "stay-center",
    to: "shushan-old-street",
    mode: "car",
    minutes: 32,
    range: [25, 40],
    direct: true,
    confidence: "low",
    label: "估 25-40 分钟",
    notes: "城区到丁蜀的默认进入线，打车。"
  },
  {
    id: "center-taoerchang",
    from: "stay-center",
    to: "taoerchang",
    mode: "car",
    minutes: 32,
    range: [25, 40],
    direct: true,
    confidence: "low",
    label: "估 25-40 分钟",
    notes: "城区直达陶二厂，打车。"
  },
  {
    id: "noodle-shushan",
    from: "noodle-shop",
    to: "shushan-old-street",
    mode: "car",
    minutes: 32,
    range: [25, 40],
    direct: true,
    confidence: "low",
    label: "估 25-40 分钟",
    notes: "假设面馆在城区；从城区出发去丁蜀。"
  },
  {
    id: "zisha-workshop-yibang",
    from: "zisha-workshop",
    to: "yibang-dinner",
    mode: "car",
    minutes: 32,
    range: [25, 40],
    direct: true,
    confidence: "low",
    label: "估 25-40 分钟",
    notes: "丁蜀收工后回城区吃晚饭。"
  },
  {
    id: "taoerchang-yibang",
    from: "taoerchang",
    to: "yibang-dinner",
    mode: "car",
    minutes: 32,
    range: [25, 40],
    direct: true,
    confidence: "low",
    label: "估 25-40 分钟",
    notes: "陶二厂回城区晚饭。"
  },

  /* ---------- 城区内部 ---------- */
  {
    id: "center-dongjiu",
    from: "stay-center",
    to: "dongjiu-lake",
    mode: "walk-or-car",
    minutes: 15,
    range: [10, 20],
    direct: true,
    confidence: "low",
    label: "估 10-20 分钟",
    notes: "城区酒店到东氿湖边。"
  },
  {
    id: "center-yibang",
    from: "stay-center",
    to: "yibang-dinner",
    mode: "walk-or-car",
    minutes: 10,
    range: [5, 15],
    direct: true,
    confidence: "low",
    label: "估 5-15 分钟",
    notes: "假设晚餐店在城区。"
  },
  {
    id: "center-noodle",
    from: "stay-center",
    to: "noodle-shop",
    mode: "walk",
    minutes: 8,
    range: [5, 12],
    direct: true,
    confidence: "low",
    label: "估 5-12 分钟",
    notes: "假设面馆在城区步行圈。"
  },
  {
    id: "yibang-dongjiu",
    from: "yibang-dinner",
    to: "dongjiu-lake",
    mode: "walk",
    minutes: 15,
    range: [10, 20],
    direct: true,
    confidence: "low",
    label: "估 10-20 分钟",
    notes: "饭后走去湖边，顺。"
  },
  {
    id: "dongjiu-noodle",
    from: "dongjiu-lake",
    to: "noodle-shop",
    mode: "walk",
    minutes: 10,
    range: [5, 15],
    direct: true,
    confidence: "low",
    label: "估 5-15 分钟",
    notes: "湖边回城区小店。"
  },

  /* ---------- 城区 / 南部山区 ---------- */
  {
    id: "center-tea-fields",
    from: "stay-center",
    to: "tea-fields",
    mode: "car",
    minutes: 50,
    range: [40, 60],
    direct: true,
    confidence: "low",
    label: "估 40-60 分钟",
    notes: "城区去阳羡茶园，单程偏长。"
  },
  {
    id: "tea-fields-tea-culture",
    from: "tea-fields",
    to: "tea-culture",
    mode: "car",
    minutes: 13,
    range: [8, 18],
    direct: true,
    confidence: "low",
    label: "估 8-18 分钟",
    notes: "假设茶室就在阳羡片区。"
  },
  {
    id: "tea-fields-bamboo",
    from: "tea-fields",
    to: "bamboo-sea",
    mode: "car",
    minutes: 32,
    range: [25, 40],
    direct: true,
    confidence: "low",
    label: "估 25-40 分钟",
    notes: "阳羡与竹海同在南部山区，顺路。"
  },
  {
    id: "bamboo-shanjuan",
    from: "bamboo-sea",
    to: "shanjuan-cave",
    mode: "car",
    minutes: 27,
    range: [20, 35],
    direct: true,
    confidence: "low",
    label: "估 20-35 分钟",
    notes: "竹海转场善卷洞。"
  },
  {
    id: "shanjuan-center",
    from: "shanjuan-cave",
    to: "stay-center",
    mode: "car",
    minutes: 37,
    range: [30, 45],
    direct: true,
    confidence: "low",
    label: "估 30-45 分钟",
    notes: "善卷洞回城区。"
  },
  {
    id: "shanjuan-shushan",
    from: "shanjuan-cave",
    to: "shushan-old-street",
    mode: "car",
    minutes: 32,
    range: [25, 40],
    direct: true,
    confidence: "low",
    label: "估 25-40 分钟",
    notes: "善卷洞与丁蜀之间可以直接拼接。"
  },
  {
    id: "center-bamboo",
    from: "stay-center",
    to: "bamboo-sea",
    mode: "car",
    minutes: 60,
    range: [50, 70],
    direct: true,
    confidence: "low",
    label: "估 50-70 分钟",
    notes: "城区直奔竹海，是全程最重的一段移动。"
  }
];
