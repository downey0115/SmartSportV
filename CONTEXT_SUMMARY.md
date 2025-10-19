# 改动摘要 2025-10-19

- 新增约课模块（lesson）
  - 后端：新增模型 `coach`, `course`, `lesson_schedule`, `lesson_order`；新增服务 `lesson_service.js` 与控制器 `lesson_controller.js`；在 `public/route.js` 注册 `lesson/*` 路由。
  - 前端：新增页面
    - `projects/placeone/pages/lesson/index/lesson_index`（日期+老师+课程+场馆选择）
    - `projects/placeone/pages/lesson/select_session/lesson_select_session`（选择场次）
    - `projects/placeone/pages/lesson/order_confirm/lesson_order_confirm`（确认订单）
    - `projects/placeone/pages/lesson/my_list/lesson_my_list`（我的约课）
  - 首页入口：在 `default_index.wxml` 的菜单中新增“约课”入口。
  - `app.json`：注册上述页面。
- 初始数据：首次访问`lesson/teachers`或`lesson/courses`时自动写入演示教练与课程，确保真实持久化。
- 支付：沿用免支付（`99`）占位逻辑，后续可接入真实支付。

测试建议：参见对话中的10条用例说明。
