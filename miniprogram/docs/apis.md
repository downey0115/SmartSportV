# SmartSportV 接口文档（按模块分组）

> 统一调用：前端通过 `cloudHelper.callCloudData`（查询）或 `cloudHelper.callCloudSumbit`（提交），云函数 `name: 'mcloud'`，路由在 `cloudfunctions/mcloud/project/placeone/public/route.js`。

## 目录
- 首页与内容（home）
- 新闻（news）
- 用户与认证（passport）
- 收藏（fav）
- 预约（enroll - 用户端）
- 管理端（admin）

---

## 首页与内容（home）

### home/list
- 作用：获取首页推荐内容（新闻置顶/最新）
- 前端：`pages/default/index/default_index`
- 后端：`home_controller@getHomeList` → `home_service.getHomeList`
- 入参：无或分页/过滤（可选）
- 出参：`items: Array<News>`

### home/setup_get
- 作用：获取首页配置（推荐位等）
- 前端：`admin_content`/相关页面
- 后端：`home_controller@setupGet`
- 入参：无
- 出参：`setup: Object`

---

## 新闻（news）

### news/list
- 作用：分页获取新闻列表
- 前端：`pages/news/index`
- 后端：`news_controller@getNewsList` → `news_service.getNewsList`
- 入参：`page, size, keyword(可选), cateId(可选)`
- 出参：`list: Array<News>, total`

### news/view
- 作用：获取新闻详情
- 前端：`pages/news/detail`
- 后端：`news_controller@viewNews` → `news_service.viewNews`
- 入参：`id`
- 出参：`news: {title, content, cover, addTime, ...}`

---

## 用户与认证（passport）

### passport/login
- 作用：用户登录（凭小程序身份）
- 前端：`comm/biz/admin_biz`（管理员登录独立）/普通登录在用户流程中隐式
- 后端：`passport_controller@login` → `passport_service.login`
- 入参：`code/iv/encryptedData`（视实现）
- 出参：`token, user`

### passport/my_detail
- 作用：我的详情与统计
- 前端：`pages/my/index`
- 后端：`passport_controller@myDetail` → `passport_service.getMyDetail`
- 入参：无（鉴权基于 token）
- 出参：`user, stats: {todayCnt, runCnt, totalCnt}`

### passport/register
- 作用：注册用户
- 前端：`pages/my/reg`
- 后端：`passport_controller@register` → `passport_service.register`
- 入参：`name, mobile, forms, status`
- 出参：`token, user`

### passport/edit_base
- 作用：编辑基础资料
- 前端：`pages/my/edit`
- 后端：`passport_controller@editBase` → `passport_service.editBase`
- 入参：`name, mobile, forms`
- 出参：`ok:1`

### passport/phone
- 作用：获取或绑定手机号
- 前端：相关绑定按钮
- 后端：`passport_controller@phone`
- 入参：`iv, encryptedData`
- 出参：`mobile`

---

## 收藏（fav）

### fav/update
- 作用：收藏/取消收藏（幂等切换）
- 前端：`comm/biz/fav_biz`
- 后端：`fav_controller@update` → `fav_service.updateFav`
- 入参：`oid, type, title, path`
- 出参：`isFav: 0|1`

### fav/del
- 作用：删除收藏记录
- 前端：我的收藏列表页面
- 后端：`fav_controller@del`
- 入参：`id`
- 出参：`ok:1`

### fav/is_fav
- 作用：判断是否收藏
- 前端：详情页按钮态
- 后端：`fav_controller@isFav`
- 入参：`oid, type`
- 出参：`isFav:0|1`

### fav/my_list
- 作用：我的收藏列表
- 前端：`pages/my/fav`
- 后端：`fav_controller@myList`
- 入参：`page, size`
- 出参：`list, total`

---

## 预约（enroll - 用户端）

### enroll/all
- 作用：获取可预约场地列表与时段
- 前端：`pages/enroll/all`
- 后端：`enroll_controller@getAllEnroll` → `enroll_service.getAllEnroll`
- 入参：`cateId(可选), day`
- 出参：`enrollList: Array<{timeslots, price, ...}>`

### enroll/day_used
- 作用：获取某日已占用时段
- 前端：`pages/enroll/all`
- 后端：`enroll_controller@getDayUsed`
- 入参：`day`
- 出参：`usedSlots: Array`

