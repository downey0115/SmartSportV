/**
 * Notes: 支付服务骨架（未接入微信支付，仅占位）
 */

class PayService {
  // 根据 tradeNo/金额等生成支付参数；当前未接入，返回占位标记
  async createPay({ tradeNo, totalFee, body, openid }) {
    return {
      needConfig: true,
      msg: '当前未接入微信支付，请完成商户配置后再试',
      payment: null,
      tradeNo,
    };
  }

  // 查询并纠正支付结果；未接入时恒为未支付
  async fixPayResult(tradeNo) {
    return false;
  }

  // 关闭支付单（占位）
  async closePay(tradeNo) {
    return true;
  }

  // 退款（占位）
  async refundPay(tradeNo, reason = '') {
    return { ok: true, tradeNo, reason };
  }
}

module.exports = PayService;
