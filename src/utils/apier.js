import CattleBridge from 'cattle-bridge';
import axios from 'axios';
import loginInfo from '@/utils/loginInfoStorage.js';
import _ from 'lodash';

const mockedPageInfo = { totalPage: 1, totalRecord: 1 };

// 将 Object 的键名做映射
const objectMapper = (keyMap) => {
  if(!Array.isArray(keyMap)) {
    throw new Error('keyMap is expected to be an array');
  }
  return (source, reverse = false) => {
    let target = {};
    if(!source || typeof source !== 'object') {
      return {};
    }
    keyMap.forEach(m => {
      let [ fromKey, toKey ] =
        m[1] !== undefined
          ? reverse ? [m[1], m[0]] : [m[0], m[1]]
          : [m[0], m[0]];
      let rawValue = source[fromKey];
      if(rawValue !== undefined) {
        let fn = reverse ? m[3] : m[2];
        target[toKey] = (fn && fn.call) ? fn(rawValue) : rawValue;
      } else if(m[3] !== undefined) {
        target[toKey] = m[3];
      }
    });
    return target;
  };
};

const genderMap = {
  0: 'male',
  1: 'female',
  male: 0,
  female: 1,
};

// 转换时间字符串为 YYYY/MM/DD 的格式（后台 API 的要求）
const processTimeString = raw => String(raw).replace(/-/g, '/');

// Covert query string
// const covertQueryString = obj => {
// return Object.keys(obj).map(k => k + '=' + obj[k]).join('&');
// };

// 处理分页信息
const processPagination = raw => ({
  pageNumber: raw.pageNumber,
  pageSize: raw.pageSize,
});
const processPageInfo = raw => ({
  totalPage: raw.total_page,
  totalRecord: raw.total_record,
});

// 对 URL 做过滤，防 XSS
const downloadUrlFilter = raw => {
  if(typeof raw !== String) return raw;
  if(/^((http|ftp|ftps|https):\/\/|\/\/|\/)/.test(raw)){
    return raw;
    // [TODO] 同源策略
    // try {
    //   let url = new URL(raw);
    //   if(url.domain === window.location.domain) {
    //     return raw;
    //   }
    // } catch() {
    //   return false;
    // }
  }
  return false;
};

// 下面都是一些具体的键名的映射
const operatorItemMapper = objectMapper([
  ['operatorId', 'operator_id'],
  ['num', 'index'],
  ['name', 'name'],
  ['createdTime', 'created_time'],
  ['tel', 'tel'],
  ['password', 'password'],
  ['frozen', 'frozen', v => v-1, v => [2,1][v]],
]);

const organizationItemMapper = objectMapper([
  ['orgId', 'org_id'],
  ['address', 'address'],
  ['gender', 'gender', v => genderMap[v], v => genderMap[v]],
  ['idcard', 'idcard'],
  ['organization'],
  ['num', 'index'],
  ['name', 'name'],
  ['createdTime', 'created_time'],
  ['tel', 'tel'],
  ['password', 'password'],
  ['belong', 'belong'],
  ['email', 'email'],
  ['taskNumber', 'taskNumber'],
  ['frozen', 'frozen', v => v-1, v => [2,1][v]],
]);

const orderStateMap = {
  // 0: 'receiving',
  0: 'confirming',
  1: 'delivering',
  2: 'finished',
  // receiving: 'receiving',
  // processing: 'processing',
  // confirming: 'confirming',
  // finished: 'finished',
  // progressing: 'progressing',
};

const orderItemMapper = objectMapper([
  ['orderId', 'id'],
  ['num', 'id'], // [TODO]
  ['client', 'buyer_name'],
  ['clientTel', 'buyer_contact'],
  ['clientAddress', 'address'],
  ['createdTime', 'time'], // [TODO] Down
  ['orderState', 'status', v => orderStateMap[v], v => orderStateMap[v]],
]);

const taskOperationMapper = objectMapper([
  ['allowOperatorConfirm', 'allowOperatorConfirm', Boolean],
  ['confirmedBy', 'confirmedBy', v => identMap[v], v => identMap[v]],
  ['confirmingTime', 'confirmingTime', Number, Number],
  ['downloadingAttachmentTime', 'downloadingAttachmentTime', Number, Number],
  ['uploadingReportTime', 'uploadingReportTime', Number, Number],
  ['receivingTime', 'receivingTime', Number, Number],
  ['taskAttachmentUrl', 'taskAttachmentUrl', downloadUrlFilter, downloadUrlFilter],
  ['taskReportUrl', 'taskReportUrl', downloadUrlFilter, downloadUrlFilter],
]);

const identMap = {
  0: 'administrator',
  1: 'operator',
  2: 'organization',
};

