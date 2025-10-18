/**
 * Notes: 登记后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 2022-06-23 07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');
const EnrollService = require('../enroll_service.js');
const util = require('../../../../framework/utils/util.js');
const EnrollModel = require('../../model/enroll_model.js');
const EnrollJoinModel = require('../../model/enroll_join_model.js');
const cloudUtil = require('../../../../framework/cloud/cloud_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const exportUtil = require('../../../../framework/utils/export_util.js');

const DayModel = require('../../model/day_model.js');
const TempModel = require('../../model/temp_model.js');
const UserModel = require('../../model/user_model.js');

// 导出登记数据KEY
const EXPORT_ENROLL_JOIN_DATA_KEY = 'EXPORT_ENROLL_JOIN_DATA';

class AdminEnrollService extends BaseProjectAdminService {

	async getEnrollJoinDetail(enrollJoinId) {

		let where = {};
		if (enrollJoinId.length == 15)
			where.ENROLL_JOIN_CODE = enrollJoinId;
		else
			where = id;

		let fields = '*';

		let enrollJoin = await EnrollJoinModel.getOne(where, fields);

		return enrollJoin;
	}


	// 管理员代预订 
	async enrollJoinByAdmin({
		mobile,
		enrollId,
		price,
		start,
		end,
		endPoint,
		day
	}) {
		// 校验基础参数
		if (!mobile) this.AppError('手机必填');
		if (!enrollId || !day || !start || !end || !endPoint) this.AppError('时间或场地参数不完整');

		// 场地存在与启用校验
		let enroll = await EnrollModel.getOne({ _id: enrollId, ENROLL_STATUS: 1 }, '*');
		if (!enroll) this.AppError('场地不存在或未启用');

		// 冲突校验（同日同起止同场地）
		let conflict = await EnrollJoinModel.getOne({ ENROLL_JOIN_ENROLL_ID: enrollId, ENROLL_JOIN_DAY: day, ENROLL_JOIN_STATUS: EnrollJoinModel.STATUS.SUCC, ENROLL_JOIN_START: start, ENROLL_JOIN_END: end });
		if (conflict) this.AppError('所选时段已被预订');

		// 查找/创建用户（按手机号）
		let user = await UserModel.getOne({ USER_MOBILE: mobile }, 'USER_MINI_OPENID,USER_NAME,USER_STATUS');
		if (!user) {
			let now = timeUtil.time();
			let name = '管理员代预约';
			await UserModel.insert({
				USER_MINI_OPENID: dataUtil.genRandomString(28),
				USER_MOBILE: mobile,
				USER_NAME: name,
				USER_FORMS: [],
				USER_OBJ: { mobile, name },
				USER_ADD_TIME: now,
				USER_REG_TIME: now,
				USER_LOGIN_TIME: now,
				USER_LOGIN_CNT: 0,
				USER_STATUS: 1
			});
			user = await UserModel.getOne({ USER_MOBILE: mobile }, 'USER_MINI_OPENID,USER_NAME');
		}

		let fee = Number(price || 0);
		if (isNaN(fee) || fee < 0) fee = 0;

		// 读取支付模式
		const setupUtil = require('../../../../framework/utils/setup/setup_util.js');
		const payMode = await setupUtil.get('SETUP_PAY_MODE'); // 'free'|'real'

		let nowTs = this._timestamp;
		let forms = [
			{ mark: 'name', type: 'text', title: '姓名', val: user && user.USER_NAME ? user.USER_NAME : mobile },
			{ mark: 'phone', type: 'text', title: '手机号', val: mobile },
		];

		let data = {
			ENROLL_JOIN_USER_ID: user ? user.USER_MINI_OPENID : 'ADMIN',
			ENROLL_JOIN_ENROLL_ID: enrollId,
			ENROLL_JOIN_ENROLL_TITLE: enroll.ENROLL_TITLE,
			ENROLL_JOIN_CATE_ID: enroll.ENROLL_CATE_ID,
			ENROLL_JOIN_CATE_NAME: enroll.ENROLL_CATE_NAME,
			ENROLL_JOIN_CODE: dataUtil.genRandomIntString(15),
			ENROLL_JOIN_DAY: day,
			ENROLL_JOIN_START: start,
			ENROLL_JOIN_END: end,
			ENROLL_JOIN_END_POINT: endPoint,
			ENROLL_JOIN_START_FULL: day + ' ' + start,
			ENROLL_JOIN_END_FULL: day + ' ' + endPoint,
			ENROLL_JOIN_FEE: Math.round(fee * 100),
			ENROLL_JOIN_PAY_FEE: Math.round(fee * 100),
			ENROLL_JOIN_PAY_STATUS: (payMode === 'real' ? 0 : 99),
			ENROLL_JOIN_STATUS: EnrollJoinModel.STATUS.SUCC,
			ENROLL_JOIN_IS_CHECKIN: 0,
			ENROLL_JOIN_FORMS: forms,
			ENROLL_JOIN_OBJ: dataUtil.dbForms2Obj(forms),
			ENROLL_JOIN_ADD_TIME: nowTs,
			ENROLL_JOIN_LAST_TIME: nowTs,
		};

		let id = await EnrollJoinModel.insert(data);
		return { id };
	}

	/** 管理员按钮核销 */
	async checkinEnrollJoin(enrollJoinId, val) {
		// val: 1=核销, 0=取消核销
		val = Number(val);
		if (![0, 1].includes(val)) this.AppError('非法参数');

		let enrollJoin = await EnrollJoinModel.getOne(enrollJoinId, '*');
		if (!enrollJoin) this.AppError('记录不存在');

		if (enrollJoin.ENROLL_JOIN_STATUS != EnrollJoinModel.STATUS.SUCC)
			this.AppError('非成功订单不可操作');

		// 允许取消核销随时进行；执行核销需在未过期时段内
		if (val === 1) {
			if (enrollJoin.ENROLL_JOIN_END_FULL <= timeUtil.time('Y-M-D h:m'))
				this.AppError('已过期，不能核销');
		}

		let data = {
			ENROLL_JOIN_IS_CHECKIN: val,
			ENROLL_JOIN_CHECKIN_TIME: (val === 1) ? this._timestamp : 0,
			ENROLL_JOIN_LAST_TIME: this._timestamp,
		};
		await EnrollJoinModel.edit(enrollJoinId, data);
	}

	/** 管理员扫码核销 */
	async scanEnrollJoin(code) {
		if (!code || code.length !== 15) this.AppError('无效的预订码');
		let enrollJoin = await EnrollJoinModel.getOne({ ENROLL_JOIN_CODE: code }, '*');
		if (!enrollJoin) this.AppError('预订记录不存在');

		if (enrollJoin.ENROLL_JOIN_STATUS != EnrollJoinModel.STATUS.SUCC)
			this.AppError('当前状态不允许核销');

		if (enrollJoin.ENROLL_JOIN_IS_CHECKIN == 1)
			return '该订单已核销';

		if (enrollJoin.ENROLL_JOIN_END_FULL <= timeUtil.time('Y-M-D h:m'))
			this.AppError('已过期，不能核销');

		await EnrollJoinModel.edit({ _id: enrollJoin._id }, {
			ENROLL_JOIN_IS_CHECKIN: 1,
			ENROLL_JOIN_CHECKIN_TIME: this._timestamp,
			ENROLL_JOIN_LAST_TIME: this._timestamp,
		});

		return '核销成功';
	}


	/**取得分页列表 */
	async getAdminEnrollList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'ENROLL_ORDER': 'asc',
			'ENROLL_ADD_TIME': 'desc'
		};
		let fields = 'ENROLL_DAYS,ENROLL_TITLE,ENROLL_CATE_ID,ENROLL_CATE_NAME,ENROLL_EDIT_TIME,ENROLL_ADD_TIME,ENROLL_ORDER,ENROLL_STATUS,ENROLL_VOUCH,ENROLL_EDIT_SET,ENROLL_CANCEL_SET,ENROLL_QR,ENROLL_OBJ';

		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};

		if (util.isDefined(search) && search) {
			where.or = [{
				ENROLL_TITLE: ['like', search]
			},];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'cateId': {
					where.and.ENROLL_CATE_ID = String(sortVal);
					break;
				}
				case 'status': {
					where.and.ENROLL_STATUS = Number(sortVal);
					break;
				}
				case 'vouch': {
					where.and.ENROLL_VOUCH = 1;
					break;
				}
				case 'top': {
					where.and.ENROLL_ORDER = 0;
					break;
				}
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'ENROLL_ADD_TIME');
					break;
				}
			}
		}

		return await EnrollModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/**置顶与排序设定 */
	async sortEnroll(id, sort) {
		this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：cclinux0730');
	}


	/**添加 */
	async insertEnroll({
		title,

		cateId,
		cateName,
		cancelSet,
		editSet,

		order,
		forms,
		joinForms,
	}) {
		// 最小可用实现：插入一条启用中的场地记录
		let now = timeUtil.time();
		forms = Array.isArray(forms) ? forms : [];
		joinForms = Array.isArray(joinForms) ? joinForms : [];

		let doc = {
			ENROLL_TITLE: title.trim(),
			ENROLL_STATUS: 1,
			ENROLL_CATE_ID: String(cateId),
			ENROLL_CATE_NAME: String(cateName || ''),
			ENROLL_CANCEL_SET: Number(cancelSet || 1),
			ENROLL_EDIT_SET: Number(editSet || 1),
			ENROLL_ORDER: Number(order || 9999),
			ENROLL_VOUCH: 0,
			ENROLL_FORMS: forms,
			ENROLL_OBJ: dataUtil.dbForms2Obj(forms, true),
			ENROLL_JOIN_FORMS: joinForms,
			ENROLL_DAYS: [],
			ENROLL_DAY_CNT: 0,
			ENROLL_QR: '',
			ENROLL_VIEW_CNT: 0,
			ENROLL_JOIN_CNT: 0,
			ENROLL_ADD_TIME: now,
			ENROLL_EDIT_TIME: now
		};

		let id = await EnrollModel.insert(doc);
		return { id };
	}

	/**删除数据 */
	async delEnroll(id) {
		// 若存在有效预约记录则禁止删除，避免脏数据
		let joinCnt = await EnrollJoinModel.count({ ENROLL_JOIN_ENROLL_ID: id, ENROLL_JOIN_STATUS: EnrollJoinModel.STATUS.SUCC });
		if (joinCnt > 0) this.AppError('存在有效的预约记录，无法删除，请先取消相关预约');

		// 删除该场地的日期时段配置
		await DayModel.del({ DAY_ENROLL_ID: id });

		// 删除场地
		await EnrollModel.del(id);
	}

	/**获取信息 */
	async getEnrollDetail(id) {
		return await EnrollModel.getOne(id, '*');
	}


	// 更新forms信息（仅更新含图片类字段时的回填）
	async updateEnrollForms({
		id,
		hasImageForms
	}) {
		if (!Array.isArray(hasImageForms)) hasImageForms = [];
		let enroll = await EnrollModel.getOne(id, '*');
		if (!enroll) this.AppError('场地不存在');
		// 这里按最小实现：将 hasImageForms 合并回 ENROLL_FORMS 并更新 ENROLL_OBJ
		let forms = Array.isArray(enroll.ENROLL_FORMS) ? enroll.ENROLL_FORMS : [];
		// 按 mark 替换
		for (let i = 0; i < hasImageForms.length; i++) {
			let inc = hasImageForms[i] || {};
			for (let j = 0; j < forms.length; j++) {
				if (forms[j].mark && inc.mark && forms[j].mark === inc.mark) {
					forms[j] = { ...forms[j], ...inc };
				}
			}
		}
		await EnrollModel.edit(id, { ENROLL_FORMS: forms, ENROLL_OBJ: dataUtil.dbForms2Obj(forms, true), ENROLL_EDIT_TIME: timeUtil.time() });
		return { id };
	}


	/**更新数据 */
	async editEnroll({
		id,
		title,

		cateId, // 二级分类 
		cateName,

		cancelSet,
		editSet,

		order,
		forms,
		joinForms
	}) {
		let enroll = await EnrollModel.getOne(id, '*');
		if (!enroll) this.AppError('场地不存在');

		forms = Array.isArray(forms) ? forms : [];
		joinForms = Array.isArray(joinForms) ? joinForms : [];

		let data = {
			ENROLL_TITLE: title.trim(),
			ENROLL_CATE_ID: String(cateId),
			ENROLL_CATE_NAME: String(cateName || ''),
			ENROLL_CANCEL_SET: Number(cancelSet || 1),
			ENROLL_EDIT_SET: Number(editSet || 1),
			ENROLL_ORDER: Number(order || 9999),
			ENROLL_FORMS: forms,
			ENROLL_OBJ: dataUtil.dbForms2Obj(forms, true),
			ENROLL_JOIN_FORMS: joinForms,
			ENROLL_EDIT_TIME: timeUtil.time()
		};

		await EnrollModel.edit(id, data);
		return { id };
	}

	/**修改状态 */
	async statusEnroll(id, status) {
		// status: 1=启用, 0=停用
		if (![0,1].includes(Number(status))) this.AppError('非法状态值');
		await EnrollModel.edit(id, { ENROLL_STATUS: Number(status) });
	}


	//#############################
	/**登记分页列表 */
	async getEnrollJoinList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'ENROLL_JOIN_ADD_TIME': 'desc'
		};
		let fields = '*';

		let where = {
		 
		};
		if (util.isDefined(search) && search) {
			if (search.length == 10 && search.includes('-')) {
				where['ENROLL_JOIN_DAY'] = search;
				console.log(where)
			}
			else {
				where['ENROLL_JOIN_FORMS.val'] = {
					$regex: '.*' + search,
					$options: 'i'
				};
			}

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'cateId': {
					where.ENROLL_JOIN_CATE_ID = sortVal;
					break;
				}
				case 'status': {
					where.ENROLL_JOIN_STATUS = Number(sortVal);
					break;
				}
				case 'check': {
					where.ENROLL_JOIN_IS_CHECK = Number(sortVal);
					break;
				}
				case 'new': {
					orderBy = {
						'ENROLL_JOIN_ADD_TIME': 'desc'
					};
				}

			}
		}

		return await EnrollJoinModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/** 管理员取消订单 */
	async cancelEnrollJoin(enrollJoinId) {
		if (!enrollJoinId) this.AppError('参数错误');
		let where = { _id: enrollJoinId, ENROLL_JOIN_STATUS: EnrollJoinModel.STATUS.SUCC };
		let enrollJoin = await EnrollJoinModel.getOne(where, '*');
		if (!enrollJoin) this.AppError('未找到可取消的记录');

		if (enrollJoin.ENROLL_JOIN_IS_CHECKIN == 1)
			this.AppError('该预订已核销，不能取消');

		// 暂不处理退款逻辑；仅允许未支付或免支付订单被后台取消
		if (enrollJoin.ENROLL_JOIN_PAY_STATUS == 1)
			this.AppError('已支付订单暂不支持后台取消');

		let data = {
			ENROLL_JOIN_STATUS: EnrollJoinModel.STATUS.ADMIN_CANCEL,
			ENROLL_JOIN_CANCEL_TIME: this._timestamp,
			ENROLL_JOIN_IS_CHECKIN: 0,
			ENROLL_JOIN_LAST_TIME: this._timestamp,
		};
		await EnrollJoinModel.edit(enrollJoinId, data);
	}

	// #####################导出登记数据
	/**获取登记数据 */
	async getEnrollJoinDataURL() {
		return await exportUtil.getExportDataURL(EXPORT_ENROLL_JOIN_DATA_KEY );
	}

	/**删除登记数据 */
	async deleteEnrollJoinDataExcel() {
		return await exportUtil.deleteDataExcel(EXPORT_ENROLL_JOIN_DATA_KEY);
	}

	/**导出登记数据 */
	async exportEnrollJoinDataExcel({
		cateId,
		start,
		end,
		status
	}) {
		// 组装查询条件
		let where = { };
		if (cateId) where.ENROLL_JOIN_CATE_ID = String(cateId);
		if (start && end) where.ENROLL_JOIN_DAY = ['between', start, end];

		// 状态筛选：1 成功, 9 用户取消, 99 系统取消, 998 已核销, 999 所有
		status = Number(status || 1);
		if (status === 998) {
			where.ENROLL_JOIN_STATUS = EnrollJoinModel.STATUS.SUCC;
			where.ENROLL_JOIN_IS_CHECKIN = 1;
		} else if (status === 999) {
			// 全部：不过滤状态
		} else {
			where.ENROLL_JOIN_STATUS = status;
		}

		// 拉取全部数据（分批）
		let page = 1, size = 200; // 单批上限
		let orderBy = { 'ENROLL_JOIN_ADD_TIME': 'desc' };
		let fields = '*';
		let total = 0;
		let all = [];
		while (true) {
			let ret = await EnrollJoinModel.getList(where, fields, orderBy, page, size, page === 1, 0);
			if (page === 1) total = ret.total || 0;
			let list = ret.list || [];
			all = all.concat(list);
			if (!list.length || all.length >= total) break;
			page++;
		}

		// 构造导出数据
		let header = [
			'预订码', '分类', '场地', '日期', '开始', '结束', '标价(元)', '支付(元)', '支付状态', '订单状态', '是否核销', '核销时间', '预约人', '手机号', '创建时间', '最后修改'
		];
		let data = [header];
		for (let item of all) {
			let payFeeY = (Number(item.ENROLL_JOIN_PAY_FEE || 0) / 100).toFixed(2);
			let feeY = (Number(item.ENROLL_JOIN_FEE || 0) / 100).toFixed(2);
			let payStatusTxt = (item.ENROLL_JOIN_PAY_STATUS == 1) ? '已支付' : (item.ENROLL_JOIN_PAY_STATUS == 99 ? '免支付' : '未支付');
			let statusTxt = (item.ENROLL_JOIN_STATUS == 1) ? '成功' : (item.ENROLL_JOIN_STATUS == 9 ? '用户取消' : (item.ENROLL_JOIN_STATUS == 99 ? '系统取消' : String(item.ENROLL_JOIN_STATUS)));
			let isCheckTxt = item.ENROLL_JOIN_IS_CHECKIN == 1 ? '是' : '否';
			let name = (item.ENROLL_JOIN_OBJ && item.ENROLL_JOIN_OBJ.name) || '';
			let phone = (item.ENROLL_JOIN_OBJ && item.ENROLL_JOIN_OBJ.phone) || '';
			let addTime = timeUtil.timestamp2Time(item.ENROLL_JOIN_ADD_TIME);
			let lastTime = timeUtil.timestamp2Time(item.ENROLL_JOIN_LAST_TIME);
			let checkTime = timeUtil.timestamp2Time(item.ENROLL_JOIN_CHECKIN_TIME);
			data.push([
				item.ENROLL_JOIN_CODE || '',
				item.ENROLL_JOIN_CATE_NAME || '',
				item.ENROLL_JOIN_ENROLL_TITLE || '',
				item.ENROLL_JOIN_DAY || '',
				item.ENROLL_JOIN_START || '',
				item.ENROLL_JOIN_END_POINT || '',
				feeY,
				payFeeY,
				payStatusTxt,
				statusTxt,
				isCheckTxt,
				checkTime,
				name,
				phone,
				addTime,
				lastTime
			]);
		}

		let title = '场地预约订单';
		let options = { '!cols': [{wch:18},{wch:10},{wch:20},{wch:12},{wch:8},{wch:8},{wch:10},{wch:10},{wch:10},{wch:10},{wch:8},{wch:19},{wch:12},{wch:12},{wch:19},{wch:19}] };
		return await exportUtil.exportDataExcel(EXPORT_ENROLL_JOIN_DATA_KEY, title, all.length, data, options);
	}


	/** 计算排期 */
	async statDayCnt(enrollId) {
		this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：cclinux0730');
	}

	/** 更新日期设置 */
	async editDays(
		{
			enrollId,
			days
		}
	) {
		// 允许清空：当 days 为空数组时，清理该场地的所有未来日期配置
		let enroll = await EnrollModel.getOne(enrollId, 'ENROLL_ID,ENROLL_CATE_ID,ENROLL_STATUS');
		if (!enroll) this.AppError('场地不存在');

		if (!Array.isArray(days)) this.AppError('参数格式错误');

		// 先删除同一场地下传入这些day的旧记录，再插入新记录（幂等）
		if (days.length === 0) {
			await DayModel.del({ DAY_ENROLL_ID: enrollId });
			return { cnt: 0 };
		}

		// 收集要覆盖的天
		let coverDays = days.map(d => d.day).filter(Boolean);
		if (coverDays.length === 0) this.AppError('缺少有效日期');

		await DayModel.del({ DAY_ENROLL_ID: enrollId, day: ['in', coverDays] });

		let now = timeUtil.time();
		let insertCnt = 0;
		for (let i = 0; i < days.length; i++) {
			let node = days[i] || {};
			let d = String(node.day || '').trim();
			let dayDesc = String(node.dayDesc || '').trim();
			let times = Array.isArray(node.times) ? node.times : [];

			if (!d) continue;

			// 过滤并标准化 times
			let stdTimes = [];
			for (let j = 0; j < times.length; j++) {
				let t = times[j] || {};
				let start = String(t.start || '').trim();
				let end = String(t.end || '').trim();
				let price = Number(t.price || 0);
				if (!start || !end) continue;
				if (isNaN(price) || price < 0) price = 0;
				stdTimes.push({
					mark: t.mark || dataUtil.genRandomString(8),
					start,
					end,
					price,
					cnt: 0
				});
			}

			let doc = {
				DAY_ENROLL_ID: enrollId,
				DAY_CATE_ID: enroll.ENROLL_CATE_ID || 0,
				day: d,
				dayDesc: dayDesc || d,
				times: stdTimes,
				DAY_ADD_TIME: now,
				DAY_EDIT_TIME: now
			};

			await DayModel.insert(doc);
			insertCnt++;
		}

		return { cnt: insertCnt };
	}

	async getAllDays(enrollId) {
		// 删除之前超时数据
		let nowDay = timeUtil.time('Y-M-D');
		let whereOut = {
			DAY_ENROLL_ID: enrollId,
			day: ['<', nowDay]
		}
		console.log(whereOut)
		await DayModel.del(whereOut);

		let where = {
			DAY_ENROLL_ID: enrollId,
		}
		return DayModel.getAll(where, 'day, dayDesc, times');
	}

	/****************模板 */

	/**添加模板 */
	async insertTemp({
		name,
		times,
	}) {
		if (!name || !Array.isArray(times)) this.AppError('参数错误');
		// 规范化 times
		let stdTimes = [];
		for (let j = 0; j < times.length; j++) {
			let t = times[j] || {};
			let start = String(t.start || '').trim();
			let end = String(t.end || '').trim();
			let price = Number(t.price || 0);
			if (!start || !end) continue;
			if (isNaN(price) || price < 0) price = 0;
			stdTimes.push({
				mark: t.mark || dataUtil.genRandomString(8),
				start,
				end,
				price,
				cnt: 0
			});
		}
		let now = timeUtil.time();
		return await TempModel.insert({
			TEMP_NAME: name,
			TEMP_TIMES: stdTimes,
			TEMP_ADD_TIME: now,
			TEMP_EDIT_TIME: now
		});
	}

	/**更新模板：批量设置所有时段价格 */
	async editTemp({
		id,
		price,
	}) {
		let temp = await TempModel.getOne(id, '*');
		if (!temp) this.AppError('模板不存在');
		let p = Number(price);
		if (isNaN(p) || p < 0) this.AppError('价格不合法');
		let times = Array.isArray(temp.TEMP_TIMES) ? temp.TEMP_TIMES : [];
		for (let i = 0; i < times.length; i++) {
			times[i].price = p;
		}
		await TempModel.edit(id, { TEMP_TIMES: times, TEMP_EDIT_TIME: timeUtil.time() });
		return { cnt: times.length };
	}


	/**删除数据 */
	async delTemp(id) {
		await TempModel.del(id);
		return { id };
	}


	/**分页列表 */
	async getTempList() {
		let orderBy = {
			'TEMP_ADD_TIME': 'desc'
		};
		let fields = 'TEMP_NAME,TEMP_TIMES';

		let where = {
		};
		return await TempModel.getAll(where, fields, orderBy);
	}

}

module.exports = AdminEnrollService;