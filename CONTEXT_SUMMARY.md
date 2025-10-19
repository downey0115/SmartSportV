# SmartSportV 支付改造上下文摘要（占位期）

- 方案：管理员代下单，用户在“我的预约”中自行支付（方案A）。当前“暂不接入真实支付，保持占位”。
- 支付模式开关：`SETUP_PAY_MODE` 取值 `'free'|'real'`
  - 存储：集合 `setup` → `SETUP_KEY=SETUP_PAY_MODE`，`SETUP_VALUE.val='free'|'real'`
  - 读取：后端 `setup_util.get('SETUP_PAY_MODE')`
  - 配置入口：管理首页 → 支付模式配置（新增页面）

新增/变更点
- 后端路由
  - `'enroll/go_pay'` → `enroll_controller@goPay`（我的预约发起支付入口）
  - `'admin/setup_set'` → `admin/admin_setup_controller@setSetup`（写入配置）
  - `'home/setup_get'` → `home_controller@getSetup`（读取配置）
- 后端服务
  - `EnrollService.goPay`：校验订单状态/归属/核销/过期/已支付；读取 `SETUP_PAY_MODE`；
    - `'free'`：直接提示“当前为免支付模式，无需支付”
    - `'real'`：生成/复用 `ENROLL_JOIN_PAY_TRADE_NO`，调用 `PayService.createPay` 返回占位结构
  - `PayService.createPay`：占位返回 `{ needConfig:true, msg:'支付未开通', payment:null, tradeNo }`
- 前端页面（用户端）
  - 列表页：`projects/placeone/pages/enroll/my_join_list/enroll_my_join_list.*`
    - 显示“待支付”徽标与“去支付”按钮（在待支付且未过期未核销时）
  - 详情页：`projects/placeone/pages/enroll/my_join_detail/enroll_my_join_detail.*`
    - 显示“待支付”状态与“去支付”按钮；调用 `enroll/go_pay`，占位期提示“支付未开通”，不拉起 `wx.requestPayment`
- 前端页面（管理员端）
  - 新增“支付模式配置”页：`projects/placeone/pages/admin/setup/paymode/admin_setup_paymode.*`
    - 读取：`home/setup_get` 回显当前 `SETUP_PAY_MODE`
    - 写入：`admin/setup_set` 保存 `'free'|'real'`
  - 管理首页新增入口：`projects/placeone/pages/admin/index/home/admin_home.wxml`
    - 菜单项：支付模式配置 → 跳转至 `../../setup/paymode/admin_setup_paymode`
- app 路由注册：`miniprogram/app.json` 增加页面 `projects/placeone/pages/admin/setup/paymode/admin_setup_paymode`

当前行为（占位期）
- `SETUP_PAY_MODE='free'`：用户点击“去支付”提示“免支付模式，无需支付”，订单状态不变
- `SETUP_PAY_MODE='real'`：未配置商户时提示“支付未开通”，不触发 `wx.requestPayment`
- 订单已支付/已核销/过期/非成功状态：后端拦截并提示相应文案

测试用例（10）
1) `free` 模式 → 去支付弹“免支付模式，无需支付”
2) `real` 模式未配置 → 去支付弹“支付未开通”
3) 已支付订单 → 去支付提示“订单已支付或无需支付”
4) 非本人订单 → 提示“订单不存在/无权限”
5) 已核销 → 提示“已核销不可支付”
6) 已过期 → 提示“已过期不可支付”
7) 非成功状态 → 提示“订单状态异常”
8) 列表页显示“待支付”+“去支付”按钮（条件满足）
9) 详情页显示“去支付”按钮（条件满足）
10) 连续点击“去支付” → 只出现占位提示，不重复下单

后续正式支付接入（待办）
- 配置项：`SETUP_WXPAY_APPID/MCH_ID/SERIAL_NO/PRIVATE_KEY/APIV3_KEY/NOTIFY_URL`
- 接入流程：微信支付 v3 JSAPI `transactions/jsapi` → 生成 `prepay_id` → 组装前端 `payment` 五要素 → 回调或查单闭环更新 `ENROLL_JOIN_PAY_STATUS`
- 幂等：复用 `ENROLL_JOIN_PAY_TRADE_NO`

最近提交（摘要）
- feat(enroll/pay/ui)：新增待支付能力与 go_pay 接口；列表与详情页显示“待支付/去支付”；占位期提示未开通
- feat(admin)：新增“支付模式配置”页；管理首页增加入口；支持读取与写入 SETUP_PAY_MODE