// API状态码和对应的友好的提示消息
const statusMsgMap = {
  // 登录 @
  login: {
    201: '没有密码或者用户名',
    202: '账号不存在',
    203: '密码错误',
    204: '账号被冻结',
  },
  // 登出
  logout: {
  },
  // 修改密码
  modifyPassword: {
    201: '没有找到该用户',
    202: '需要原始密码或者新密码的值',
    203: '原始密码错误',
  },
  // 添加任务
  addItem: {
    202: '没有权限，必须是机构账户才行',
    203: '参数错误，检查一下传入的参数字段',
  },
  // 添加机构账号
  addOrganization: {
    202: '没有权限',
    203: '参数错误',
    204: '账户已存在，电话应该唯一',
  },
  // 添加操作员
  addOperator: {
    202: '没有权限',
    203: '参数错误',
    204: '账户已存在，电话应该唯一',
  },
  // 操作员列表
  listOperators: {
    202: '没有权限', // 必须是超管账号才行
    203: '参数错误', // pageSize和pageNumber是否传入以及是否大于零
  },
  // 冻结解冻操作员
  freezeOperator: {
    202: '没有权限',
    203: '参数错误', // 检查传入字段是否正确
    204: '找不到对应的账号',
  },
  // 列出所有机构账户
  listOrganizations: {
    202: '没有权限',
    203: '参数错误', // pageSize和pageNumber是否传入以及是否大于零
  },
  // 冻结解冻机构账户
  freezeOrganization: {
    202: '没有权限',
    203: '参数错误', // 检查传入字段是否正确
    204: '找不到对应的账号',
  },
  // 任务列表
  listTasks: {
    203: '参数错误',
  },
  // 获取任务详情
  taskDetail: {
    202: '该任务不存在',
  },
  // 领取任务
  receiveTask: {
    202: '没有权限',
    203: '该任务不存在',
    204: '没有此操作',
  },
  // 上传报告文件
  uploadTaskReport: {
    202: '没有权限',
    203: '该任务不存在',
    204: '没有此操作',
  },
  // 确认任务 @
  confirmTask: {
    202: '没有权限',
    203: '该任务不存在',
    204: '没有此操作',
  },
  common: {
    301: '尚未登录，请重新登录后重试',
    302: '登录过期，请重新登录后重试',
    303: '请尝试重新登录',
    200: '成功',
  },
};

const API_SERVER_URL = '/api';

