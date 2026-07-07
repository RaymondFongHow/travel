/*
 * presets —— 两个默认拼法（起点，不是最终行程）
 *
 * 见 docs/card-composition-model.md：
 * - fri-night-arrival（周五晚到）
 * - sat-morning-arrival（周六早到）
 *
 * preset 只是默认槽位状态；留空的槽位是有意的留白。
 * 槽位 id 与 app.js 中 SLOTS 一致。
 */

window.YX = window.YX || {};

window.YX.presets = [
  {
    id: "fri-night-arrival",
    title: "周五晚到",
    note: "周五晚上高铁到，先简单吃一碗，第二天进丁蜀线。只是起点，随便改。",
    slots: {
      "arrival": "noodle-shop",
      "d1-morning": "shushan-old-street",
      "d1-afternoon": "zisha-workshop",
      "d1-evening": "yibang-dinner",
      "stay1": "stay-center",
      "d2-morning": "tea-fields",
      "d2-afternoon": "free-time-saboteur",
      "d2-evening": "dongjiu-lake",
      "stay2": "stay-dingshu-lake",
      "d3-morning": "taoerchang",
      "return": null
    }
  },
  {
    id: "sat-morning-arrival",
    title: "周六早到",
    note: "周六早上高铁到，放下行李直接进丁蜀。第二晚住宿故意留白，待讨论。",
    slots: {
      "arrival": "transport-buffer",
      "d1-morning": "shushan-old-street",
      "d1-afternoon": "taoerchang",
      "d1-evening": "yibang-dinner",
      "stay1": "stay-center",
      "d2-morning": "bamboo-sea",
      "d2-afternoon": "shanjuan-cave",
      "d2-evening": "free-time-saboteur",
      "stay2": null,
      "d3-morning": "dongjiu-lake",
      "return": "noodle-shop"
    }
  }
];
