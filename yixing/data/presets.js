/*
 * presets —— 两个默认模板（起点，可自由改动）
 *
 * 见 docs/card-composition-model.md：
 * - fri-night-arrival（周五晚到）
 * - sat-morning-arrival（周六早到）
 *
 * 槽位 id 与 app.js 中 SLOTS 一致（2 小时粒度）；留空的槽位是有意的留白。
 */

window.YX = window.YX || {};

window.YX.presets = [
  {
    id: "fri-night-arrival",
    title: "周五晚到",
    note: "周五晚上高铁到，先简单吃一碗，第二天进丁蜀线。",
    slots: {
      "arrival": "noodle-shop",
      "d1-10": "shushan-old-street",
      "d1-14": "zisha-workshop",
      "d1-18": "yibang-dinner",
      "stay1": "stay-center",
      "d2-08": "tea-fields",
      "d2-14": "free-time-saboteur",
      "d2-18": "dongjiu-lake",
      "stay2": "stay-dingshu-lake",
      "d3-08": "taoerchang",
      "return": null
    }
  },
  {
    id: "sat-morning-arrival",
    title: "周六早到",
    note: "周六早上高铁到，放下行李直接进丁蜀。第二晚住宿留白待讨论。",
    slots: {
      "arrival": "transport-buffer",
      "d1-10": "shushan-old-street",
      "d1-14": "taoerchang",
      "d1-18": "yibang-dinner",
      "stay1": "stay-center",
      "d2-08": "bamboo-sea",
      "d2-14": "shanjuan-cave",
      "d2-18": "free-time-saboteur",
      "stay2": null,
      "d3-08": "dongjiu-lake",
      "return": "noodle-shop"
    }
  }
];
