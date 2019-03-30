import Mock from 'mockjs';

// mock data
const usefulMockData = {
  pageInfo: { totalPage: 100, totalRecord: 12694 },
  okStat: { code: 200, msg: 'OK' },
  failStat: { code: 400, frimsg: 'Some Errors Occured.' },
};

const filters = {
  // 登录 @
  login: {
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
  // 登出 @
  logout: {
    handler: (resolve, reject) => {
      setTimeout(() => {
        resolve({
          stat: 0,
          data: {},
        });
      }, 1800);
    },
  },
  // 修改密码 @
  modifyPassword: {
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        (input.prevPwd.length == 1 ? reject : resolve)({
          stat: { frimsg: '旧密码输入错误' },
          data: {},
        });
      }, 1000);
    },
  },
  // 添加任务 (这里的实现不优雅)
  addGood: {
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        (input.gender ? resolve : reject)({
          stat: { code: 23, frimsg: '这里是友好的错误信息' },
          data: null,
        });
      }, 600);
    },
  },
  // 商品列表 @
  listGoods: {
    handler: (resolve, reject, name, input) => {
      let mocked = Mock.mock({
        data: {
          pageInfo: usefulMockData.pageInfo,
          [`list|${input.pagination.pageSize}`]: [{
            'goodId|+1': 16,
            'num|+1': 16,
            'name': '@cname',
            'createdTime': '@date',
            'price': '138',
            'type|1': [2, 1],
            'state|1': [2, 1],
          }],
        },
        stat: usefulMockData.okStat,
      });
      setTimeout(() => resolve(mocked), 1230);
    }
  },
  goodDetail: {
    handler: (resolve, reject, name, input) => {
      let mocked = Mock.mock({
        data: {
          'goodId': 16,
          'name': '@cname',
          'price': 138.5,
          'description': 'hello~',
          'type': 2,
          'state': 1,
          'tags': { basic: [], college: [], grade: [1] },
          'imgUrl': 'https://cn.bing.com/th?id=OJ.hhcqaPAuQWj60w&pid=MSNJVFeeds',
        },
        stat: usefulMockData.okStat,
      });
      setTimeout(() => resolve(mocked), 230);
    },
  },
  // 修改商品状态 @
  changeGoodState: {
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        if(input.goodId % 2) {
          resolve({stat: usefulMockData.okStat});
        } else {
          reject({stat: usefulMockData.failStat});
        }
      }, 2230);
    },
  },
  // 删除商品 @
  deleteGood: {
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        if(input.goodId % 2) {
          resolve({stat: usefulMockData.okStat});
        } else {
          reject({stat: usefulMockData.failStat});
        }
      }, 230);
    },
  },
  // 订单列表
  listOrders: {
    handler: (resolve, reject, name, input) => {
      let mocked = Mock.mock({
        data: {
          pageInfo: usefulMockData.pageInfo,
          [`list|${input.pagination.pageSize}`]: [{
            'orderId|+1': input.pagination.pageNumber * 100,
            'num|+1': input.pagination.pageNumber * 100,
            'client': '@cname',
            'clientTel': '13876543456',
            'clientAddress': '华科',
            'createdTime': '@date',
            'orderState|1': ['confirming', 'delivering', 'finished'],
          }],
        },
        stat: usefulMockData.okStat,
      });
      setTimeout(() => resolve(mocked), 1230);
    },
  },
  // 获取任务详情
  orderDetail: {
    handler: (resolve, reject, name, input) => {
      let mocked = {
        data: Mock.mock({
          'orderId': input.orderId,
          // 'client': '@cname',
          // 'time': '@date',
          'clientComment': '@cparagraph',
          'orderState|1': ['confirming', 'delivering', 'finished'],
          'goodList': [
            { name: '<1>', price: 80, number: 2 },
            { name: '<2>', price: 10, number: 4 },
          ],
          'totalPrice': 123,
        }),
        stat: usefulMockData.okStat,
      };
      setTimeout(() => resolve(mocked), 1000);
    },
  },
  // 领取订单 @
  deliverOrder: {
    handler: (resolve, reject, name, input) => {
      if(input.orderId & 1) {
        setTimeout(() => resolve({
          stat: usefulMockData.okStat,
        }), 300);
      } else {
        setTimeout(() => reject({
          stat: usefulMockData.failStat,
        }), 1000);
      }
    },
  },
  // 确认订单 @
  confirmOrder: {
    handler: (resolve, reject, name, input) => {
      if(input.orderId & 1) {
        setTimeout(() => resolve({
          stat: usefulMockData.okStat,
        }), 300);
      } else {
        setTimeout(() => reject({
          stat: usefulMockData.failStat,
        }), 1000);
      }
    },
  },
  listSellOrder: {
    handler: (resolve, reject, name, input) => {
      let mocked = Mock.mock({
        data: {
          ['list|13']: [{
            'sellOrderId|+1': 13,
            'price': 12.45,
            'tel': '1234567',
            'address': '@cname',
            'description': '@cparagraph',
            'imgUrl': 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
          }],
        },
        stat: usefulMockData.okStat,
      });
      setTimeout(() => resolve(mocked), 234);
    },
  },
};


export default filters;


