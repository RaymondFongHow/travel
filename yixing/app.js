/*
 * 宜兴 · 感官拼配 —— 主逻辑
 *
 * 结构：
 *   1. 数据与常量
 *   2. 纯数据逻辑（buildRouteGraph 等，与 DOM 渲染分离）
 *   3. 状态与持久化（localStorage）
 *   4. 渲染（卡片池 / 时间槽 / 路线图 / 提示条）
 *   5. 交互（点选拼配 + pointer events 拖拽）
 *
 * 交互约定（docs/card-composition-model.md）：
 *   - 触屏优先：点卡片再点槽位；拖拽用 pointer events，不用 HTML5 原生 DnD。
 *   - 同一份草案内卡片默认不重复：再次放入等于移动。
 *   - 主题切换由点选驱动，hover 只是增强。
 */

(function () {
  "use strict";

  /* ================= 1. 数据与常量 ================= */

  var YXD = window.YX || {};
  var PLACES = YXD.places || [];
  var EDGES = YXD.transportEdges || [];
  var BLOCKED = YXD.blockedEdges || [];
  var PRESETS = YXD.presets || [];

  var STORAGE_KEY = "yixing-draft-v1";
  var THEMES = ["dingshu", "spring", "bamboo-water", "night"];
  var HEAVY_EDGE_MIN = 60; // 达到这个分钟数即提示“移动偏重”

  // 拼配区槽位，顺序与 docs/card-composition-model.md 一致
  var SLOTS = [
    { id: "arrival", label: "到达", sub: "Arrival", kind: "flex" },
    { id: "d1-morning", label: "Day 1 · 上午", sub: "Morning", kind: "morning" },
    { id: "d1-afternoon", label: "Day 1 · 下午", sub: "Afternoon", kind: "afternoon" },
    { id: "d1-evening", label: "Day 1 · 晚上", sub: "Evening", kind: "evening" },
    { id: "stay1", label: "住宿 · 第 1 晚", sub: "Stay 1", kind: "stay" },
    { id: "d2-morning", label: "Day 2 · 上午", sub: "Morning", kind: "morning" },
    { id: "d2-afternoon", label: "Day 2 · 下午", sub: "Afternoon", kind: "afternoon" },
    { id: "d2-evening", label: "Day 2 · 晚上", sub: "Evening", kind: "evening" },
    { id: "stay2", label: "住宿 · 第 2 晚", sub: "Stay 2", kind: "stay" },
    { id: "d3-morning", label: "Day 3 · 上午", sub: "Morning", kind: "morning" },
    { id: "return", label: "午餐 / 返程", sub: "Lunch / Return", kind: "flex" }
  ];

  var THEME_GROUPS = [
    { theme: "dingshu", label: "丁蜀 · 泥与窑火" },
    { theme: "spring", label: "春日 · 茶与田野" },
    { theme: "bamboo-water", label: "竹洞水 · 清凉" },
    { theme: "night", label: "夜晚 · 饭局 / 住宿 / 自由" }
  ];

  var TYPE_LABELS = {
    place: "地点",
    experience: "体验",
    food: "餐饮",
    stay: "住宿",
    "free-time": "自由时间",
    buffer: "缓冲"
  };

  var MODE_LABELS = {
    car: "打车",
    walk: "步行",
    "walk-or-car": "步行或打车",
    "walk-or-short-car": "步行 / 短驳",
    bike: "骑行"
  };

  // locationCode 只是内部数据键，UI 一律显示中文名
  // （区域表见 docs/static-interaction-model.md）
  var LOC_LABELS = {
    DS: "丁蜀",
    YX: "阳羡",
    ZH: "竹海",
    SD: "善卷洞",
    LC: "龙池山",
    DT: "东氿",
    CENTER: "宜兴城区",
    TBD: "位置待定",
    CURRENT: "原地"
  };

  function locLabel(code) {
    return LOC_LABELS[code] || code;
  }

  var cardById = {};
  PLACES.forEach(function (p) { cardById[p.id] = p; });

  var slotById = {};
  SLOTS.forEach(function (s) { slotById[s.id] = s; });

  /* ================= 2. 纯数据逻辑（与渲染分离） ================= */

  function findDirectEdge(fromId, toId, edges) {
    for (var i = 0; i < edges.length; i += 1) {
      var e = edges[i];
      if (!e.direct) continue;
      if ((e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)) {
        return e;
      }
    }
    return null;
  }

  function findBlockedEdge(fromId, toId, blocked) {
    for (var i = 0; i < blocked.length; i += 1) {
      var b = blocked[i];
      if ((b.from === fromId && b.to === toId) || (b.from === toId && b.to === fromId)) {
        return b;
      }
    }
    return null;
  }

  // locationCode "CURRENT"（自由时间 / 缓冲）不改变位置，不触发交通边
  function isRouteNode(card) {
    return card && card.type !== "note" && card.mapNode && card.locationCode !== "CURRENT";
  }

  /**
   * 根据当前拼配顺序生成路线图数据。
   * 输入选中卡片（按槽位顺序）、直连边、禁连说明；
   * 输出 { nodes, edges, breaks, segments }，segments[i] 描述 nodes[i] 与 nodes[i+1] 之间的关系。
   * 纯函数，不接触 DOM。
   */
  function buildRouteGraph(selectedItems, transportEdges, blockedEdges) {
    var nodes = selectedItems.filter(isRouteNode);
    var edges = [];
    var breaks = [];
    var segments = [];

    for (var i = 0; i < nodes.length - 1; i += 1) {
      var from = nodes[i];
      var to = nodes[i + 1];
      var edge = findDirectEdge(from.id, to.id, transportEdges);

      if (edge) {
        edges.push(edge);
        segments.push({ kind: "edge", fromId: from.id, toId: to.id, edge: edge });
        continue;
      }

      var blocked = findBlockedEdge(from.id, to.id, blockedEdges);
      var brk = {
        from: from.id,
        to: to.id,
        reason: blocked ? blocked.reason : "这两点之间还没有确认的直接交通。",
        suggestedVia: blocked && blocked.suggestedVia ? blocked.suggestedVia : []
      };
      breaks.push(brk);
      segments.push({ kind: "break", fromId: from.id, toId: to.id, brk: brk });
    }

    return { nodes: nodes, edges: edges, breaks: breaks, segments: segments };
  }

  // 分钟 -> 连线像素长度，带上下限（docs/network-map-model.md）
  function edgeLength(minutes) {
    var pxPerMinute = 4;
    var minLength = 64;
    var maxLength = 260;
    return Math.max(minLength, Math.min(maxLength, minutes * pxPerMinute));
  }

  function totalEdgeMinutes(graph) {
    var total = 0;
    graph.edges.forEach(function (e) { total += e.minutes || 0; });
    return total;
  }

  /* ================= 3. 状态与持久化 ================= */

  // filter：感官菜单的双重角色之二 —— 筛选卡片池（"all" 或某个主题）。
  // 只影响卡片池显示；已放入槽位的卡和路线图不受筛选影响。
  var state = { theme: "dingshu", filter: "all", slots: {} };
  SLOTS.forEach(function (s) { state.slots[s.id] = null; });

  // 点选拼配：selection = { cardId } 或 null（来源槽位随时可从 slots 推导）
  var selection = null;

  function slotOfCard(cardId) {
    for (var i = 0; i < SLOTS.length; i += 1) {
      if (state.slots[SLOTS[i].id] === cardId) return SLOTS[i].id;
    }
    return null;
  }

  function selectedItems() {
    var items = [];
    SLOTS.forEach(function (s) {
      var id = state.slots[s.id];
      if (id && cardById[id]) items.push(cardById[id]);
    });
    return items;
  }

  function currentGraph() {
    return buildRouteGraph(selectedItems(), EDGES, BLOCKED);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, theme: state.theme, filter: state.filter, slots: state.slots }));
    } catch (err) { /* 隐私模式等场景下静默失败 */ }
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (err) { return; }
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (err) { return; }
    if (!data || typeof data !== "object") return;

    if (THEMES.indexOf(data.theme) !== -1) state.theme = data.theme;
    if (data.filter === "all" || THEMES.indexOf(data.filter) !== -1) state.filter = data.filter;

    var seen = {};
    if (data.slots && typeof data.slots === "object") {
      SLOTS.forEach(function (s) {
        var id = data.slots[s.id];
        if (typeof id === "string" && cardById[id] && !seen[id]) {
          state.slots[s.id] = id;
          seen[id] = true;
        } else {
          state.slots[s.id] = null;
        }
      });
    }
  }

  /* ================= 4. 渲染 ================= */

  var poolEl = document.getElementById("card-pool");
  var slotListEl = document.getElementById("slot-list");
  var graphEl = document.getElementById("route-graph");
  var summaryEl = document.getElementById("route-summary");
  var hintBarEl = document.getElementById("hint-bar");
  var hintTextEl = document.getElementById("hint-text");
  var toastEl = document.getElementById("toast");
  var presetWrapEl = document.getElementById("preset-buttons");

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function chip(text, className) {
    return el("span", className || "chip", text);
  }

  function durationText(card) {
    if (card.type === "stay") return "过夜";
    if (!card.durationMin) return "";
    return "约 " + card.durationMin + " 分";
  }

  function setTheme(theme) {
    if (THEMES.indexOf(theme) === -1) return;
    state.theme = theme;
    document.body.setAttribute("data-theme", theme);
    renderThemeMenu();
    save();
  }

  // 感官菜单按钮的按下态跟随筛选状态（菜单 = 主题切换 + 卡片池筛选）
  function renderThemeMenu() {
    var btns = document.querySelectorAll("[data-theme-btn]");
    for (var i = 0; i < btns.length; i += 1) {
      var t = btns[i].getAttribute("data-theme-btn");
      btns[i].setAttribute("aria-pressed", t === state.filter ? "true" : "false");
    }
    var allBtn = document.querySelector("[data-filter-all]");
    if (allBtn) allBtn.setAttribute("aria-pressed", state.filter === "all" ? "true" : "false");
  }

  function buildCardEl(card) {
    var used = slotOfCard(card.id);
    var isLight = card.type === "free-time" || card.type === "buffer";
    var cls = "card";
    if (isLight) cls += " card--light";
    if (used) cls += " card--assigned";
    if (selection && selection.cardId === card.id) cls += " card--selected";

    var node = el("article", cls);
    node.setAttribute("data-card-id", card.id);
    node.setAttribute("data-drag-card", "");
    node.setAttribute("data-card-theme", card.theme);

    var top = el("div", "card-top");
    top.appendChild(el("h3", "card-title", card.title));
    var dur = durationText(card);
    if (dur) top.appendChild(el("span", "card-duration", dur));
    node.appendChild(top);

    if (card.summary) node.appendChild(el("p", "card-summary", card.summary));

    var meta = el("div", "card-meta");
    meta.appendChild(chip(locLabel(card.locationCode), "chip chip-loc"));
    meta.appendChild(chip(TYPE_LABELS[card.type] || card.type));
    if (card.reservationNeeded) meta.appendChild(chip("需预约", "badge badge-res"));
    if (card.heatRisk === "medium") meta.appendChild(chip("偏晒", "badge badge-heat"));
    if (card.heatRisk === "high") meta.appendChild(chip("暴晒", "badge badge-heat"));
    if (card.pending) meta.appendChild(chip("待确认", "badge badge-tbc"));
    if (used) meta.appendChild(chip("已在 " + slotById[used].label, "chip chip-assigned"));
    node.appendChild(meta);

    return node;
  }

  function renderPool() {
    poolEl.innerHTML = "";
    THEME_GROUPS.forEach(function (group) {
      if (state.filter !== "all" && group.theme !== state.filter) return;
      var cards = PLACES.filter(function (p) { return p.theme === group.theme; });
      if (!cards.length) return;
      var wrap = el("section", "pool-group");
      var title = el("h3", "pool-group-title", group.label);
      title.setAttribute("data-card-theme", group.theme);
      wrap.appendChild(title);
      var list = el("div", "pool-cards");
      cards.forEach(function (card) { list.appendChild(buildCardEl(card)); });
      wrap.appendChild(list);
      poolEl.appendChild(wrap);
    });
  }

  function slotWarnings(slot, card) {
    var items = [];
    if (card.type === "stay" && slot.kind !== "stay") {
      items.push({ text: "住宿卡不在住宿槽 — 建议移到 Stay 槽", strong: true });
    }
    if (slot.kind === "afternoon" && (card.heatRisk === "medium" || card.heatRisk === "high")) {
      items.push({ text: "午后偏晒（heatRisk: " + card.heatRisk + "），建议挪到上午或傍晚", strong: true });
    }
    if (card.reservationNeeded) {
      items.push({ text: "需要提前预约", strong: false });
    }
    return items;
  }

  function buildSlotEl(slot) {
    var cardId = state.slots[slot.id];
    var card = cardId ? cardById[cardId] : null;
    var cls = "slot " + (card ? "slot--filled" : "slot--empty");
    if (slot.kind === "stay") cls += " slot--stay";

    var node = el("section", cls);
    node.setAttribute("data-slot-id", slot.id);

    var head = el("div", "slot-head");
    head.appendChild(el("span", "slot-label", slot.label));
    head.appendChild(el("span", "slot-sub", slot.sub));
    node.appendChild(head);

    if (card) {
      var occ = el("div", "slot-card" + (selection && selection.cardId === card.id ? " card--selected" : ""));
      occ.setAttribute("data-card-id", card.id);
      occ.setAttribute("data-drag-card", "");
      occ.setAttribute("data-card-theme", card.theme);
      occ.appendChild(el("span", "slot-card-title", card.title));
      occ.appendChild(chip(locLabel(card.locationCode), "chip chip-loc"));
      var dur = durationText(card);
      if (dur) occ.appendChild(chip(dur));
      if (card.pending) occ.appendChild(chip("待确认", "badge badge-tbc"));
      var removeBtn = el("button", "slot-remove", "移出");
      removeBtn.setAttribute("type", "button");
      removeBtn.setAttribute("data-remove-slot", slot.id);
      removeBtn.setAttribute("aria-label", "把「" + card.title + "」移回卡片池");
      occ.appendChild(removeBtn);
      node.appendChild(occ);

      var warnings = slotWarnings(slot, card);
      if (warnings.length) {
        var ul = el("ul", "slot-warnings");
        warnings.forEach(function (w) {
          ul.appendChild(el("li", w.strong ? "" : "note-hint", w.text));
        });
        node.appendChild(ul);
      }
    } else {
      var emptyText = slot.kind === "stay" ? "还没选住宿" : "留白 · 什么都不排也可以";
      node.appendChild(el("p", "slot-empty-note", emptyText));
    }

    return node;
  }

  function buildTravelChip(seg) {
    var toCard = cardById[seg.toId];
    var toName = toCard ? toCard.title : seg.toId;

    if (seg.kind === "edge") {
      var e = seg.edge;
      var mode = MODE_LABELS[e.mode] || e.mode;
      var text = "下一站 " + toName + " · " + e.label + " · " + mode;
      if ((e.minutes || 0) >= HEAVY_EDGE_MIN) text += " · 移动偏重";
      return el("div", "travel-chip", text);
    }

    var node = el("div", "travel-chip travel-chip--break");
    node.appendChild(document.createTextNode("下一站 " + toName + " · 需单独确认"));
    var detail = seg.brk.reason;
    if (seg.brk.suggestedVia.length) {
      var vias = seg.brk.suggestedVia.map(function (id) {
        return cardById[id] ? cardById[id].title : id;
      });
      detail += " 建议中转：" + vias.join("、");
    }
    var small = document.createElement("small");
    small.textContent = detail;
    node.appendChild(small);
    return node;
  }

  function renderSlots() {
    slotListEl.innerHTML = "";
    var slotEls = {};
    SLOTS.forEach(function (slot) {
      var elx = buildSlotEl(slot);
      slotEls[slot.id] = elx;
      slotListEl.appendChild(elx);
    });

    // 相邻已选地点间的交通反馈，插在起点卡所在槽位之后
    currentGraph().segments.forEach(function (seg) {
      var fromSlotId = slotOfCard(seg.fromId);
      var anchor = fromSlotId ? slotEls[fromSlotId] : null;
      if (anchor) anchor.insertAdjacentElement("afterend", buildTravelChip(seg));
    });
  }

  function buildGraphNode(card) {
    var node = el("div", "graph-node");
    node.setAttribute("data-card-id", card.id);
    node.setAttribute("data-card-theme", card.theme);
    node.setAttribute("data-graph-node", "");

    var imp = card.mapNode.importance || 2;
    node.appendChild(el("span", "graph-dot imp-" + imp));

    var text = el("div", "graph-node-text");
    text.appendChild(el("span", "graph-node-label", card.mapNode.shortLabel));
    var slotId = slotOfCard(card.id);
    if (slotId) text.appendChild(el("span", "graph-node-slot", slotById[slotId].label));
    node.appendChild(text);
    return node;
  }

  function buildGraphSegment(seg) {
    if (seg.kind === "edge") {
      var e = seg.edge;
      var heavy = (e.minutes || 0) >= HEAVY_EDGE_MIN;
      var node = el("div", "graph-edge" + (heavy ? " graph-edge--heavy" : ""));
      node.style.height = edgeLength(e.minutes || 0) + "px";
      node.appendChild(el("span", "graph-edge-line"));
      var mode = MODE_LABELS[e.mode] || e.mode;
      var label = e.label + " · " + mode + (heavy ? " · 移动偏重" : "");
      node.appendChild(el("span", "graph-edge-label", label));
      return node;
    }

    var brkEl = el("div", "graph-break");
    brkEl.appendChild(el("strong", null, "需单独确认"));
    var detail = seg.brk.reason;
    if (seg.brk.suggestedVia.length) {
      var vias = seg.brk.suggestedVia.map(function (id) {
        return cardById[id] ? cardById[id].title : id;
      });
      detail += " 建议中转：" + vias.join("、");
    }
    brkEl.appendChild(el("span", null, detail));
    return brkEl;
  }

  function renderRouteGraph() {
    graphEl.innerHTML = "";
    var graph = currentGraph();

    if (!graph.nodes.length) {
      graphEl.appendChild(el("p", "graph-empty", "还没有可画的路线。往时间槽里放两个地点试试。"));
      summaryEl.textContent = "";
      return;
    }

    graph.nodes.forEach(function (card, i) {
      graphEl.appendChild(buildGraphNode(card));
      if (i < graph.nodes.length - 1) {
        graphEl.appendChild(buildGraphSegment(graph.segments[i]));
      }
    });

    var total = totalEdgeMinutes(graph);
    var parts = [];
    if (total > 0) parts.push("已连路段合计 约 " + total + " 分钟（估 · 低可信度）");
    if (graph.breaks.length) parts.push(graph.breaks.length + " 段需单独确认");
    summaryEl.textContent = parts.join(" · ");
  }

  function renderHintBar() {
    if (!selection) {
      hintBarEl.hidden = true;
      return;
    }
    var card = cardById[selection.cardId];
    var from = slotOfCard(selection.cardId);
    hintTextEl.textContent = from
      ? "移动「" + card.title + "」— 点目标槽位（占用则交换）"
      : "已选「" + card.title + "」— 点一个时间槽放入";
    hintBarEl.hidden = false;
  }

  function renderPresetButtons() {
    presetWrapEl.innerHTML = "";
    PRESETS.forEach(function (preset) {
      var btn = el("button", null, preset.title);
      btn.setAttribute("type", "button");
      btn.setAttribute("data-preset", preset.id);
      presetWrapEl.appendChild(btn);
    });
  }

  function renderAll() {
    renderPool();
    renderSlots();
    renderRouteGraph();
    renderHintBar();
    renderThemeMenu();
  }

  var toastTimer = null;
  function toast(message, kind) {
    toastEl.textContent = message;
    toastEl.className = "toast" + (kind === "warn" ? " toast--warn" : "");
    toastEl.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2800);
  }

  /* ================= 5. 交互 ================= */

  function clearSelection() {
    selection = null;
  }

  function performAssign(cardId, targetSlotId) {
    var card = cardById[cardId];
    var slot = slotById[targetSlotId];
    if (!card || !slot) return;

    var sourceSlotId = slotOfCard(cardId);
    if (sourceSlotId === targetSlotId) {
      clearSelection();
      renderAll();
      return;
    }

    var displacedId = state.slots[targetSlotId] || null;
    state.slots[targetSlotId] = cardId;
    if (sourceSlotId) {
      // 同一草案不重复：从原槽位移走；目标被占用则两卡交换
      state.slots[sourceSlotId] = displacedId;
    }

    // 即时反馈，按重要性只弹一条；持久提示由槽位内警告承担
    if (card.type === "stay" && slot.kind !== "stay") {
      toast("注意：「" + card.title + "」是住宿卡，通常放住宿槽", "warn");
    } else if (slot.kind === "afternoon" && (card.heatRisk === "medium" || card.heatRisk === "high")) {
      toast("「" + card.title + "」午后偏晒，建议放上午或傍晚", "warn");
    } else if (card.reservationNeeded) {
      toast("「" + card.title + "」需要提前预约");
    } else if (sourceSlotId && displacedId) {
      toast("两张卡已交换");
    } else if (sourceSlotId) {
      toast("已移动到 " + slot.label);
    } else if (displacedId && cardById[displacedId]) {
      toast("「" + cardById[displacedId].title + "」已移回卡片池");
    }

    clearSelection();
    save();
    renderAll();
  }

  function removeFromSlot(slotId) {
    var cardId = state.slots[slotId];
    if (!cardId) return;
    state.slots[slotId] = null;
    if (selection && selection.cardId === cardId) clearSelection();
    save();
    renderAll();
    if (cardById[cardId]) toast("「" + cardById[cardId].title + "」已移回卡片池");
  }

  function onCardTap(cardId) {
    var card = cardById[cardId];
    if (!card) return;
    if (selection && selection.cardId === cardId) {
      clearSelection();
      renderAll();
      return;
    }
    selection = { cardId: cardId };
    setTheme(card.theme); // 点选卡片时页面切到该卡主题
    renderAll();
  }

  function onSlotTap(slotId) {
    if (selection) {
      performAssign(selection.cardId, slotId);
      return;
    }
    var occupant = state.slots[slotId];
    if (occupant) {
      onCardTap(occupant); // 点已放置的卡 = 选中它准备移动
      return;
    }
    toast("先在卡片池点选一张卡片，再点这个槽位");
  }

  function applyPreset(presetId) {
    var preset = null;
    for (var i = 0; i < PRESETS.length; i += 1) {
      if (PRESETS[i].id === presetId) { preset = PRESETS[i]; break; }
    }
    if (!preset) return;

    var seen = {};
    SLOTS.forEach(function (s) {
      var id = preset.slots ? preset.slots[s.id] : null;
      if (typeof id === "string" && cardById[id] && !seen[id]) {
        state.slots[s.id] = id;
        seen[id] = true;
      } else {
        state.slots[s.id] = null;
      }
    });

    clearSelection();
    save();
    renderAll();
    toast(preset.note || (preset.title + " 已载入"));
  }

  function resetDraft() {
    if (!window.confirm("清空当前拼配草稿？")) return;
    SLOTS.forEach(function (s) { state.slots[s.id] = null; });
    clearSelection();
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
    renderAll();
    toast("已清空，重新开始拼");
  }

  /* ---------- 点击（含拖拽后的 click 抑制） ---------- */

  var suppressClick = false;

  document.addEventListener("click", function (e) {
    if (suppressClick) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    var themeBtn = e.target.closest("[data-theme-btn]");
    if (themeBtn) {
      var t = themeBtn.getAttribute("data-theme-btn");
      state.filter = t; // 菜单点选 = 切主题 + 筛选卡片池
      setTheme(t);
      renderPool();
      renderThemeMenu();
      return;
    }

    if (e.target.closest("[data-filter-all]")) {
      state.filter = "all"; // 恢复完整卡片池，页面主题保持不变
      save();
      renderPool();
      renderThemeMenu();
      return;
    }

    var presetBtn = e.target.closest("[data-preset]");
    if (presetBtn) { applyPreset(presetBtn.getAttribute("data-preset")); return; }

    if (e.target.closest("#reset-btn")) { resetDraft(); return; }

    if (e.target.closest("[data-cancel-selection]")) {
      clearSelection();
      renderAll();
      return;
    }

    var removeBtn = e.target.closest("[data-remove-slot]");
    if (removeBtn) { removeFromSlot(removeBtn.getAttribute("data-remove-slot")); return; }

    var graphNode = e.target.closest("[data-graph-node]");
    if (graphNode) {
      var gCard = cardById[graphNode.getAttribute("data-card-id")];
      if (gCard) setTheme(gCard.theme);
      return;
    }

    var slotEl = e.target.closest(".slot");
    if (slotEl) { onSlotTap(slotEl.getAttribute("data-slot-id")); return; }

    var cardEl = e.target.closest("[data-drag-card]");
    if (cardEl) { onCardTap(cardEl.getAttribute("data-card-id")); return; }
  });

  /* ---------- 拖拽（pointer events，触屏长按提起） ---------- */

  var drag = null;

  function cancelDrag() {
    if (!drag) return;
    if (drag.timer) clearTimeout(drag.timer);
    if (drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
    if (drag.overSlot) drag.overSlot.classList.remove("slot--over");
    if (drag.el) drag.el.classList.remove("drag-source");
    document.body.classList.remove("drag-active");
    drag = null;
  }

  function liftDrag() {
    if (!drag || drag.lifted) return;
    drag.lifted = true;
    var card = cardById[drag.cardId];
    var ghost = el("div", "drag-ghost", card ? card.title : "");
    document.body.appendChild(ghost);
    drag.ghost = ghost;
    positionGhost();
    document.body.classList.add("drag-active");
    drag.el.classList.add("drag-source");
  }

  function positionGhost() {
    if (!drag || !drag.ghost) return;
    drag.ghost.style.transform =
      "translate(" + (drag.lastX + 14) + "px, " + (drag.lastY - 22) + "px)";
  }

  function updateDropTarget() {
    if (!drag || !drag.lifted) return;
    var under = document.elementFromPoint(drag.lastX, drag.lastY);
    var slotEl = under ? under.closest(".slot") : null;
    if (drag.overSlot && drag.overSlot !== slotEl) drag.overSlot.classList.remove("slot--over");
    if (slotEl) slotEl.classList.add("slot--over");
    drag.overSlot = slotEl;
  }

  document.addEventListener("pointerdown", function (e) {
    if (!e.isPrimary) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("[data-remove-slot]")) return;
    var cardEl = e.target.closest("[data-drag-card]");
    if (!cardEl) return;

    drag = {
      cardId: cardEl.getAttribute("data-card-id"),
      el: cardEl,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lifted: false,
      overSlot: null,
      ghost: null,
      timer: null
    };

    // 触屏：按住 230ms 不动才提起，先保证页面还能滚动
    if (e.pointerType !== "mouse") {
      drag.timer = setTimeout(function () {
        if (drag && !drag.lifted) liftDrag();
      }, 230);
    }
  });

  document.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    var dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);

    if (!drag.lifted) {
      if (drag.pointerType === "mouse") {
        if (dist > 6) liftDrag();
      } else if (dist > 12) {
        cancelDrag(); // 触屏位移在先 = 想滚动页面，取消长按提起
        return;
      }
    }

    if (drag && drag.lifted) {
      positionGhost();
      updateDropTarget();
    }
  });

  document.addEventListener("pointerup", function (e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var lifted = drag.lifted;
    var cardId = drag.cardId;
    var overSlot = drag.overSlot;
    cancelDrag();

    if (lifted) {
      suppressClick = true;
      setTimeout(function () { suppressClick = false; }, 150);
      if (overSlot) performAssign(cardId, overSlot.getAttribute("data-slot-id"));
    }
  });

  document.addEventListener("pointercancel", function (e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var lifted = drag.lifted;
    cancelDrag();
    if (lifted) {
      suppressClick = true;
      setTimeout(function () { suppressClick = false; }, 150);
    }
  });

  // 提起后阻止页面滚动（touch-action: pan-y 之外的兜底）
  document.addEventListener("touchmove", function (e) {
    if (drag && drag.lifted) e.preventDefault();
  }, { passive: false });

  document.addEventListener("contextmenu", function (e) {
    if (drag && drag.lifted) e.preventDefault();
  });

  /* ================= 初始化 ================= */

  load();
  document.body.setAttribute("data-theme", state.theme);
  renderPresetButtons();
  renderAll();
})();
