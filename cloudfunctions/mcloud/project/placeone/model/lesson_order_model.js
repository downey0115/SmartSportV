const BaseProjectModel = require('./base_project_model.js');

class LessonOrderModel extends BaseProjectModel {}

LessonOrderModel.CL = BaseProjectModel.C('lesson_order');

LessonOrderModel.DB_STRUCTURE = {
	_pid: 'string|true',
	LESSON_ORDER_ID: 'string|true',
	LESSON_ORDER_USER_ID: 'string|true',
	LESSON_ORDER_COACH_ID: 'string|true',
	LESSON_ORDER_COURSE_ID: 'string|true',
	LESSON_ORDER_VENUE_ID: 'string|true',
	LESSON_ORDER_DATE: 'string|true',
	LESSON_ORDER_START: 'string|true',
	LESSON_ORDER_END: 'string|true',
	LESSON_ORDER_END_POINT: 'string|true',
	LESSON_ORDER_START_FULL: 'string|true',
	LESSON_ORDER_END_FULL: 'string|true',
	LESSON_ORDER_FEE: 'int|true|default=0',
	LESSON_ORDER_PAY_STATUS: 'int|true|default=99', // 99免支付/0未支付/1已支付
	LESSON_ORDER_STATUS: 'int|true|default=1', // 1成功/9用户取消/99系统取消
	LESSON_ORDER_IS_CHECKIN: 'int|true|default=0',
	LESSON_ORDER_CODE: 'string|true',
	LESSON_ORDER_OBJ: 'object|true|default={}',
	LESSON_ORDER_ADD_TIME: 'int|true',
	LESSON_ORDER_LAST_TIME: 'int|true'
};

LessonOrderModel.FIELD_PREFIX = 'LESSON_ORDER_';

LessonOrderModel.STATUS = { SUCC: 1, CANCEL: 9 };

module.exports = LessonOrderModel;