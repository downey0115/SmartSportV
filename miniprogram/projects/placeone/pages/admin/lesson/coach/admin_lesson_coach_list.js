const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const AdminBiz = require('../../../../biz/admin_biz.js');
const ProjectBiz = require('../../../../biz/project_biz.js');

Page({
	data:{ isAdmin:false, isLoad:true, sortMenus:[], sortItems:[] },
	onLoad(){ ProjectBiz.initPage(this,{ title:'后台-教练管理'}); this.setData({ isAdmin: AdminBiz.isAdmin(), isLoad:true }); },
	async seedDemo(){ await cloudHelper.callCloudSumbit('admin/lesson_demo_seed',{}, {title:'生成中'}).then(res=>{ wx.showToast({ title:'生成成功', icon:'success' }); }); }
});