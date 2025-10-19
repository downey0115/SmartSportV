const BaseProjectController = require('./base_project_controller.js');
const LessonService = require('../service/lesson_service.js');

class LessonController extends BaseProjectController {
	async getTeachers() { const s = new LessonService(); return await s.getTeachers(); }
	async getCourses() { const s = new LessonService(); return await s.getCourses(); }
	async getVenues() {
		let rules = { coachId: 'string', courseId: 'string', date: 'string' };
		let input = this.validateData(rules);
		const s = new LessonService();
		return await s.getVenues(input);
	}
	async getSessions() {
		let rules = { coachId: 'must|string', courseId: 'must|string', venueId: 'must|id', date: 'must|string' };
		let input = this.validateData(rules);
		const s = new LessonService();
		return await s.getSessions(input);
	}
	async orderCreate() {
		let rules = { coachId: 'must|string', courseId: 'must|string', venueId: 'must|id', date: 'must|string', start: 'must|string', end: 'must|string', endPoint: 'must|string', fee: 'must|number', forms: 'array' };
		let input = this.validateData(rules);
		const s = new LessonService();
		return await s.orderCreate(this._userId, input);
	}
	async myList() {
		let rules = { page: 'int', size: 'int' };
		let input = this.validateData(rules);
		const s = new LessonService();
		return await s.getMyList(this._userId, input);
	}
	async myDetail() {
		let rules = { id: 'must|id' };
		let input = this.validateData(rules);
		const s = new LessonService();
		return await s.getMyDetail(this._userId, input.id);
	}
}

module.exports = LessonController;