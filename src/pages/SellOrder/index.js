import React from 'react';
import { Card, Button, List, message } from 'antd';
import { PageHeader } from '@/comps/PageHeader';
import apier from '@/utils/apier.js';


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
        orderDataList: data,
        loadingList: false,
      });
    })
    .catch(({ stat }) => {
      this.setState({ loadingList: false });
      message.error(`加载数据时遇到了一些问题。${stat.frimsg}`);
    });
  }

  componentDidMount() {
    this.fetchSellOrderList();
  }

  render() {
    return (<>
      <PageHeader title="卖书订单管理" />
      <div>
        <List
          grid={{ gutter: 16, column: 4 }}
          dataSource={[]}
          renderItem={item => (
            <List.Item>
              <Card
                cover={<img src={item.imgUrl} />}
                actions={[
                  <Icon type="setting" />,
                  <Icon type="edit" />,
                ]}
              >
                <dl>
                  <dt>价格</dt><dd>{item.price}</dd>
                  <dt>描述</dt><dd>{item.description}</dd>
                  <dt>联系方式</dt><dd>{item.tel}</dd>
                  <dt>取货地址</dt><dd>{item.address}</dd>
                </dl>
              </Card>
            </List.Item>
          )}
        />
        <Card></Card>
      </div>
    </>);
  }
}

export default SellOrder;

