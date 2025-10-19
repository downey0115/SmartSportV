const BaseProjectModel = require('./base_project_model.js');

class CourseModel extends BaseProjectModel {}

CourseModel.CL = BaseProjectModel.C('course');

CourseModel.DB_STRUCTURE = {
	_pid: 'string|true',
	COURSE_ID: 'string|true',
	COURSE_NAME: 'string|true',
	COURSE_DURATION: 'int|true|default=60',
	COURSE_CAPACITY: 'int|true|default=1',
	COURSE_PRICE: 'int|true|default=0',
	COURSE_STATUS: 'int|true|default=1',
	COURSE_ADD_TIME: 'int|true',
	COURSE_EDIT_TIME: 'int|true'
};

CourseModel.FIELD_PREFIX = 'COURSE_';

CourseModel.STATUS = { UNUSE: 0, COMM: 1 };

module.exports = CourseModel;