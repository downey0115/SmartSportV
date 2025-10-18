/**
 * Notes: 用户管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 2022-01-22  07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');

const util = require('../../../../framework/utils/util.js');
const exportUtil = require('../../../../framework/utils/export_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const UserModel = require('../../model/user_model.js');
const EnrollJoinModel = require('../../model/enroll_join_model.js');
const PayModel = require('../../model/pay_model.js');
const AdminHomeService = require('./admin_home_service.js');

// 导出用户数据KEY
const EXPORT_USER_DATA_KEY = 'EXPORT_USER_DATA';

class AdminUserService extends BaseProjectAdminService {

	/** 获得某个用户信息 */
	async getUser({
		userId,
		fields = '*'
	}) {
		let where = {
			USER_MINI_OPENID: userId,
		}
		return await UserModel.getOne(where, fields);
	}

	/** 取得用户分页列表 */
	async getUserList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件 
		page,
		size,
		oldTotal = 0
	}) {

		orderBy = orderBy || {
			USER_ADD_TIME: 'desc'
		};
		let fields = '*';


		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};

		if (util.isDefined(search) && search) {
			where.or = [{
				USER_NAME: ['like', search]
			},
			{
				USER_MOBILE: ['like', search]
			},
			{
				USER_MEMO: ['like', search]
			},
			];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					where.and.USER_STATUS = Number(sortVal);
					break;
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'USER_ADD_TIME');
					break;
				}
			}
		}
		let result = await UserModel.getList(where, fields, orderBy, page, size, true, oldTotal, false);


		// 为导出增加一个参数condition
		result.condition = encodeURIComponent(JSON.stringify(where));

		return result;
	}

	async statusUser(id, status, reason) {
		if (!id) this.AppError('参数错误');
		status = Number(status);
		const allow = [0,1,8,9];
		if (!allow.includes(status)) this.AppError('非法状态值');
		let where = { USER_MINI_OPENID: id };
		let user = await UserModel.getOne(where, 'USER_MINI_OPENID');
		if (!user) this.AppError('用户不存在');
		let data = { USER_STATUS: status, USER_EDIT_TIME: this._timestamp };
		if (status !== 1) data.USER_CHECK_REASON = reason || '';
		await UserModel.edit(where, data);
	}

	/**删除用户（支持软删除） */
	async delUser(id) {
		if (!id) this.AppError('参数错误');
		// 若存在有效预约或支付流水，则执行软删除（置状态=9禁用+备注原因），否则物理删除
		let hasJoin = await EnrollJoinModel.count({ ENROLL_JOIN_USER_ID: id, ENROLL_JOIN_STATUS: EnrollJoinModel.STATUS.SUCC }) > 0;
		let hasPay = await PayModel.count({ PAY_USER_ID: ['like', id] }) > 0;
		if (hasJoin || hasPay) {
			await UserModel.edit({ USER_MINI_OPENID: id }, { USER_STATUS: 9, USER_CHECK_REASON: '管理员删除（软删）', USER_EDIT_TIME: this._timestamp });
			return { soft: true };
		}
		await UserModel.del({ USER_MINI_OPENID: id });
		return { soft: false };
	}

	// #####################导出用户数据

	/**获取用户数据 */
	async getUserDataURL() {
		return await exportUtil.getExportDataURL(EXPORT_USER_DATA_KEY);
	}

	/**删除用户数据 */
	async deleteUserDataExcel() {
		return await exportUtil.deleteDataExcel(EXPORT_USER_DATA_KEY);
	}

	/**导出用户数据 */
	async exportUserDataExcel(condition, fields) {
		try { condition = JSON.parse(decodeURIComponent(condition || '')); } catch(e) { condition = {}; }
		let where = condition || {};
		let page = 1, size = 200, total = 0, all = [];
		let orderBy = { USER_ADD_TIME: 'desc' };
		let queryFields = '*';
		while (true) {
			let ret = await UserModel.getList(where, queryFields, orderBy, page, size, page===1, 0);
			if (page===1) total = ret.total || 0;
			let list = ret.list || [];
			all = all.concat(list);
			if (!list.length || all.length >= total) break;
			page++;
		}
		// 组装表头和数据
		let header = ['昵称','手机号','状态','注册时间','最近登录','登录次数'];
		let data = [header];
		for (let u of all) {
			data.push([
				u.USER_NAME || '',
				u.USER_MOBILE || '',
				UserModel.getDesc ? UserModel.getDesc('STATUS', u.USER_STATUS) : String(u.USER_STATUS),
				timeUtil.timestamp2Time(u.USER_ADD_TIME),
				u.USER_LOGIN_TIME ? timeUtil.timestamp2Time(u.USER_LOGIN_TIME) : '未登录',
				Number(u.USER_LOGIN_CNT||0)
			]);
		}
		let title = '用户数据';
		let options = { '!cols': [{wch:12},{wch:12},{wch:10},{wch:19},{wch:19},{wch:10}] };
		return await exportUtil.exportDataExcel(EXPORT_USER_DATA_KEY, title, all.length, data, options);
	}

}

module.exports = AdminUserService;