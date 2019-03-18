import React from 'react';
import { Row, Col, Button, Icon, Popover, Tooltip, Modal, Message, Spin, Upload } from 'antd';
import DsSteps from '@/comps/DsSteps';
import { UserCtx } from '@/contexts/contexts.js';
import PropTypes from 'prop-types';
import moment from 'moment';
import apier from '@/utils/apier.js';
import formRules from '@/utils/commonFormRules.js';

import './ExpandedDetailRow.md.sass';

const customedIcon = {
  clock: <svg viewBox="232 232 560 560" fill="currentColor" width="1em" height="1em"><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
};

class ExpandedDetailRow extends React.Component {
  constructor(props) {
    super(props);

    this.onConfirmBtnClick = this.onConfirmBtnClick.bind(this);
    this.onDeliverBtnClick = this.onDeliverBtnClick.bind(this);

    this.state = {
      // 数据
      currentOrderId: undefined,
      detailData: {
        orderId: props.orderId,
        name: '@cname',
        createdTime: '@date',
        clientComment: '@cparagraph',
        orderState: 'processing',
        goodList: [],
      },
      // UI
      dataLoading: false,
      uploadBtnFileList: [],
      uploadBtnLoading: false,
    };

    this.currentOrderId = this.props.orderId;

  }

  componentDidMount() {
    this.fetchDetailData({
      orderId: this.state.detailData.orderId,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.active == true) {
      if(this.state.currentOrderId != this.props.orderId) {
        this.fetchDetailData({ orderId: this.props.orderId });
      }
    } else if(this.props.active == false) {
      // Do Nothing
    }
  }

  async fetchDetailData({ orderId }) {
    this.setState({
      dataLoading: true,
      // 这一行很重要，没有这一行会因为componentDidUpdate陷入循环
      // 本函数(fetchDetailData) 一开始就要设置 currentOrderId
      currentOrderId: orderId,
    });
    try {
      let { data } = await apier.fetch('orderDetail', { orderId });
      this.setState({
        detailData: data,
        dataLoading: false,
        currentOrderId: orderId,
      });
    } catch({ data, stat }) {
      Message.error('获取订单详情错误：' + stat.frimsg);
      this.setState({
        dataLoading: false,
        currentOrderId: orderId,
      });
    }
  }

  // 同时更新内部的和父组件的数据
  updateOrderData(patch) {
    this.props.onItemChange(patch);
    this.setState(prevState => {
      const newData = { ...prevState.detailData, ...patch };
      return { detailData: newData };
    });
  }

  onDeliverBtnClick () {
    let orderId = this.props.orderId; // [TODO]
    Modal.confirm({
      title: '此订单已完成送货了吗？',
      onOk: () => { //close => {
        return apier.fetch('deliverOrder', { orderId })
        .then(() => {
          Message.success('此订单已结束');
          this.updateOrderData({ orderState: 'finished' });
        })
        .catch(({ stat }) => {
          Modal.error({
            title: '无法标记此订单为送货完成！',
            content: stat.frimsg,
          });
        });
      },
    });
  }

  onConfirmBtnClick () {
    Modal.confirm({
      title: '要确认此订单吗？',
      content: '',
      onOk: async close => {
        try {
          await apier.fetch('confirmOrder', {
            orderId: this.props.orderId,
          });
          this.updateOrderData({ orderState: 'delivering' });
          Message.success('此订单已确认');
          close();
        } catch({ stat }) {
          close();
          Modal.error({
            title: '暂时无法确认此订单',
            content: stat.frimsg,
          });
        }
      },
    });
  }

  render() {
    let detailData = this.state.detailData;

    // const formatTimestamp = t => moment(new Date(t)).format('YYYY/MM/DD HH:mm');
    // const formatTimeDiff = (a, b) => {
    //   let ds = (a - b) / 1000;
    //   let dm = Math.round(ds / 60);
    //   let dh = Math.floor(dm / 60);
    //   let mm = dm % 60;
    //   let dd = Math.floor(dh / 24);
    //   // let hh = dh % 24;
    //   return dd == 0
    //          ? dh == 0 ? `${mm}分钟` : `${dh}时${mm}分`
    //          : `${dd}天${Math.round(dm / 60) % 24}时`;
    // };

    const getStateIndex = s => ['confirming', 'delivering', 'finished'].indexOf(s);
    const currentStateIndex = getStateIndex(detailData.orderState);

    return (
      <Spin spinning={this.state.dataLoading}>
        <div styleName="box-wrap">
          <Row gutter={12} styleName="section-wrap">
            <Col span={12}>
              <p styleName="section_title">
                订单详情
                <small style={{color: 'transparent'}}>{this.props.orderId}</small>
              </p>
              <table styleName="section_table">
                <tbody>
                  {detailData.goodList.map(item => (
                  <tr key={item.name}>
                    <th>{item.name}</th>
                    <td>￥{item.price}</td>
                    <td>x{item.number}</td>
                  </tr>))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3">
                      <em>共计￥{detailData.goodList.reduce((a, c) => a + c.number * c.price, 0)}，
                      {detailData.goodList.reduce((a, c) => a + c.number, 0)}本</em>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </Col>
            <Col span={12}>
              <p styleName="section_title">买家留言</p>
              <p styleName="section_para">{detailData.clientComment}</p>
            </Col>
          </Row>
          <div styleName="section-wrap">
            <p styleName="section_title">处理进度{detailData.orderState}</p>
            <ul styleName="operation-list">
              <li>
                <Button
                  onClick={this.onConfirmBtnClick}
                  disabled={detailData.orderState !== 'confirming'}
                >
                  {getStateIndex('confirming') >= currentStateIndex
                    ? <Icon type="clock-circle" theme="filled" />
                    : <Icon type="check-circle" />
                  }
                  联系客户确定订单
                </Button>
              </li>
              <li>
                <Button
                  onClick={this.onDeliverBtnClick}
                  disabled={detailData.orderState !== 'delivering'}
                >
                  {getStateIndex('delivering') >= currentStateIndex
                    ? <Icon type="clock-circle" theme="filled" />
                    : <Icon type="check-circle" />
                  }
                  点击确认送货成功
                </Button>
              </li>
            </ul>
          </div>
        </div>
      </Spin>
    );
  }
}


/* const FormSubmitDownload = function (props) {
  let jsonStr = JSON.stringify({ ...props.params, stupidTrash: '=' });
  let separatorIndex = jsonStr.lastIndexOf('=');

  return (
    <form method="post" encType="text/plain" action={props.url}>
      <input type="hidden"
        name={jsonStr.substr(0, separatorIndex)}
        value={jsonStr.substr(separatorIndex + 1)}
      />
      <button type="submit">
        {props.children}
      </button>
    </form>
  );
};

FormSubmitDownload.propTypes = {
  params: PropTypes.object,
}; */


export default ExpandedDetailRow;
export { ExpandedDetailRow };