### enroll/list
- 作用：分页获取场地（含筛选）
- 前端：列表页
- 后端：`enroll_controller@getEnrollList`
- 入参：`page, size, cateId(可选)`
- 出参：`list, total`

### enroll/detail_for_join
- 作用：预约前详情（含可预约时段/价格/规则）
- 前端：`pages/enroll/join`
- 后端：`enroll_controller@getDetailForJoin`
- 入参：`enrollId`
- 出参：`enroll: {timeslots, priceRules, formsTemplate, ...}`

### enroll/prepay
- 作用：生成预约与支付单，返回支付参数
- 前端：`pages/enroll/join` → `wx.requestPayment`
- 后端：`enroll_controller@prepay` → `enroll_service.prepay`
- 入参：`enrollId, day, start, end, price, forms`
- 出参：`payment: WxPayParams, tradeNo`

### enroll/join_edit
- 作用：编辑我的预约信息
- 前端：`pages/enroll/join_edit`
- 后端：`enroll_controller@joinEdit` → `enroll_service.joinEdit`
- 入参：`enrollJoinId, forms`
- 出参：`ok:1`

### enroll/my_join_list
- 作用：我的预约列表
- 前端：`pages/enroll/my_join_list`
- 后端：`enroll_controller@getMyJoinList` → `enroll_service.getMyEnrollJoinList`
- 入参：`page, size, status(可选)`
- 出参：`list, total`

### enroll/my_join_detail
- 作用：我的预约详情
- 前端：`pages/enroll/my_join_detail`
- 后端：`enroll_controller@getMyJoinDetail`
- 入参：`enrollJoinId`
- 出参：`join: {status, payStatus, forms, ...}`

### enroll/my_join_cancel
- 作用：取消预约（按规则）
- 前端：`pages/enroll/my_join_detail`
- 后端：`enroll_controller@myJoinCancel` → `enroll_service.cancelMyEnrollJoin`
- 入参：`enrollJoinId`
- 出参：`ok:1`

---

## 管理端（admin）

### admin/login
- 作用：管理员登录
- 前端：`admin_login`
- 后端：`admin_controller@login` 或 `admin_mgr_controller@login`
- 入参：`account, password` 或小程序管理员认证
- 出参：`token, admin`

### admin/home
- 作用：管理端首页数据
- 前端：`admin_home`
- 后端：`admin_controller@home`
- 入参：无
- 出参：`stats, shortcuts`

### 管理员管理（admin_mgr_*）
- 作用：列表、新增、编辑、状态、日志
- 前端：`admin_mgr_*`
- 后端：`admin_mgr_controller` → `admin_mgr_service`
- 说明：部分修改操作为演示模式（不可用）

### 用户管理（admin_user_*）
- 作用：列表、详情、导出、删除、状态
- 前端：`admin_user_*`
- 后端：`admin_user_controller` → `admin_user_service`
- 说明：删除/状态等操作可能为演示模式

### 新闻管理（admin_news_*）
- 作用：列表、详情、新增、编辑、置顶、首页推荐、状态、二维码
- 前端：`admin_news_*`
- 后端：`admin_news_controller` → `admin_news_service`
- 说明：多数修改类操作演示模式

### 场地与预约管理（admin/enroll_*）
- 作用：列表、详情、编辑表单、排序、状态、预约记录、管理员代预约、核销扫码、取消、导出、日期模板维护
- 前端：`admin_enroll_*`
- 后端：`enroll_admin_controller` / `enroll_admin_service`
- 说明：查询/导出/模板维护可用，其他变更类可能演示模式

### 系统设置（admin_setup_*）
- 作用：基础内容设置（About、首页推荐等）
- 前端：`admin_setup_*`, `admin_content`
- 后端：`admin_setup_controller`, `home_controller`

---

## 公共约定
- 鉴权：用户端与管理员端区分，服务层提供 `isAdmin()/isSuperAdmin()`
- 校验：`framework/validate/data_check.js` 与 `content_check.js`
- 错误：控制器抛出 `AppError`，前端统一提示
- 支付：`enroll_service.prepay` 与后续修正 `fixEnrollJoinPay`
