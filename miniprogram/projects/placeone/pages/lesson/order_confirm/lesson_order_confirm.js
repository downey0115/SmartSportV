const cloudHelper = require('../../../../../helper/cloud_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({
	data:{ coachId:'', courseId:'', venueId:'', date:'', start:'', end:'', endPoint:'', fee:0 },
	onLoad(options){ ProjectBiz.initPage(this, { title: '确认订单' }); this.setData(options); this.setData({ feeY: (Number(this.data.fee)/100).toFixed(2) }); },
	async submit(){
		let { coachId, courseId, venueId, date, start, end, endPoint, fee } = this.data;
		let ret = await cloudHelper.callCloudSumbit('lesson/order_create', { coachId, courseId, venueId, date, start, end, endPoint, fee: Number(fee), forms: [] }, { title: '提交中' });
		wx.showToast({ title: '下单成功', icon: 'success' });
		wx.redirectTo({ url: `/projects/placeone/pages/lesson/my_list/lesson_my_list` });
	}
});