import React, { Component, Fragment } from 'react';
import { Route, HashRouter, Link } from 'react-router-dom';
import { Layout, Menu, Icon, Modal } from 'antd';
const { /* Header, */ Content /* , Footer, Sider */ } = Layout;
import apier from '@/utils/apier';
import sty from './Admin.md.sass';
import withAsyncComponent from '@/utils/asyncComponent';

import { UserCtx } from '@/contexts/contexts.js';

// Routes for different identities
// const WithAsyncTaskManage = withAsyncComponent(() => import('@/pages/TaskManage'));
// const WithTaskManageStatus = ({match}) => {
//   return (<WithAsyncTaskManage defaultFilters={{
//     taskStage: match.params.taskStage,
//   }} />);
// };

const pageRoutes = [
  {
    path: 'ModifyPassword',
    component: withAsyncComponent(() => import('@/pages/ModifyPassword')),
  },
  {
    path: 'AddGood',
    component: withAsyncComponent(() => import('@/pages/AddGood')),
  },
  {
    path: 'EditGood/:goodId',
    component: withAsyncComponent(() => import('@/pages/AddGood')),
  },
  {
    path: 'ManageGood',
    component: withAsyncComponent(() => import('@/pages/ManageGood')),
  },
  {
    path: 'ManageOrder',
    component: withAsyncComponent(() => import('@/pages/ManageOrder')),
  },
  {
    path: 'SellOrder',
    component: withAsyncComponent(() => import('@/pages/SellOrder')),
  },
];

const menuLinks = [
  {
    name: '图书中心',
    menus: [
      { path: 'AddGood', title: '添加图书' },
      { path: 'ManageGood', title: '管理图书' },
    ]
  }, {
    name: '订单中心',
    menus: [
      { path: 'ManageOrder', title: '订单管理' },
    ],
  }, {
    name: '卖书订单中心',
    menus: [
      { path: 'SellOrder', title: '卖书订单' },
    ],
  },
];


class Admin extends Component {
  constructor(props) {
    super(props);
    this.state= {
      logoutLoading: 0,
    };
    this.logoutClickHandler = this.logoutClickHandler.bind(this);
  }

  logoutClickHandler(infoUpdater) {
    return () => {
      this.setState({logoutLoading: 1});
      apier.fetch('logout')
      .then(() => infoUpdater())
      .catch(({stat}) => Modal.error({title: '登出遇到问题', content: `${stat.frimsg}`}))
      .finally(() => {
        this.setState({logoutLoading: 0});
      });
    };
  }

  render() {
    return(
      <div styleName="sty.layout-frame">
        <div styleName="sty.layout-sider-wrap">
          <div styleName="sty.layout-sider">
            <div styleName="sty.layout-sider_top">
              <em styleName="sty.logo-wrap">二手书市</em>
            </div>
            <UserCtx.Consumer>
            {info =>
              <Menu theme="dark" styleName="sty.layout-sider_menu" selectedKeys={[this.props.location.pathname]}>
              {menuLinks.reduce((accu, curt) => {
                let menuList = curt.menus.reduce((accu, curt) => {
                  (curt.access === -1 || (!curt.access) || curt.access.includes(info.ident))
                  && accu.push(
                    <Menu.Item key={this.props.match.url+'/'+curt.path}>
                      <Link to={this.props.match.url+'/'+curt.path}>{curt.title}</Link>
                    </Menu.Item>
                  );
                  return accu;
                }, []);
                menuList.length && accu.push(
                  <Menu.ItemGroup
                    key={curt.name}
                    title={<span styleName="sty.layout-sider_menu_group_title">{curt.name}</span>}
                    styleName="sty.layout-sider_menu_group"
                  >
                    {menuList}
                  </Menu.ItemGroup>
                );
                return accu;
              }, [])}
              </Menu>
            }
            </UserCtx.Consumer>
            <p styleName="sty.layout-sider_bottom">
              <span styleName="sty.copyright">
                © 2018 SBM.<wbr />All Rights Reserved.
              </span>
            </p>
          </div>
        </div>
        <div styleName="sty.layout-body" style={{ flex: '1' }}>
          <header styleName="sty.layout-header">
            <ul styleName="sty.layout-header_content">
              <li styleName="sty.layout-header_content_left"></li>
              <li styleName="sty.layout-header_content_right sty.login-info-bar">
                <UserCtx.Consumer>
                  {info =>
                  <>
                    <span>欢迎, {info.username}</span>
                    <span>
                      <Link to={`${this.props.match.url}/modifyPassword`}>修改密码</Link>
                    </span>
                    <span>
                      {this.state.logoutLoading
                      ? <em styleName="disabled-link">正在退出</em>
                      : <a onClick={this.logoutClickHandler(info.exit)}>退出登录</a>}
                    </span>
                  </>
                  }
                </UserCtx.Consumer>
              </li>
            </ul>
          </header>
          <Content styleName="sty.layout-content">
            <UserCtx.Consumer>
            {info => {
              let relRoot = this.props.match.url + '/';
              return pageRoutes.reduce((accu, item) => (
                (item.access === -1 || (!item.access) || item.access.includes(info.ident))
                && accu.push(
                  <Route path={relRoot+item.path} key={relRoot+item.path} component={item.component} />
                ),
                accu
              ), []);
            }}
            </UserCtx.Consumer>
          </Content>
        </div>
      </div>
    );
  }
}

export default Admin;
