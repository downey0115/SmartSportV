const BaseProjectAdminController = require('./base_project_admin_controller.js');
const AdminLessonService = require('../../service/admin/admin_lesson_service.js');

class AdminLessonController extends BaseProjectAdminController {
	async coachList(){ await this.isAdmin(); const s=new AdminLessonService(); return await s.coachList(); }
	async coachInsert(){ await this.isAdmin(); let input=this.validateData({ name:'must|string', avatar:'string', tags:'array' }); const s=new AdminLessonService(); return await s.coachInsert(input); }
	async coachEdit(){ await this.isAdmin(); let input=this.validateData({ id:'must|id', name:'string', avatar:'string', tags:'array', status:'int' }); const s=new AdminLessonService(); await s.coachEdit(input.id, input); }
	async courseList(){ await this.isAdmin(); const s=new AdminLessonService(); return await s.courseList(); }
	async courseInsert(){ await this.isAdmin(); let input=this.validateData({ name:'must|string', duration:'int', capacity:'int', price:'int' }); const s=new AdminLessonService(); return await s.courseInsert(input); }
	async courseEdit(){ await this.isAdmin(); let input=this.validateData({ id:'must|id', name:'string', duration:'int', capacity:'int', price:'int', status:'int' }); const s=new AdminLessonService(); await s.courseEdit(input.id, input); }
	async scheduleUpsert(){ await this.isAdmin(); let input=this.validateData({ date:'must|string', coachId:'must|string', courseId:'must|string', venueId:'must|id', slots:'must|array' }); const s=new AdminLessonService(); return await s.scheduleUpsert(input); }
	async scheduleList(){ await this.isAdmin(); let input=this.validateData({ date:'string', coachId:'string', courseId:'string', venueId:'id' }); const s=new AdminLessonService(); return await s.scheduleList(input); }
	async orderList(){ await this.isAdmin(); let input=this.validateData({ page:'int', size:'int' }); const s=new AdminLessonService(); return await s.orderList(input); }
	async orderExport(){ await this.isAdmin(); const s=new AdminLessonService(); return await s.orderExport(); }
	async demoSeed(){ await this.isAdmin(); const s=new AdminLessonService(); return await s.demoSeedSchedules(); }
}

module.exports = AdminLessonController;