const cloudHelper = require('../../../../../helper/cloud_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({
	data:{ coachId:'', courseId:'', venueId:'', date:'', times:[], usedList:[], sel:null },
	onLoad(options){ ProjectBiz.initPage(this, { title: '选择场次' }); this.setData(options); this.loadSessions(); },
	async loadSessions(){
		let { coachId, courseId, venueId, date } = this.data;
		let slots = await cloudHelper.callCloudSumbit('lesson/sessions',{ coachId, courseId, venueId, date });
		this.setData({ times: slots });
	},
	onTime(e){ this.setData({ sel: e.detail }); },
	goOrder(){
		let { coachId, courseId, venueId, date, sel } = this.data;
		wx.navigateTo({ url: `/projects/placeone/pages/lesson/order_confirm/lesson_order_confirm?coachId=${coachId}&courseId=${courseId}&venueId=${venueId}&date=${date}&start=${sel.start}&end=${sel.end}&endPoint=${sel.endPoint}&fee=${sel.price}` });
	}
});