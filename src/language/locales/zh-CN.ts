export default {
  nowLocale: "简体中文(中国)",
  lauguage: "语言",
  switchLanguage: "切换语言",

  welcomeToUTrader: "欢迎使用UTrader",

  goHome: "回首页",

  company: "公司",
  aboutUs: "关于我们",
  feedback: "意见反馈",
  upload: "上传",
  clearCache: "清除缓存",

  shortcutkey: "快捷键",

  lightTheme: "亮色主题",
  QuickTransactions: "快捷交易",
  updownColor: "涨跌颜色",
  upRedDownGreen: "红涨绿跌",
  upGreenDownRed: "绿涨红跌",
  createChart: "增加图表",

  chartList: "图表列表",
  symbolList: "商品列表",
  orderList: "订单列表",

  refresh: "刷新",
  error: "错误",
  cancel: "取消",
  reLogin: "重新登陆",
  personalInformation: "个人信息",
  loginSucceeded: "登录成功",
  changePassword: "更改密码",
  addAccount: "添加账号",
  logOut: "退出登录",

  ok: "确认",
  back: "返回",
  done: "完成",
  delete: "删除",
  modify: "修改",
  submit: "提交",
  close: "关闭",

  noAccount: "已有交易账号，可直接登录，如没有，可开设模拟账号",
  logAccount: "登录您的账号",
  manageAccount: "管理账号",
  brokerName: "经纪商名称",
  nodeName: "线路名称",
  loginId: "登录id",
  ip: "服务器",
  connectedNode: "已连接节点",
  myFeedback: "我的反馈",
  retract: "收起",
  expandReply: "展开回复",
  platformReply: "平台答复",
  and: "和",
  leftBook: "《",
  rightBook: "》",
  marketDepth: "市场深度",
  symbolInfo: "商品信息",
  transactionTime: "交易时间",
  nowTime: "当前时间",
  symbolListArea: "活跃交易商品面板",
  orderArea: "交易看板",
  klineArea: "商品K线面板",
  topUp: "置顶",
  unTop: "取消置顶",

  article: {
    readAgree: "请阅读并同意",
    accountClause: "开户条款",
    dataPolicy: "UTrader数据保护政策",
    loginsee: "登录视为您已阅读并同意",
    userAgreement: "用户协议",
    privacyPolicy: "隐私政策",
  },

  layout: {
    single: "单图模式",
    multiple: "多图模式",
    column: "横向布局",
    row: "纵向布局",
  },

  account: {
    accountNum: "账号",
    password: "密码",
    copy: "复制",
    rememberMe: "记住密码",
    login: "登录",
    logout: "登出",
    submit: "提交",
    forgetPassword: "忘记密码？",
    noAccount: "没有账号？",
    createAccount: "创建模拟账号",
    registerAccount: "注册账号",
    register: "创建模拟账号",
    verificationCode: "验证码",
    getCode: "获取验证码",
    resetPassword: "重置密码",
    retrievePassword: "找回密码",
    registerSucceed: "模拟账号创建成功",
    startUse: "开始使用模拟账号",
    email: "邮箱",
    newPassword: "新密码",
    oldPassword: "旧密码",
    nowPassword: "当前密码",
    notLoggedIn: "未登录",
    logIn: "去登录",
    prohibitTrading: "当前账户禁止交易",
    noAuthority: "无权限",
  },

  axios: {
    "Send request": "发送请求",
  },

  chart: {
    name: "图表",
    darkTheme: "暗色",
    lightTheme: "亮色",
    ThemeColor: "主题颜色",
    new: "新图表",
  },

  order: {
    loss: "亏损",
    symbol: "商品",
    sellPrice: "卖出价",
    buyPrice: "买入价",
    new: "{type}新订单",
    create: "创建",
    point: "点",
    price: "价位",
    balance: "结余",
    equity: "净值",
    profit: "盈利",
    Margin: "预付款",
    marginFree: "可用预付款",
    marginLevel: "预付款比例",
    referencePrepayment: "参考预付款",
    TotalProfit: "持仓盈亏",
    buy: "买入",
    sell: "卖出",
    type: {
      price: "市价单",
      limit: "限价单",
      stop: "止损单",
      stopLimit: "止损限价单",
    },
    tradingRoute: "交易线路",
    queryNode: "交易节点",
    diurnalVariation: "日%",
    time: "时间",

    manual: "手动",
    tp: "止盈",
    sl: "止损",
    forcedLiquidation: "强平(预付款不足)",
    reverseBuilding: "反向建仓",
    positionClosedSuccessfully: "平仓成功",
    confirmPositionClosure: "确定平仓",
    confirmPendingClosure: "确定撤销",
    pendingOrderClosed: "撤销挂单",
    pendingOrderClosedSuccessfully: "撤销挂单成功",
    spread: "点差",
    expectedGrossProfit: "预计毛利",
    term: "期限",
  },

  symbolDetail: {
    symbol: "商品名称",
    path: "商品分类",
    digits: "小数位",
    contract_size: "合约数量",
    leverage: "杠杆",
    prepaidMode: "预付款模式",
    margin: "预付款",
    volume_min: "最小交易量",
    volume_max: "最大交易量",
    volume_step: "交易量步长",
    stops_level: "价格距离",
    buy_rate: "买入库存费率",
    sell_rate: "卖出库存费率",
    settlement_type: "库存费结算模式",
    fee: "手续费",
  },

  prepaidMode: {
    fixed: "固定值",
    dynamic: "固定杠杆",
  },
  settlementType: {
    closed: "休市结算",
    hours: "满24小时结算",
  },

  tip: {
    usernameRequired: "请输入账号",
    passwordRequired: "请输入密码",
    emailRequired: "请输入邮箱",
    serverRequired: "请选择交易节点",
    codeRequired: "请输入验证码",
    loginRequired: "请输入账号",
    termRequired: "请选择期限",
    volumeRequired: "请输入手数",
    noLessNowTime: "时间不能小于当前时间",
    needLogin: "请登录",
    succeed: "{type}成功",
    failed: "{type}失败",
    confirm: "确认{type}",
    ifHasAcount: "已有交易账号，可直接登录，如没有，可开模拟账号",
    passwordFormatRule: "需由6-24位数字和字母组合",
    keepPasswordSave: "请妥善保存好您的帐户和密码",
    reInputPassword: "请再次输入密码",
    noSamePassword: "两个密码不一致",
    resetPwdSuccess: "重置密码成功",
    feedbackPlac: "有反馈就会有结果…",
    networkNodeNotFound: "找不到网络节点",
    searchSymbol: "搜索交易商品",
    copySucceed: "复制成功",
    copyFail: "复制失败",
    enterNewPwd: "输入新密码",
    enterOldPwd: "输入旧密码",
    confirmNewPwd: "确认新密码",
    retakeCode: "{time}秒后可重新获取",
    confirmDelPendingOrders: "您将撤销以下选定的{num}个挂单，您想要继续吗？",
    minFastPoint: "至少远离市价{size}点",
    need: "需",
    upLoadFileError: "文件上传出错",
    noData: "暂无数据",
    addMySymbol: "可通过上方搜索框添加自选商品",
    reversePosition: "确定关闭当前持仓并同时以相反方向开立同等大小心头寸吗？",
    noSimuServer: "找不到官方模拟服务器",
    addMyOption: "添加自选",
    required: "{label}不能为空",
    imageOnly: "仅支持图片上传",
    limitImageSize: "图片不得大于{size}",
    NodeUnavailable: "节点不可用",
    symbolNoAllowTrading: "当前商品禁止交易",
    agreeTermsFirst: "请先勾选同意条款",
    marketClosed: "市场关闭",
  },

  time: {
    thisWeek: "本周",
    thisMonth: "本月",
    thisYear: "今年",
  },

  font: {
    fontSize: "字号",
    small: "小号",
    medium: "中号",
    large: "大号",
    default: "中号",
  },

  resolute: {
    "1 days": "日线",
    "1 weeks": "周线",
    "1 months": "月线",
    "1 hours": "1小时",
    "4 hours": "4小时",
    "1 minutes": "1分",
    "5 minutes": "5分",
    "15 minutes": "15分",
    "30 minutes": "30分",
  },

  table: {
    id: "订单ID",
    closeOrderId: "平仓ID",
    symbol: "交易商品",
    direction: "方向",
    openingTime: "建仓时间",
    pendingAddTime: "挂单时间",
    volume: "手数",
    tp: "止盈",
    sl: "止损",
    admission: "入场价",
    currentPrice: "当前价",
    storage: "过夜费",
    fee: "手续费",
    holdingDays: "持仓天数",
    comment: "备注",
    profit: "盈亏",
    orderType: "订单类型",
    orderPrice: "挂单价格",
    expirationDate: "到期时间",
    closingTime: "关闭时间",
    exitPrice: "平仓价",
    closeType: "平仓类型",
    time: "时间",
    blance: "金额",
    blanceType: "交易类型",
    orderActivationTime: "挂单时间",
    createStartTime: "创建开始时间",
    createEndTime: "创建结束时间",
    createTime: "创建时间",
    positionOpeningStartTime: "建仓开始时间",
    positionOpeningEndTime: "建仓结束时间",
    positionOpeningTime: "建仓时间",
    positionClosingStartTime: "平仓开始时间",
    positionClosingEndTime: "平仓结束时间",
    positionClosingTime: "平仓时间",
    startTime: "开始时间",
    endTime: "结束时间",
    deposit: "入金",
    withdrawal: "出金",
    batchClose: "批量平仓",
    allPositionsClose: "所有持仓平仓",
    closeAllLongPositions: "所有多单平仓",
    closeAllShortPositions: "所有空单平仓",
    closeProfitablePositions: "盈利持仓平仓",
    closeLosingPositions: "亏损持仓平仓",
    cancelAllOrders: "全部撤单",
    closePosition: "平仓",
    cancelOrder: "撤销",
    netDeposit: "净入金",
    totalDeposit: "累计入金",
    totalWithdrawal: "累计出金",
    Total: "合计",
    lot: "手",
    transactions_deposit: "笔",
    transactions_withdrawal: "笔",
    marketOrder: "持仓",
    pendingOrder: "挂单",
    marketOrderHistory: "历史",
    pendingOrderHistory: "失效",
    blanceRecord: "出入金记录",
    log: "日志",
    date: "日期",
    content: "内容",
    days: "{num}天",
    origin: "来源",
    logType: "类型",
    logName: "类型名称",
  },

  dialog: {
    createOrder: "下单",
    marketOrder: "市价单",
    type: "类型",
    orderType: "订单类型",
    breakPrice: "突破价",
    limitedPrice: "限价",
    confirmBelow: "请在下方确认您的下单信息",
    back: "返回",
    createOrderSucceed: "{type}{volume}手{symbol}的订单已提交。",
    orderPrice: "下单价",
    closeVolume: "平仓量",
    reversePosition: "反向持仓",
    doublePosition: "双倍持仓",
    closeByPrice: "按市价平仓",
    closePosition: "平仓",
    confirmDouble: "确定对当前持仓加倍吗",
    order: "订单",
    tradingVolume: "交易量",
    positionClosedSuccessfully: "仓位关闭成功",
    positionClosingFailed: "仓位关闭失败",
    orderClose: "{volume}手{symbol}的订单已关闭",
    pendingClosingSuccessfully: "删除挂单成功",
    upLoadFileExceed: "最多上传{num}张图片",
  },

  "refresh page": "刷新页面",
  "network error": "网络错误",
  "invalid token": "登录过期",
  "invalid login": "无效的账户",
  "invalid server": "无效的服务商",
  "system database error": "系统数据库异常",
  "system busy": "系统繁忙",
  "cannot contain spaces": "不能含有空格",
  "invalid password": "无效的密码",
  "less than 6 characters": "少于6个字符",
  "more than 24 characters": "超过24个字符",
  "missing numbers": "缺少数字",
  "missing letters": "缺少字母",
  "system redis error": "系统缓存异常",
  "unknow error": "未知错误",
  "too many errors": "错误次数过多，请10分钟后再试",
  "invalid login sign": "无效的账户签名",
  "invalid action": "无效的操作",
  "invalid logins": "无效的账户组",
  "invalid login format": "无效的账户格式",
  "login exists xxx": "存在xxx账户",
  "invalid admin": "无效的管理员",
  "invalid permission": "无效的权限",
  "invalid group": "无效的组别",
  "invalid login status": "无效的状态",
  "invalid trade_rights": "无效的交易权限",
  "invalid first_name": "无效的名",
  "invalid last_name": "无效的姓",
  "invalid mid_name": "无效的中间名",
  "invalid total_name": "无效的全名",
  "invalid country": "无效的国家/地区",
  "invalid language": "无效的语言",
  "invalid city": "无效的城市",
  "invalid state": "无效的邦",
  "invalid zip_code": "无效的邮政编码",
  "invalid phone_region": "无效的区号",
  "invalid phone": "无效的手机号码",
  "invalid email": "无效的邮箱",
  "invalid permissions": "无效的权限组",
  "invalid profit": "无效的金额",
  "invalid type": "无效的类型",
  "invalid volume": "无效的手数",
  "invalid symbol": "无效的商品",
  "market closed": "市场关闭",
  "insufficient margin": "保证金不足",
  "invalid order id": "无效的订单号",
  "invalid sl tp": "无效的止盈止损",
  "invalid trigger_price": "无效的触发价格",
  "invalid order_price": "无效的挂单价格",
  "invalid trigger price": "无效的触发价格",
  "invalid order price": "无效的挂单价格",
  "invalid time_expiration": "无效的过期时间",
  "order price valid": "挂单价格已生效",
  "invalid limit ctm": "无效的限制时间",
  "invalid count": "无效的数目",
  "invalid symbols_ttimes": "无效的商品交易时间",
  "invalid week_day": "无效的星期",
  "invalid btime": "无效的开始时间",
  "invalid etime": "无效的结束时间",
  "invalid date_time": "无效的时间日期",
  "invalid groups": "无效的组别",
  "invalid status": "无效的状态",
  "invalid orders_limit": "无效的限制订单",
  "invalid safe_margin_level": "无效的保证金水平",
  "invalid symbols_limit": "无效的商品限制",
  "invalid description": "无效的描述",
  "invalid volume_min": "无效的最小手数",
  "invalid volume_step": "无效的手数步长",
  "invalid volume_max": "无效的最大手数",
  "invalid volume_max_total": "无效的手数总数",
  "invalid contract_size": "无效的订单合约数量",
  "invalid margin": "无效的保证金",
  "invalid leverage": "无效的杠杆倍数",
  "invalid utrader_trade_allow": "无效的开发交易许可",
  "execute failed": "执行失败",
  "execute timeout": "执行超时",
};
