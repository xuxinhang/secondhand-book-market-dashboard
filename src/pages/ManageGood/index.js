import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Message, Modal } from 'antd';
const { Column } = Table;
import { PageHeader } from '@/comps/PageHeader';
import { StatusModal } from '@/comps/StatusModal';
import apier from '@/utils/apier.js';

import './main.md.css';

class OperatorList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      formState: 0,
      formTip: ['', ''],
      listData: [/* {
        'goodId': 16,
        'num': 16,
        'name': '@cname',
        'createdTime': '@date',
        'tel': '@tel',
        'password': '@word',
        'taskStatistics': {
          'received': 0,
          'processing': 0,
          'confirming': 0,
          'finished': 0,
        },
        'state': 1,
      } */],
      pageSize: 10,
      currentPage: 1,
      totalRecord: 100,
      tableLoading: false,
      // Staged Modal
      freezeModalProps: {
        visible: false,
      },
    };

    this.onChangeStateBtnClick = this.onChangeStateBtnClick.bind(this);
    this.onDeleteBtnClick = this.onDeleteBtnClick.bind(this);
  }

  fetchListData(fedData) {
    // Prepare loading icon
    this.setState({ tableLoading: true });
    // Launch network request
    apier.fetch('listGoods', fedData)
    .then(({data}) => {
      this.setState({
        listData: data.list,
        totalRecord: data.pageInfo.totalRecord,
      });
    })
    .catch(({stat}) => {
      Message.warning(<>发生错误:<br />{stat.frimsg}</>);
    })
    .finally(() => {
      this.setState({ tableLoading: false });
    });
  }

  onChangeStateBtnClick (e) {
    let updateState = newState => this.setState({ freezeModalProps: newState });
    let { recordId, recordName, action, rowIndex } = e.target.dataset;
    let commonProps = {
      title: `你是要将商品“${recordName}”${['','上架','下架'][action]}吗?`,
      visible: true,
      closable: false,
    };

    let freezeModalInit = () => updateState({
      ...commonProps,
      onOk: freezeModalSubmit,
      onCancel: freezeModalClose,
    });

    let freezeModalClose = () => updateState({ ...commonProps, visible: false });

    let freezeModalSubmit = () => {
      // show loading icon
      updateState({
        ...commonProps,
        okButtonProps: { loading: true },
        cancelButtonProps: { disabled: true },
        maskClosable: false,
      });
      // network request
      apier.fetch('changeGoodState', {
        goodId: +recordId,
        action: +action, // 2 = 冻结
      })
      .then(() => {
        Message.success('此商品的状态已更改');
        freezeModalClose();
        this.setState(state => {
          state.listData[rowIndex].state = +action;
          return { listData: state.listData };
        });
      })
      .catch(({stat}) => {
        updateState({
          ...commonProps,
          statusTip: <span style={{color: 'red'}}>遇到错误：{stat.frimsg}</span>,
          onOk: freezeModalSubmit,
          onCancel: freezeModalClose,
        });
      });
    };

    freezeModalInit();
  }

  onDeleteBtnClick (e) {
    let { recordId, recordName, rowIndex } = e.target.dataset;
    recordId = +recordId;
    rowIndex = +rowIndex;
    Modal.confirm({
      title: `确定删除“${recordName}”吗？`,
      onOk: () => {
        return apier.fetch('deleteGood', {
          goodId: +recordId,
        })
        .then(() => {
          Message.success('已删除此商品');
          this.setState(state => {
            const newListData = [...state.listData];
            newListData.splice(rowIndex, 1);
            return { listData: newListData };
          });
        })
        .catch(({stat}) => {
          Modal.error({ title: `遇到错误：${stat.frimsg}` });
        });
      },
    })
  }

  componentDidMount() {
    this.fetchListData({
      pagination: {
        pageNumber: this.state.currentPage,
        pageSize: this.state.pageSize,
      },
    });
  }

  render() {

    const onPaginationChange = (currentPage, pageSize) => {
      this.setState({ currentPage, pageSize });
      this.fetchListData({
        pagination: { pageNumber: currentPage, pageSize },
      });
    };

    const paginationProps = {
      current: this.state.currentPage,
      pageSize: this.state.pageSize,
      showQuickJumper: true,
      showSizeChanger: true,
      total: this.state.totalRecord,
      onChange: onPaginationChange,
      onShowSizeChange: onPaginationChange,
    };

    return (
      <>
        <PageHeader title="管理商品">
          <Link to="/admin/AddGood">
            <Button size="small" type="primary"
              className="button--deep-gray-primary ds-button-round-corner"
            >
              添加商品
            </Button>
          </Link>
        </PageHeader>
        <Table
          styleName="ds-ant-table-wrapper"
          dataSource={this.state.listData}
          rowClassName="ds-table-row"
          rowKey="goodId"
          size="small"
          pagination={paginationProps}
          loading={this.state.tableLoading}
        >
          <Column title="编号" dataIndex="num" width={60} className="ds-table-first-column" />
          <Column title="商品" dataIndex="name" />
          <Column title="创建时间" dataIndex="createdTime" />
          <Column title="价格" dataIndex="price" />
          <Column title="类别" dataIndex="type"
            render={(text) => (['', '全套出售', '单本出售'][text])}
          />
          <Column title="状态" dataIndex="state"
            render={(text) => (text === 1 ? '上架销售' : text === 2 ? '下架补货中' : '')}
          />
          <Column title="操作" key="op" align="right"
            className="ds-table-last-column"
            render={(text, record, index) => (
              <>
                <Button
                  className="ds-button-round-corner" ghost size="small" type="primary"
                  data-record-id={record.goodId}
                  data-record-name={record.name}
                  data-row-index={index}
                  onClick={this.onDeleteBtnClick}
                >
                  删除商品
                </Button>
                {/* <Button
                  className="ds-button-round-corner" ghost size="small"
                  type={['','danger','primary'][record.state]}
                  data-record-id={record.goodId}
                  data-record-name={record.name}
                  data-action={[0,2,1][record.state]}
                  data-row-index={index}
                  onClick={this.freezeBtnClickHandler}
                >
                  编辑商品
                </Button> */}
                <Button
                  className="ds-button-round-corner" ghost size="small"
                  type={['','danger','primary'][record.state]}
                  data-record-id={record.goodId}
                  data-record-name={record.name}
                  data-action={[0,2,1][record.state]}
                  data-row-index={index}
                  onClick={this.onChangeStateBtnClick}
                >
                  {['','下架商品', '上架商品'][record.state]}
                </Button>
              </>
            )}
          />
        </Table>

        {/* 冻结账户功能 */}
        <StatusModal {...this.state.freezeModalProps} />
      </>
    );
  }
}


export default OperatorList;
export { OperatorList };