const filters = {
  // 登录 $
  login: {
    name: 'login',
    method: 'POST',
    url: API_SERVER_URL + '/manager/login',
    chop: inp => ({
      username: inp.username,
      password: inp.password,
    }),
    trim: rep => ({
      token: rep.token || 'MOCKED_TOKEN',
      ident: rep.data ? identMap[rep.ident] : 'unknown',
      expireTime: +rep.expire_time || 36000000,
    }),
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        resolve({
          stat: 0,
          data: {
            token: 'TEST_TOKEN',
            ident: input.username,
            name: input.username,
            expireTime: (Date.now() * 2),
          },
        });
      }, 1800);
    },
  },
  // 登出 $
  logout: {
    name: 'logout',
    method: 'POST',
    url: API_SERVER_URL + '/logout',
    handler: (resolve) =>  resolve({ stat: 0, data: {} }),
  },
  // 修改密码 $
  modifyPassword: {
    name: 'modifyPassword',
    method: 'POST',
    url: API_SERVER_URL + '/manager/modifyPassword',
    chop: inp => ({
      username: inp.username,
      old_password: inp.prevPwd,
      new_password: inp.newPwd,
    }),
  },

  // 添加编辑图书 $
  addGood: {
    name: 'addGood',
    method: 'POST',
    url: inp => API_SERVER_URL + '/book/' + (inp.goodId === undefined ? 'add' : 'edit'),
    chop: inp => {
      const fd = new FormData();
      inp.goodId !== undefined && fd.append('book_id', inp.goodId),
      fd.append('name', inp.name);
      fd.append('price', inp.price);
      fd.append('type', inp.type);
      fd.append('introduce', inp.description);
      fd.append('sort_type', inp.tags.basic[0] || 0);
      fd.append('grade', inp.tags.grade[0] || 0);
      fd.append('college', inp.tags.college[0] || 0);
      // 图片是可选项
      inp.image && fd.append('img_file', inp.image);
      return fd;
    },
  },

  // 删除图书 $
  deleteGood: {
    name: 'deleteGood',
    method: 'POST',
    url: API_SERVER_URL + '/book/delete',
    chop: rep => ({ book_id: rep.goodId }),
  },

  // 图书列表 $
  listGoods: {
    name: 'listGoods',
    method: 'POST',
    url: API_SERVER_URL + '/book/listForManager',
    trim: rep => {
      console.log(rep);
      return {
        pageInfo: mockedPageInfo,
        list: Array.isArray(rep)
          ? rep.map(item => ({
              goodId: item.id,
              num: item.id,
              name: item.name,
              createdTime: item.created_time,
              price: item.price,
              type: item.type,
              state: item.status,
            }))
          : [],
      };
    },
  },

  // 图书详情 $
  goodDetail: {
    name: 'goodDetail',
    method: 'POST',
    url: API_SERVER_URL + '/book/detail',
    chop: inp => ({ id: inp.goodId }),
    trim: rep => ({
      goodId: undefined, // [TODO]
      name: rep.name,
      price: rep.price,
      description: rep.introduce,
      type: rep.type,
      state: rep.status,
      tags: {
        basic: rep.sort_type,
        college: rep.college,
        grade: rep.grade,
      },
      imgUrl: rep.img_url,
    }),
  },

  // 修改图书状态
  changeGoodState: {
    name: 'changeGoodState',
    method: 'POST',
    url: API_SERVER_URL + '/book/operate',
    chop: inp => ({
      book_id: inp.goodId,
      type: inp.action,
    }),
  },

  // 订单列表 $
  listOrders: {
    name: 'listOrders',
    method: 'POST',
    url: API_SERVER_URL + '/order/list',
    trim: rep => ({
      pageInfo: mockedPageInfo, // rep.pageInfo,
      list: Array.isArray(rep) ? rep.map(item => orderItemMapper(item, true)) : [],
    }),
  },

  // 获取订单详情 $
  orderDetail: {
    name: 'orderDetail',
    method: 'POST',
    url: inp => API_SERVER_URL + `/order/detail`,
    chop: inp => ({ order_id: inp.orderId }),
    trim: rep => {
      return {
        orderId: rep.order_id,
        totalPrice: rep.price,
        clientComment: rep.message,
        orderState: ['confirming', 'delivering',][rep.status],
        goodList: Array.isArray(rep.book_list)
          ? rep.book_list.map(item => ({ name: item.name, number: item.num }))
          : [],
      };
    },
  },

  // 修改订单状态
  deliverOrder: {
    name: 'deliverOrder',
    method: 'POST',
    url: API_SERVER_URL + '/book/operate',
    chop: inp => ({
      order_id: inp.orderId,
      type: 1,
    }),
  },
  confirmOrder: {
    name: 'confirmOrder',
    method: 'POST',
    url: API_SERVER_URL + '/book/operate',
    chop: inp => ({
      order_id: inp.orderId,
      type: 0,
    }),
  },

  // 列出卖书订单
  listSellOrder: {
    name: 'listSellOrder',
    method: 'POST',
    url: API_SERVER_URL + '/intention/list',
    trim: rep => Array.isArray(rep)
      ? rep.map(item => ({
          sellOrderId: item.id,
          price: item.price, // [TODO]
          tel: item.contact,
          address: item.address,
          description: item.description,
          imgUrl: item.img_url,
          state: item.status,
        }))
      : [],
  },
  // 改变卖书订单状态
  changeSellOrderState: {
    name: 'changeSellOrderState',
    method: 'POST',
    url: API_SERVER_URL + '/intention/handle',
    chop: inp => ({
      intention_id: inp.sellOrderId,
      mode: [,1,2][inp.state],
    }),
  },
};

// 开发环境下向 filter 注入 handler
if(process.env.NODE_ENV == 'development') {
  // _.merge(filters, require('./apier-mock.js').default);
}

export default new CattleBridge({
  debug: (process.env.NODE_ENV === 'development'),
  filters,
  gtrim(rep) {
    if(!(rep && rep.code !== undefined)) {
      return {
        status: {},
        data: {},
      };
    }
    if(rep.pageInfo) {
      rep.pageInfo = processPageInfo(rep.pageInfo);
    }
    if(!rep.data) {
      rep.data = {};
    }
    return rep.data;
  },
  requester(options) {
    let info = loginInfo.retrieve();
    let customizedHeaders = {
      'Auth-Token': info.token
    };
    options.headers
    && Object.assign(customizedHeaders, options.headers);

    return axios({
      ...options,
      headers: customizedHeaders,
    });
  },
  stater(result, respData, respStat, filter) {
    if (respStat.status >= 300) {
      result(false);
      return {
        code: -1,
        msg: 'HTTP Error',
        frimsg: '网络或服务器错误',
      };
    } else if (!(respData && respData.code)) {
      result(false);
      return {
        code: -2,
        msg: 'invalid data',
        frimsg: '返回的数据是无效的',
      };
    } else {
      result(respData.code == 200); // 自动转换
      if([301, 302, 303].indexOf(respData.code) !== -1) {
        loginInfo.exit();
      }
      return {
        code: respData.code || 300,
        msg: respData.msg || 'Unknown Error',
        frimsg: _.get(statusMsgMap, `${filter.name}.${respData.code}`)
                || _.get(statusMsgMap, `common.${respData.code}`)
                || respData.msg
                || '未知错误',
      };
    }
  },
});


