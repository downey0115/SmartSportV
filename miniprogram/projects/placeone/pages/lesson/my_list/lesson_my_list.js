const cloudHelper = require('../../../../../helper/cloud_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({
	data:{ list:[] },
	onLoad(){ ProjectBiz.initPage(this, { title: '我的约课' }); this.load(); },
	async load(){
		let ret = await cloudHelper.callCloudSumbit('lesson/my_list', { page:1, size:50 });
		this.setData({ list: ret.list || ret });
	}
});