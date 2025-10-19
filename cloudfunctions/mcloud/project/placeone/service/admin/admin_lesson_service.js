const timeUtil = require('../../../../framework/utils/time_util.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const BaseProjectAdminService = require('./base_project_admin_service.js');
const CoachModel = require('../../model/coach_model.js');
const CourseModel = require('../../model/course_model.js');
const LessonScheduleModel = require('../../model/lesson_schedule_model.js');
const LessonOrderModel = require('../../model/lesson_order_model.js');
const EnrollModel = require('../../model/enroll_model.js');
const exportUtil = require('../../../../framework/utils/export_util.js');

class AdminLessonService extends BaseProjectAdminService {
	// 教练
	async coachList() { return await CoachModel.getList({}, '*', { COACH_ADD_TIME:'desc' }, 1, 200, true, 0); }
	async coachInsert({ name, avatar, tags }) {
		let now = this._timestamp;
		return { id: await CoachModel.insert({ COACH_NAME: name, COACH_AVATAR: avatar||'', COACH_TAGS: tags||[], COACH_STATUS:1, COACH_ADD_TIME: now, COACH_EDIT_TIME: now }) };
	}
	async coachEdit(id, { name, avatar, tags, status }) {
		await CoachModel.edit(id, { COACH_NAME: name, COACH_AVATAR: avatar||'', COACH_TAGS: tags||[], COACH_STATUS: Number(status||1), COACH_EDIT_TIME: this._timestamp });
	}
	// 课程
	async courseList() { return await CourseModel.getList({}, '*', { COURSE_ADD_TIME:'desc' }, 1, 200, true, 0); }
	async courseInsert({ name, duration, capacity, price }) {
		let now = this._timestamp;
		return { id: await CourseModel.insert({ COURSE_NAME: name, COURSE_DURATION: Number(duration||60), COURSE_CAPACITY: Number(capacity||1), COURSE_PRICE: Number(price||0), COURSE_STATUS:1, COURSE_ADD_TIME: now, COURSE_EDIT_TIME: now }) };
	}
	async courseEdit(id, { name, duration, capacity, price, status }) {
		await CourseModel.edit(id, { COURSE_NAME: name, COURSE_DURATION: Number(duration||60), COURSE_CAPACITY: Number(capacity||1), COURSE_PRICE: Number(price||0), COURSE_STATUS: Number(status||1), COURSE_EDIT_TIME: this._timestamp });
	}
	// 排班：按(日期+老师+课程+场馆)唯一，写入slots
	async scheduleUpsert({ date, coachId, courseId, venueId, slots }) {
		let where = { LESSON_SCHEDULE_DATE: date, LESSON_SCHEDULE_COACH_ID: coachId, LESSON_SCHEDULE_COURSE_ID: courseId, LESSON_SCHEDULE_VENUE_ID: venueId };
		let row = await LessonScheduleModel.getOne(where);
		let doc = { LESSON_SCHEDULE_DATE: date, LESSON_SCHEDULE_COACH_ID: coachId, LESSON_SCHEDULE_COURSE_ID: courseId, LESSON_SCHEDULE_VENUE_ID: venueId, LESSON_SCHEDULE_SLOTS: Array.isArray(slots)?slots:[], LESSON_SCHEDULE_STATUS:1, LESSON_SCHEDULE_EDIT_TIME: this._timestamp };
		if (row) { await LessonScheduleModel.edit(row._id, doc); return { id: row._id, upsert:true }; }
		else { doc.LESSON_SCHEDULE_ADD_TIME = this._timestamp; let id = await LessonScheduleModel.insert(doc); return { id, upsert:false } }
	}
	async scheduleList({ date, coachId, courseId, venueId }) {
		let where = {};
		if (date) where.LESSON_SCHEDULE_DATE = date;
		if (coachId) where.LESSON_SCHEDULE_COACH_ID = coachId;
		if (courseId) where.LESSON_SCHEDULE_COURSE_ID = courseId;
		if (venueId) where.LESSON_SCHEDULE_VENUE_ID = venueId;
		return await LessonScheduleModel.getList(where, '*', { LESSON_SCHEDULE_DATE:'asc' }, 1, 200, true, 0);
	}
	// 订单管理与导出
	async orderList({ page=1, size=50 }) {
		let orderBy = { LESSON_ORDER_ADD_TIME:'desc' };
		return await LessonOrderModel.getList({}, '*', orderBy, Number(page), Number(size), true, 0);
	}
	async orderExport() {
		let header = ['订单码','日期','开始','结束','费用(元)','状态'];
		let page=1,size=200,all=[]; let orderBy={ LESSON_ORDER_ADD_TIME:'desc' };
		while(true){
			let ret = await LessonOrderModel.getList({}, '*', orderBy, page, size, page===1, 0);
			let list = ret.list || []; if (page===1) var total = ret.total || 0; all = all.concat(list); if (list.length<size) break; page++;
		}
		let data=[header];
		for (let item of all){
			let feeY = (Number(item.LESSON_ORDER_FEE||0)/100).toFixed(2);
			let statusTxt = (item.LESSON_ORDER_STATUS==1)?'成功':(item.LESSON_ORDER_STATUS==9?'取消':String(item.LESSON_ORDER_STATUS));
			data.push([ item.LESSON_ORDER_CODE||'', item.LESSON_ORDER_DATE||'', item.LESSON_ORDER_START||'', item.LESSON_ORDER_END_POINT||'', feeY, statusTxt ]);
		}
		let title = '约课订单';
		let options = { '!cols': [{wch:18},{wch:12},{wch:8},{wch:8},{wch:10},{wch:10}] };
		return await exportUtil.exportDataExcel('EXPORT_LESSON_ORDER_DATA', title, all.length, data, options);
	}
	// 演示：生成未来7天排班（若存在coach/course/enroll）
	async demoSeedSchedules() {
		let enroll = await EnrollModel.getOne({}, '_id,ENROLL_TITLE'); if (!enroll) return { cnt:0 };
		let coach = await CoachModel.getOne({}, '_id'); let course = await CourseModel.getOne({}, '_id'); if (!coach || !course) return { cnt:0 };
		let cnt=0; let now=new Date();
		for(let i=0;i<7;i++){
			let d=new Date(now.getTime()+i*86400000); let m=(d.getMonth()+1).toString().padStart(2,'0'); let day=d.getDate().toString().padStart(2,'0'); let date=`${d.getFullYear()}-${m}-${day}`;
			let slots=[{start:'09:00',end:'10:00',endPoint:'10:00',price:6000},{start:'10:30',end:'11:30',endPoint:'11:30',price:6000},{start:'15:00',end:'16:00',endPoint:'16:00',price:6000}];
			await this.scheduleUpsert({ date, coachId: coach._id, courseId: course._id, venueId: enroll._id, slots }); cnt++;
		}
		return { cnt };
	}
}

module.exports = AdminLessonService;