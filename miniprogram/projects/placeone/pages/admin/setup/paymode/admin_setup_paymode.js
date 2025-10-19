const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');

Page({
  data: {
    isLoad: false,
    mode: 'free', // 'free' | 'real'
  },

  onLoad: async function () {
    if (!AdminBiz.isAdmin(this)) return;
    await this._loadMode();
  },

  onPullDownRefresh: async function () {
    await this._loadMode();
    wx.stopPullDownRefresh();
  },

  _loadMode: async function () {
    let opts = { title: '加载中' };
    try {
      let res = await cloudHelper.callCloudSumbit('home/setup_get', { key: 'SETUP_PAY_MODE' }, opts);
      let val = res && res.data ? res.data : 'free';
      if (val !== 'free' && val !== 'real') val = 'free';
      this.setData({ isLoad: true, mode: val });
    } catch (err) {
      console.error(err);
      this.setData({ isLoad: true });
    }
  },

  bindRadioChange: function (e) {
    const val = e.detail.value;
    this.setData({ mode: val });
  },

  bindSaveTap: async function () {
    if (!AdminBiz.isAdmin(this)) return;
    const val = this.data.mode;
    if (val !== 'free' && val !== 'real') return pageHelper.showNoneToast('取值非法');

    let opts = { title: '保存中' };
    try {
      await cloudHelper.callCloudSumbit('admin/setup_set', { key: 'SETUP_PAY_MODE', content: val }, opts);
      pageHelper.showSuccToast('修改成功');
    } catch (err) {
      console.error(err);
    }
  }
});