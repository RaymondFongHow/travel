/*
 * blockedEdges —— 显式记录「容易误连但不建议直连」的关系（占位 / PLACEHOLDER）
 *
 * schema 见 docs/network-map-model.md。通常缺边即代表不可连线；
 * 这里只放需要解释原因或给出建议中转的组合。
 * 查询时 from/to 双向匹配。
 */

window.YX = window.YX || {};

window.YX.blockedEdges = [
  {
    from: "tea-fields",
    to: "dongjiu-lake",
    reason: "从阳羡茶园直接去东氿跨度较大，建议先回城区休整再去湖边。",
    suggestedVia: ["stay-center"]
  },
  {
    from: "shanjuan-cave",
    to: "dongjiu-lake",
    reason: "善卷洞回来一般先回城区，再顺路安排湖边散步。",
    suggestedVia: ["stay-center"]
  },
  {
    from: "bamboo-sea",
    to: "shushan-old-street",
    reason: "竹海回丁蜀通常会经过阳羡一带，建议拆成两段或顺路安排茶园。",
    suggestedVia: ["tea-fields"]
  }
];
