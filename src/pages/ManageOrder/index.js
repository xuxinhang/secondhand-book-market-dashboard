import React from 'react';
import PropTypes from 'prop-types';
import { PageHeader } from '@/comps/PageHeader';
import { Table, Message } from 'antd';
const { Column } = Table;
import { ExpandedDetailRow } from './ExpandedDetailRow';
import apier from '@/utils/apier';

import _ from 'lodash';

import './ManageOrder.md.sass';


class ManageOrder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 过滤条件
      taskListFilters: { ...props.defaultFilters },
      // UI
      tableLoading: false,
      currentPage: 1,
      pageSize: 10,
      totalRecord: 10,
      // 数据
      tableData: [/* {
        'orderId': 16,
        'num': 16,
        'name': '@cname',
        'gender': 1,
        'createdTime': '@date',
        'orgName': '@cname',
        'operatorName': '@cname',
        'orgBelong': '法医中心',
        'part': '腹部',
        'taskStage': 'receiving',
      } */],
      tableExpandedRowKeys: [],
    };

    this.paginationChangeHandler = this.paginationChangeHandler.bind(this);

  }

  paginationChangeHandler(currentPage, pageSize) {
    this.setState({ currentPage, pageSize });
    this.fetchListData({
      pagination: { pageNumber: currentPage, pageSize },
    });
  }

  fetchListData({ pagination }) {
    this.setState({ tableLoading: true });
    // 计算过滤器的取值 more in furture
    let filters = {
      taskStage: this.state.taskListFilters.taskStage,
    };

    apier.fetch('listOrders', { pagination, filters })
    .then(({ data }) => {
      this.setState({
        tableData: data.list,
        totalRecord: data.pageInfo.totalRecord,
      });
    })
    .catch(({ stat }) => {
      Message.warn('获取数据出错：' + stat.frimsg);
    })
    .finally(() => {
      this.setState({ tableLoading: false });
    });
  }

  changeItemData(patchData, lineIndex) {
    this.setState(state => {
      const prevItem = state.tableData[lineIndex];
      const newTableData = [...state.tableData];
      newTableData.splice(lineIndex, 1, { ...prevItem, ...patchData });
      return { tableData: newTableData };
    });
  }

  componentDidMount() {
    this.paginationChangeHandler(1, 10);
  }

  componentDidUpdate(prevProps) {
    // [NOTICE] 千万不要比较对象是否相等
    if(!_.isEqual(prevProps.defaultFilters, this.props.defaultFilters)) {
      this.setState({
        taskListFilters: {...this.props.defaultFilters},
      }, () => { // Run after states having been updated
        this.paginationChangeHandler(1, 10);
      });
    }
  }

  render() {
    const orderStateMap = {
      'confirming': '待电话确认',
      'delivering': '备货配送中',
      'finished': '已结束',
    };

    /* const toggleExpandClickHandler = e => {
      let ds = e.target.dataset;
      toggleExpandedRow(ds.key, ds.index, ds.tar);
    }; */

    const toggleExpandedRow = (key, index, tar) => {
      this.setState(state => {
        let tkeys = state.tableExpandedRowKeys;
        let opind = tkeys.indexOf(key);
        if(opind === -1 && tar !== false) {
          tkeys.push(key);
        } else if(opind !== -1 && tar !== true) {
          tkeys.splice(opind, 1);
        }
        return { tableExpandedRowKeys: tkeys };
      });
    };

    const tableExpandedRowRender = (record, index, indent, expanded) => {
      return (
        <ExpandedDetailRow
          active={expanded}
          orderId={record.orderId}
          onItemChange={(patch) => this.changeItemData(patch, index)}
        />
      );
    };

    return (
      <>
        <PageHeader title="订单管理"></PageHeader>
        {/* <ExpandedDetailRow /> */}
        <Table
          styleName="table-task-list ds-ant-table-wrapper"
          dataSource={this.state.tableData}
          rowClassName="ds-table-row"
          rowKey="orderId"
          size="small"
          pagination={{
            current: this.state.currentPage,
            pageSize: this.state.pageSize,
            total: this.state.totalRecord,
            onChange: this.paginationChangeHandler,
            onShowSizeChange: this.paginationChangeHandler,
            showQuickJumper: true,
            showSizeChanger: true,
          }}
          loading={this.state.tableLoading}
          expandedRowRender={tableExpandedRowRender}
          expandIconAsCell={false}
          expandIconColumnIndex={6}
          expandedRowClassName={() => 'ds-table-expanded-row'}
        >
          <Column title="编号" dataIndex="num" className="ds-table-first-column" width={60} />
          <Column title="收货人" dataIndex="client" />
          <Column title="电话" dataIndex="clientTel" />
          <Column title="收货地址" dataIndex="clientAddress" />
          <Column title="创建时间" dataIndex="createdTime" />
          <Column title="任务状态" dataIndex="orderState" render={text => orderStateMap[text] || ''} />
          <Column title="操作" key="op" align="right" className="ds-table-last-column" />
        </Table>
      </>
    ); // () => toggleExpandedRow(record.orderId, index, false)
  }
}

ManageOrder.propTypes = {
  defaultFilters: PropTypes.object,
};


export default ManageOrder;
export { ManageOrder };
