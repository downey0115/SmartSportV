const BaseProjectModel = require('./base_project_model.js');

class CoachModel extends BaseProjectModel {}

CoachModel.CL = BaseProjectModel.C('coach');

CoachModel.DB_STRUCTURE = {
	_pid: 'string|true',
	COACH_ID: 'string|true',
	COACH_NAME: 'string|true',
	COACH_AVATAR: 'string|false',
	COACH_TAGS: 'array|true|default=[]',
	COACH_STATUS: 'int|true|default=1',
	COACH_ADD_TIME: 'int|true',
	COACH_EDIT_TIME: 'int|true'
};

CoachModel.FIELD_PREFIX = 'COACH_';

CoachModel.STATUS = { UNUSE: 0, COMM: 1 };

module.exports = CoachModel;