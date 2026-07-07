/*
 * 区域间打车时距（穷举两两估算）+ 概览图坐标
 *
 * 用途：当两张相邻卡片之间没有确认的 direct edge 时，
 * 按 locationCode 对退回到区域粗估，行程里永远有个底。
 * 全部为人工粗估（未经高德/百度核实），confidence 一律 low。
 *
 * key 格式 "A:B"，查询时双向归一（见 app.js regionEstimate）。
 * 坐标用于路线图顶部的区域概览：近似真实相对方位，
 * 比例尺约 2.2px/分钟，二维无法完全精确，仅作参考。
 */

window.YX = window.YX || {};

window.YX.regionTimes = {
  "CENTER:DT": { minutes: 15, range: [10, 20] },
  "CENTER:DS": { minutes: 30, range: [25, 35] },
  "CENTER:YX": { minutes: 42, range: [35, 50] },
  "CENTER:ZH": { minutes: 52, range: [45, 60] },
  "CENTER:SD": { minutes: 42, range: [35, 50] },
  "CENTER:LC": { minutes: 48, range: [40, 55] },
  "DT:DS": { minutes: 32, range: [25, 40] },
  "DT:YX": { minutes: 48, range: [40, 55] },
  "DT:ZH": { minutes: 58, range: [50, 65] },
  "DT:SD": { minutes: 48, range: [40, 55] },
  "DT:LC": { minutes: 52, range: [45, 60] },
  "DS:YX": { minutes: 32, range: [25, 40] },
  "DS:ZH": { minutes: 48, range: [40, 55] },
  "DS:SD": { minutes: 38, range: [30, 45] },
  "DS:LC": { minutes: 42, range: [35, 50] },
  "YX:ZH": { minutes: 28, range: [20, 35] },
  "YX:SD": { minutes: 28, range: [20, 35] },
  "YX:LC": { minutes: 22, range: [15, 30] },
  "ZH:SD": { minutes: 38, range: [30, 45] },
  "ZH:LC": { minutes: 28, range: [20, 35] },
  "SD:LC": { minutes: 32, range: [25, 40] }
};

// 同区内两点之间没有 direct edge 时的兜底短驳估算
window.YX.sameRegionTime = { minutes: 15, range: [10, 20] };

// 概览图坐标：按各区域近似经纬度线性投影（纬度经 cos31° 校正，保持真实纵横比）。
// 依据（约值）：城区 31.36/119.82，东氿 31.365/119.86，丁蜀 31.25/119.86，
// 善卷洞 31.20/119.69，阳羡湖㳇 31.15/119.80，竹海 31.11/119.74，龙池山 31.12/119.78。
// side 控制标签在节点哪一侧，手工指定以避免重叠。
window.YX.regionMapViewBox = "0 0 300 440";

window.YX.regionCoords = {
  CENTER: { x: 207, y: 43, side: "left" },
  DT: { x: 257, y: 37, side: "right" },
  DS: { x: 257, y: 190, side: "right" },
  SD: { x: 43, y: 257, side: "left" },
  YX: { x: 182, y: 323, side: "right" },
  LC: { x: 156, y: 363, side: "right" },
  ZH: { x: 106, y: 377, side: "left" }
};

// 概览图上画线的区域对（时间较短的“天然邻居”，全画会糊成一团）
window.YX.regionMapEdges = [
  "CENTER:DT", "CENTER:DS", "DT:DS", "DS:YX", "DS:SD",
  "YX:ZH", "YX:SD", "YX:LC", "ZH:LC", "ZH:SD"
];
