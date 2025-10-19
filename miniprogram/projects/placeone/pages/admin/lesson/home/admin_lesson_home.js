const cloudHelper = require('../../../../../helper/cloud_helper.js');
const AdminBiz = require('../../../biz/admin_biz.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({
	data:{ isAdmin:false },
	onLoad(){ ProjectBiz.initPage(this,{ title:'后台-约课管理'}); this.setData({ isAdmin: AdminBiz.isAdmin() }); },
	async seedDemo(){ await cloudHelper.callCloudSumbit('admin/lesson_demo_seed',{}, {title:'生成中'}).then(res=>{ wx.showToast({ title:'生成成功', icon:'success' }); }); },
	nav(e){ wx.navigateTo({ url: e.currentTarget.dataset.url }); }
});