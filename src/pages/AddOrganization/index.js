import React from 'react';
import { Row, Col, Form, Input, Button, Select, Modal } from 'antd';
const { TextArea } = Input;
import { PageHeader } from '@/comps/PageHeader';
import apier from '@/utils/apier.js';
import formRules from '@/utils/commonFormRules.js';

import './AddOrganization.md.sass';
// import '../../styles/common.sass';

class AddOrganization extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formState: 0,
      formTip: ['', ''],
    };

    this.formSubmitHandler = this.formSubmitHandler.bind(this);
  }

  formSubmitHandler(errors, values) {
    this.setState({
      formState: 1,
      formTip: ['info', '提交中'],
    });
    apier.fetch('addOrganization', {
      ...values, // 可能以后要改？
    })
    .then(() => {
      this.setState({
        formState: 2,
        formTip: ['success', '已添加新的机构账号'],
      });
      Modal.success({
        title: '已添加新的机构账号',
        content: '您可以在机构账号管理页进行查看和其他操作。',
      });
    })
    .catch(({stat}) => {
      this.setState({
        formState: 0,
        formTip: ['error', `遇到问题，请重试。${stat.frimsg}`],
      });
      Modal.error({
        title: '遇到了一些问题',
        content: <>{stat.frimsg}<br />请重试。</>,
      });
    });
  }

  render() {
    return (
      <>
        <PageHeader title="新建机构账号" />
        <section styleName="form-wrap">
          <WrappedForm
            onSubmit={this.formSubmitHandler}
            submitStage={this.state.formState}
          />
        </section>
      </>
    );
  }
}

class RawForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.formOp = this.props.form;
    // 提交数据
    this.submitHandler = e => {
      e.preventDefault();
      this.formOp.validateFields((errors, values) => {
        if(errors) return;
        this.props.onSubmit.call(e.currentTarget, errors, values);
      });
    };
  }

  render() {
    const { getFieldDecorator } = this.formOp;
    const submitBtnProps = {
      style: { width: '8em' },
      type: 'primary',
      size: 'large',
    };

    return (
      <Form onSubmit={this.submitHandler}>
        <div className="line-decorated-text" styleName="form-section-title">
          基本信息<small>（必填）</small>
        </div>
        <Row gutter={36}>
          <Col span={8}>
            <Form.Item label="姓名">
            {getFieldDecorator('name', {
              validateTrigger: 'onBlur',
              rules: [
                { min: 2, max: 30, required: true, message: '请输入合法的姓名' },
                formRules.personName,
              ],
            })(
              <Input />
            )}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="性别">
            {getFieldDecorator('gender', {
              rules: [{ required: true, message: '请选择性别' }],
            })(
              <Select style={{width: '100%'}} placeholder="点击选择">
                <Select.Option value={0}>男</Select.Option>
                <Select.Option value={1}>女</Select.Option>
              </Select>
            )}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="所属机构">
            {getFieldDecorator('belong', {
              validateTrigger: 'onBlur',
              rules: [
                { max: 60, message: '内容过长，不超过60字' },
                { required: true, message: '必填' },
              ],
            })(
              <Input />
            )}
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={36} styleName="form-row">
          <Col span={8}>
            <Form.Item label="工作邮箱">
            {getFieldDecorator('email', {
              validateTrigger: 'onBlur',
              rules: [
                { max: 40, message: '内容过长，不超过40字' },
                { type: 'email', message: '请输入合法的电子邮件地址' },
                { required: true, message: '必填' },
              ],
            })(
              <Input type="email" />
            )}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="电话号码">
            {getFieldDecorator('tel', {
              validateTrigger: 'onBlur',
              rules: [
                { required: true, message: '必须填写联系电话' },
                formRules.tel,
              ],
            })(
              <Input type="tel" />
            )}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="初始密码">
              <Input defaultValue="电话号码后六位" disabled />
            </Form.Item>
          </Col>
        </Row>
        <div className="line-decorated-text" styleName="form-section-title">
          更多信息<small>（非必填）</small>
        </div>
        <Row gutter={36}>
          <Col span={8}>
            <Form.Item label="身份证">
            {getFieldDecorator('idcard', {
              validateTrigger: 'onBlur',
              rules: [
                formRules.idcard,
              ],
            })(
              <Input />
            )}
            </Form.Item>
          </Col>
        </Row>
        <Row styleName="form-row">
          <Col span={36}>
            <Form.Item label="邮寄地址">
            {getFieldDecorator('address', {
              rules: [
                { max: 80, message: '内容请控制在80字以内' },
              ],
            })(
              <TextArea autosize={{ minRows: 1 }} placeholder="80字以内" />
            )}
            </Form.Item>
          </Col>
        </Row>
        <Form.Item styleName="form-submit-bar">
          {[
          <Button {...submitBtnProps} key="submit" htmlType="submit">提交</Button>,
          <Button {...submitBtnProps} key="submit" disabled loading >正在处理</Button>,
          <Button {...submitBtnProps} key="submit" disabled>添加成功</Button>,
          ][this.props.submitStage]}
        </Form.Item>
      </Form>
    );
  }
}

const WrappedForm = Form.create()(RawForm);


export default AddOrganization;
export { AddOrganization };
