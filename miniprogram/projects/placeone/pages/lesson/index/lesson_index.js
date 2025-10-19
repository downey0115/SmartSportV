const cloudHelper = require('../../../../../helper/cloud_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({
	data:{
		date:'',
		teachers:[],
		courses:[],
		venues:[],
		selCoachId:'',
		selCourseId:'',
		selVenueId:'',
		canGo:false
	},
	onLoad(){ ProjectBiz.initPage(this, { isSetNavColor: true, title: '约课' }); this.init(); },
	init: async function(){
		let date = new Date();
		let m = (date.getMonth()+1).toString().padStart(2,'0');
		let d = date.getDate().toString().padStart(2,'0');
		this.setData({ date: `${date.getFullYear()}-${m}-${d}`});
		let teachers = await cloudHelper.callCloudSumbit('lesson/teachers',{});
		let courses = await cloudHelper.callCloudSumbit('lesson/courses',{});
		this.setData({ teachers: teachers, courses: courses });
	},
	onDateChange(e){ this.setData({ date: e.detail }); this.refreshVenues(); },
	selCoach(e){ this.setData({ selCoachId: e.currentTarget.dataset.id }); this.refreshVenues(); },
	selCourse(e){ this.setData({ selCourseId: e.currentTarget.dataset.id }); this.refreshVenues(); },
	selVenue(e){ this.setData({ selVenueId: e.currentTarget.dataset.id, canGo: true }); },
	async refreshVenues(){
		this.setData({ venues: [], selVenueId:'', canGo:false });
		let { selCoachId, selCourseId, date } = this.data;
		if(!selCoachId || !selCourseId || !date) return;
		let venues = await cloudHelper.callCloudSumbit('lesson/venues',{ coachId: selCoachId, courseId: selCourseId, date });
		this.setData({ venues });
	},
	goSession(){
		let { selCoachId, selCourseId, selVenueId, date } = this.data;
		wx.navigateTo({ url: `/projects/placeone/pages/lesson/select_session/lesson_select_session?coachId=${selCoachId}&courseId=${selCourseId}&venueId=${selVenueId}&date=${date}` });
	}
});