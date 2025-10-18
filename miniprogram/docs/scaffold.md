# SmartSportV 新增功能脚手架（按模块分组）

> 目标：以最小改动扩展功能。遵循 路由→控制器→服务→模型→前端页面 的分层职责。

## 通用流程
1) 后端
- 在 `cloudfunctions/mcloud/project/placeone/public/route.js` 新增 `'module/action' → controller@method`
- 创建控制器 `controller/xxx_controller.js`：仅参数校验、鉴权、转发到服务
- 创建服务 `service/xxx_service.js`：编写业务逻辑，调用模型
- 若需新集合：`model/xxx_model.js` 定义结构（`CL/DB_STRUCTURE/FIELD_PREFIX`）、并提供 `getOne/getList/insert/edit/del`

2) 前端
- 新建页面或组件，挂载到 `miniprogram/app.json`（或在既有模块 pages 下添加）
- 调用云函数：
  - 查询：`cloudHelper.callCloudData('module/action', params)`
  - 提交：`cloudHelper.callCloudSumbit('module/action', params)`
- 统一交互：Loading、异常处理、`pageHelper` 回填列表或节点

3) 校验与安全
- 管理端：服务层使用 `isAdmin()/isSuperAdmin()`
- 内容安全：`content_check_helper`（前端）与 `content_check.js`（后端）

4) 支付（如需）
- 参照 `enroll_service.prepay`：生成订单→返回 `payment`→前端 `wx.requestPayment`→后续修正

---

## 模块模板

### 1. 首页与内容（home）
- 路由示例：
  - `home/list` → `home_controller@getHomeList`
  - `home/setup_get` → `home_controller@setupGet`
- 前端调用示例：
```js
// 拉取首页推荐
await cloudHelper.callCloudData('home/list', {})
```
- 控制器骨架：
```js
// home_controller.js
async function getHomeList() { /* 参数校验 → 调 service */ }
async function setupGet() { /* ... */ }
module.exports = { getHomeList, setupGet }
```
- 服务骨架：
```js
// home_service.js
class HomeService { async getHomeList() { /* 读 news_model/配置 */ } }
module.exports = new HomeService()
```

### 2. 新闻（news）
- 路由：`news/list`, `news/view`
- 前端：
```js
await cloudHelper.callCloudData('news/list', { page, size, keyword })
await cloudHelper.callCloudData('news/view', { id })
```
- 控制器：
```js
async function getNewsList() { /* 校验分页参数 → service */ }
async function viewNews() { /* 校验 id → service */ }
```
- 服务：
```js
class NewsService { async getNewsList(q) { /* 模型分页 */ } async viewNews(id) { /* 详情 */ } }
```

### 3. 用户与认证（passport）
- 路由：`passport/login`, `passport/my_detail`, `passport/register`, `passport/edit_base`, `passport/phone`
- 前端：
```js
await cloudHelper.callCloudSumbit('passport/register', data)
await cloudHelper.callCloudData('passport/my_detail', {})
```
- 控制器/服务：按职责拆分登录、资料、手机号获取

### 4. 收藏（fav）
- 路由：`fav/update`, `fav/del`, `fav/is_fav`, `fav/my_list`
- 前端：
```js
await cloudHelper.callCloudSumbit('fav/update', { oid, type, title, path })
```
- 服务关键点：幂等切换（已收藏→取消；未收藏→新增）

### 5. 预约（enroll - 用户端）
- 路由：`enroll/all`, `enroll/day_used`, `enroll/detail_for_join`, `enroll/prepay`, `enroll/join_edit`, `enroll/my_join_*`
- 前端：
```js
const list = await cloudHelper.callCloudData('enroll/all', { day })
const payment = await cloudHelper.callCloudSumbit('enroll/prepay', params)
wx.requestPayment(payment)
```
- 服务关键点：
  - 时段生成与占用计算
  - 订单与支付单据生成（含价格规则）
  - 支付后修正、取消与退款策略

### 6. 管理端（admin）
- 路由：`admin/login`, `admin/home`, `admin/mgr_*`, `admin/user_*`, `admin/news_*`, `admin/enroll_*`, `admin/setup_*`
- 前端：以模块化页面系列实现
- 服务关键点：
  - 管理员与权限校验（`isAdmin()`）
  - 审计与日志（可选）
  - 导出：使用 `framework/utils` 提供的导出工具
  - 部分演示模式：对外提示不可用

---

## 最佳实践（简洁与复用）
- 控制器尽量无业务，仅参数校验与转发
- 服务层封装业务，避免重复代码；函数尽量短、可复用
- 模型抽象集合访问与聚合；统一字段前缀与结构
- 公共方法沉淀到 `helper` 与 `framework/utils`
- 新功能尽量沿用既有命名与目录约定，降低认知成本

---

## 验证清单（10 条用例）
- 参考 `architecture.md` 第 8 节；新增功能后至少补充 3 条模块内用例进行自测。
