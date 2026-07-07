# Handover Notes

这份文档给下一个 agent。当前项目仍在规划阶段，重点不是立刻做最终页面，而是把产品模型和地点数据结构定清楚。

## 已定方向

- 最终是 GitHub Pages 可部署的纯静态网站。
- GitHub repo 应是 `RaymondFongHow/travel`，宜兴项目位于 repo 内的 `yixing/`。
- 目标访问路径是 `travel.raymondfonghow.com/yixing`。
- 面向四位朋友的宜兴旅行，两男两女，其中包括用户。
- 页面应该简约、现代、sans-serif。
- 不做传统旅游攻略，也不先做固定行程。
- 第一版核心是候选卡片 / 可拖拽板块 / 行程拼配。
- 用户想让朋友通过拼配感受不同感官主题，而不是被动阅读。
- 地点、体验、住宿、餐饮都可以是卡片。
- 自由时间、休息、Saboteur / 打牌也应该是卡片。
- 住宿必须参与动线判断。
- 交通地图是时距网络图，不是普通地理地图。
- 只有明确存在 direct edge 的两点才能连线。
- 如果 A 到 C 应经过 B，就不要画 A-C 直连。

## 用户约束

- 可以周五晚上到，也可以周六早上到。
- 周一吃完中饭后开始回程。
- 高铁到达和离开。
- 宜兴内部以打车为主，步行为辅。
- 骑行可以作为体验，但不是为了交通骑行。
- 住宿不需要贵，以方便行程为主。
- 用户提到“100 CNY 以内标间两间”，这里需要确认是每间每晚 100 CNY 以内，还是总预算。
- 可以接受长时间走路 / 骑行，但最好避开太热。
- 体验型活动优先级高。
- “真的进入地方”为主，好看重要但为辅。
- 行程不要排太死，没事时可能会停下来玩 Saboteur / 打牌。

## 不要误读

- 不要直接输出一个固定 itinerary 作为主产品。
- 不要把每个时间槽塞满。
- 不要把宜兴简化成紫砂壶购物。
- 不要把交通网络图做成自动最短路径规划器。
- 不要使用需要后端或账号系统的方案。
- 不要把站点写成只能部署在域名根路径；宜兴页面需要能在 `/yixing` 子路径下工作。
- 不要把 locationCode 当成自动连线依据。
- 不要默认住宿在山里；预算和高铁模式下城区 / 东氿更稳，但仍应作为卡片候选。

## 下一步建议

1. 建立候选卡片池。
2. 给每张卡补 `type / theme / locationCode / durationMin / heatRisk / reservationNeeded / experienceValue / visualValue`。
3. 把地点分成 `must / strong / optional / avoid-for-this-trip`。
4. 建立 `transportEdges`，只记录确认直连的交通关系。
5. 建立 `blockedEdges`，记录容易误连但不应直连的关系。
6. 之后再进入实际页面实现。

## 仍需讨论的问题

- 住宿预算到底是每间每晚 100 CNY 以内，还是两间总计 100 CNY 以内。
- 周五晚上到的概率有多高；这会影响是否需要 `fri-night-arrival` preset。
- 是否需要网站里支持两个 preset：周五晚到 / 周六早到。
- 朋友是否都愿意做手作体验，还是只需要用户主推。
- 紫砂体验希望偏游客友好，还是偏工作室深度。
- 是否需要预约类卡片在 UI 中有更强提示。
- 餐饮要不要进入第一版卡片池；如果进入，是否先只做“餐饮类型”而不是具体店。
- 是否需要先查真实住宿候选，还是先用住宿区域卡片占位。
- 交通时间使用高德/百度人工估算后写死，还是先用粗略区域估算。
- 网站是否需要分享拼配结果；如果需要，优先考虑 URL hash。

## 文件入口

- `README.md`：travel repo 总览。
- `yixing/README.md`：宜兴项目总览。
- `yixing/docs/experience-concept.md`：感官和视觉方向。
- `yixing/docs/static-interaction-model.md`：静态交互和数据模型。
- `yixing/docs/card-composition-model.md`：卡片拼配核心产品模型。
- `yixing/docs/network-map-model.md`：交通时距网络图。
- `yixing/docs/place-options-to-discuss.md`：地点讨论模板。
