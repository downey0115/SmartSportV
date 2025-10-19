const BaseProjectModel = require('./base_project_model.js');

class LessonScheduleModel extends BaseProjectModel {}

LessonScheduleModel.CL = BaseProjectModel.C('lesson_schedule');

LessonScheduleModel.DB_STRUCTURE = {
	_pid: 'string|true',
	LESSON_SCHEDULE_ID: 'string|true',
	LESSON_SCHEDULE_DATE: 'string|true', // YYYY-MM-DD
	LESSON_SCHEDULE_COACH_ID: 'string|true',
	LESSON_SCHEDULE_COURSE_ID: 'string|true',
	LESSON_SCHEDULE_VENUE_ID: 'string|true', // 对应 enroll._id
	LESSON_SCHEDULE_SLOTS: 'array|true|default=[]', // [{start,end,endPoint,price}]
	LESSON_SCHEDULE_STATUS: 'int|true|default=1',
	LESSON_SCHEDULE_ADD_TIME: 'int|true',
	LESSON_SCHEDULE_EDIT_TIME: 'int|true'
};

LessonScheduleModel.FIELD_PREFIX = 'LESSON_SCHEDULE_';

LessonScheduleModel.STATUS = { UNUSE: 0, COMM: 1 };

module.exports = LessonScheduleModel;