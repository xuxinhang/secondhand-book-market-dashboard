import React from 'react';
import { message, Card, Button, Icon, List, Modal } from 'antd';
import { PageHeader } from '@/comps/PageHeader';
import apier from '@/utils/apier.js';
import './index.md.sass';

class SellOrder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orderDataList: [],
      loadingList: false,
    };
  }

  fetchSellOrderList() {
    this.setState({ loadingList: true });
    apier.fetch('listSellOrder', {})
      .then(({ data }) => {
        this.setState({
          orderDataList: data.list || [],
          loadingList: false,
        });
      })
      .catch(({ stat }) => {
        this.setState({ loadingList: false });
        message.error(`加载数据时遇到了一些问题。${stat.frimsg}`);
      });
  }

  onAcceptActionClick(sellOrderId) {
    Modal.confirm({
      title: '确实要接受此卖书订单吗？',
      onOk: () => {
        return apier.fetch('acceptSellOrder', { sellOrderId })
          .then(() => {
            message.success('接受卖书订单成功');
            this.setSellOrderState(sellOrderId, 1);
          })
          .catch(({ stat }) => {
            Modal.error({
              title: '暂时无法接受卖书订单',
              content: stat.frimsg,
            });
          });
      },
    });
  }

  onRejectActionClick(sellOrderId) {
    Modal.confirm({
      title: '确实要拒绝此卖书订单吗？',
      onOk: () => {
        return apier.fetch('acceptSellOrder', { sellOrderId })
          .then(() => {
            message.success('拒绝卖书订单成功');
            this.setSellOrderState(sellOrderId, 2);
          })
          .catch(({ stat }) => {
            Modal.error({
              title: '暂时无法拒绝卖书订单',
              content: stat.frimsg,
            });
          });
      },
    });
  }

  setSellOrderState(targetSellOrderId, newStateValue) {
    this.setState(prev => ({
      orderDataList: prev.orderDataList.map(item =>
        item.sellOrderId === targetSellOrderId
          ? { ...item, state: newStateValue }
          : item
      ),
    }));
  }

  componentDidMount() {
    this.fetchSellOrderList();
  }

  render() {
    return (<>
      <PageHeader title="卖书订单管理" />
      <div styleName="sell-list">
        {this.state.orderDataList.map(item => (
        <Card
          styleName="sell-list_item"
          key={item.sellOrderId}
          actions={
            item.state === 0
              ? [
                <span onClick={() => this.onAcceptActionClick(item.sellOrderId)}>
                  <Icon type="check-circle" /> 接受
                </span>,
                <span onClick={() => this.onRejectActionClick(item.sellOrderId)}>
                  <Icon type="minus-circle" /> 拒绝
                </span>,
              ]
              : [ '已' + [,'接受','拒绝'][item.state] ]
          }
        >
          <div styleName="good-image-wrapper">
            <img src={item.imgUrl} />
          </div>
          <dl styleName="card-content-list">
            <dt>价格</dt><dd>{item.price}</dd>
            <dt>描述</dt><dd>{item.description}</dd>
            <dt>联系方式</dt><dd>{item.tel}</dd>
            <dt>取货地址</dt><dd>{item.address}</dd>
          </dl>
        </Card>
        ))}
      </div>
    </>);
  }
}

export default SellOrder;

