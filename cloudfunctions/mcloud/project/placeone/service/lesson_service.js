const timeUtil = require('../../../framework/utils/time_util.js');
const dataUtil = require('../../../framework/utils/data_util.js');
const BaseProjectService = require('./base_project_service.js');
const CoachModel = require('../model/coach_model.js');
const CourseModel = require('../model/course_model.js');
const LessonScheduleModel = require('../model/lesson_schedule_model.js');
const LessonOrderModel = require('../model/lesson_order_model.js');
const EnrollModel = require('../model/enroll_model.js');
const EnrollJoinModel = require('../model/enroll_join_model.js');
const setupUtil = require('../../../framework/utils/setup/setup_util.js');

class LessonService extends BaseProjectService {
	async seedIfEmpty() {
		if (await CoachModel.count({}) === 0) {
			await CoachModel.insert({ COACH_NAME: '张教练', COACH_TAGS: ['私教','网球'], COACH_STATUS: 1, COACH_ADD_TIME: this._timestamp, COACH_EDIT_TIME: this._timestamp });
			await CoachModel.insert({ COACH_NAME: '李教练', COACH_TAGS: ['团体课','羽毛球'], COACH_STATUS: 1, COACH_ADD_TIME: this._timestamp, COACH_EDIT_TIME: this._timestamp });
		}
		if (await CourseModel.count({}) === 0) {
			await CourseModel.insert({ COURSE_NAME: '网球私教', COURSE_DURATION: 60, COURSE_CAPACITY: 1, COURSE_PRICE: 10000, COURSE_STATUS: 1, COURSE_ADD_TIME: this._timestamp, COURSE_EDIT_TIME: this._timestamp });
			await CourseModel.insert({ COURSE_NAME: '羽毛球团体课', COURSE_DURATION: 90, COURSE_CAPACITY: 6, COURSE_PRICE: 6000, COURSE_STATUS: 1, COURSE_ADD_TIME: this._timestamp, COURSE_EDIT_TIME: this._timestamp });
		}
	}

	async getTeachers() {
		await this.seedIfEmpty();
		return await CoachModel.getAll({ COACH_STATUS: 1 }, '*');
	}
	async getCourses() {
		await this.seedIfEmpty();
		return await CourseModel.getAll({ COURSE_STATUS: 1 }, '*');
	}
	async getVenues({ coachId, courseId, date }) {
		// 根据排班返回有课的场馆（复用 enroll 作为场馆）
		let where = { LESSON_SCHEDULE_STATUS: 1 };
		if (coachId) where.LESSON_SCHEDULE_COACH_ID = coachId;
		if (courseId) where.LESSON_SCHEDULE_COURSE_ID = courseId;
		if (date) where.LESSON_SCHEDULE_DATE = date;
		let list = await LessonScheduleModel.getAll(where, 'LESSON_SCHEDULE_VENUE_ID');
		let ids = [...new Set(list.map(v => v.LESSON_SCHEDULE_VENUE_ID))];
		let venues = [];
		for (let id of ids) {
			let v = await EnrollModel.getOne(id, 'ENROLL_TITLE');
			if (v) venues.push({ _id: id, ENROLL_TITLE: v.ENROLL_TITLE });
		}
		return venues;
	}
	async getSessions({ coachId, courseId, venueId, date }) {
		let where = { LESSON_SCHEDULE_STATUS: 1, LESSON_SCHEDULE_COACH_ID: coachId, LESSON_SCHEDULE_COURSE_ID: courseId, LESSON_SCHEDULE_VENUE_ID: venueId, LESSON_SCHEDULE_DATE: date };
		let row = await LessonScheduleModel.getOne(where, '*');
		let slots = (row && row.LESSON_SCHEDULE_SLOTS) || [];
		// 标记已占用
		let used = await LessonOrderModel.getAll({ LESSON_ORDER_VENUE_ID: venueId, LESSON_ORDER_DATE: date, LESSON_ORDER_STATUS: 1 }, 'LESSON_ORDER_START,LESSON_ORDER_END');
		let ret = slots.map(s => {
			let conflict = used.find(u => u.LESSON_ORDER_START === s.start && u.LESSON_ORDER_END === s.end);
			return Object.assign({}, s, { disabled: !!conflict });
		});
		return ret;
	}
	async orderCreate(userId, { coachId, courseId, venueId, date, start, end, endPoint, fee, forms }) {
		// 冲突校验（对比 lesson_order 与 enroll_join）
		let conflictLesson = await LessonOrderModel.getOne({ LESSON_ORDER_VENUE_ID: venueId, LESSON_ORDER_DATE: date, LESSON_ORDER_START: start, LESSON_ORDER_END: end, LESSON_ORDER_STATUS: 1 });
		if (conflictLesson) this.AppError('所选时段已被预约');
		let now = this._timestamp;
		let data = {
			LESSON_ORDER_USER_ID: userId,
			LESSON_ORDER_COACH_ID: coachId,
			LESSON_ORDER_COURSE_ID: courseId,
			LESSON_ORDER_VENUE_ID: venueId,
			LESSON_ORDER_DATE: date,
			LESSON_ORDER_START: start,
			LESSON_ORDER_END: end,
			LESSON_ORDER_END_POINT: endPoint,
			LESSON_ORDER_START_FULL: date + ' ' + start,
			LESSON_ORDER_END_FULL: date + ' ' + endPoint,
			LESSON_ORDER_FEE: Math.round(fee * 100),
			LESSON_ORDER_PAY_STATUS: 99,
			LESSON_ORDER_STATUS: 1,
			LESSON_ORDER_IS_CHECKIN: 0,
			LESSON_ORDER_CODE: dataUtil.genRandomIntString(15),
			LESSON_ORDER_OBJ: dataUtil.dbForms2Obj(forms || []),
			LESSON_ORDER_ADD_TIME: now,
			LESSON_ORDER_LAST_TIME: now,
		};
		let id = await LessonOrderModel.insert(data);
		return { id };
	}
	async getMyList(userId, { page=1, size=10 }) {
		let where = { LESSON_ORDER_USER_ID: userId };
		let orderBy = { LESSON_ORDER_ADD_TIME: 'desc' };
		return await LessonOrderModel.getList(where, '*', orderBy, page, size, true, 0);
	}
	async getMyDetail(userId, id) {
		return await LessonOrderModel.getOne({ _id: id, LESSON_ORDER_USER_ID: userId }, '*');
	}
}

module.exports = LessonService;