const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const AdminBiz = require('../../../../biz/admin_biz.js');
const ProjectBiz = require('../../../../biz/project_biz.js');
const pageHelper = require('../../../../helper/page_helper.js');

Page({
	data:{ isAdmin:false, isLoad:true, sortMenus:[], sortItems:[] },
	onLoad(){ ProjectBiz.initPage(this,{ title:'后台-约课订单'}); this.setData({ isAdmin: AdminBiz.isAdmin(), isLoad:true }); },
	async exportData(){ await cloudHelper.callCloudData('admin/lesson_order_export',{}, {title:'导出中'}).then(res=>{ pageHelper.showModal('导出成功('+res.total+'条)，请复制下载链接：\n'+res.url); }); }
});