import React from 'react';
import { Row, Col, Form, Input, Button, message, Select, Modal, Upload, Icon, Spin } from 'antd';
const { TextArea } = Input;
const { Option } = Select;
import { PageHeader } from '@/comps/PageHeader';
import apier from '@/utils/apier.js';
// import formRules from '@/utils/commonFormRules.js';
import TagSelector from '@/comps/TagSelector';

import './AddGood.md.sass';

class AddTask extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formState: 0,
      formTip: ['', ''],
      formLoading: false,
      initialFormValue: {
        name: '',
        price: '',
        type: 1,
        description: '',
        tags: {},
      },
    };

    this.formSubmitHandler = this.formSubmitHandler.bind(this);
  }

  formSubmitHandler(errors, values) {
    this.setState({
      formState: 1,
      formTip: ['info', '提交中'],
    });
    apier.fetch('addGood', {
      ...values,
    })
    .then(() => {
      this.setState({
        formState: 2,
        formTip: ['success', '操作成功'],
      });
      Modal.success({
        title: '此项已被添加',
        content: '您可以在浏览页进行查看和其他操作。',
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

  fetchInitialFormValue(goodId) {
    this.setState({ formLoading: true });
    apier.fetch('goodDetail', { goodId })
    .then(({ data }) => {
      this.setState(state => ({
        initialFormValue: {
          ...state.initialFormValue,
          ...data,
        },
        formLoading: false,
      }));
    })
    .catch(({ stat }) => {
      message.error('暂时无法获取货物信息。' + stat.frimsg);
      this.setState({ formLoading: false });
    });
  }

  componentDidMount() {
    if(this.props.match.params.goodId) {
      const goodId = +this.props.match.params.goodId;
      this.setState(state => ({
        initialFormValue: { ...state.initialFormValue, goodId },
      }));
      this.fetchInitialFormValue(goodId);
    }
  }

  render() {
    return (
      <>
        <PageHeader title="新建数据" />
        <section styleName="form-wrap">
          <Spin spinning={this.state.formLoading}>
            <WrappedForm
              onSubmit={this.formSubmitHandler}
              submitStage={this.state.formState}
              initialFormValue={this.state.initialFormValue}
            />
          </Spin>
        </section>
      </>
    );
  }
}

class RawForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // imageRemoteUrl:  undefined, // 商品图片的URL（已上传的）
      imagePreviewUrl: undefined, // 商品图片的URL（预览缓存）
    };
    this.formOp = this.props.form;
    // 提交数据
    this.onBeforeUpload = this.onBeforeUpload.bind(this);
    this.submitHandler = e => {
      e.preventDefault();
      this.formOp.validateFields((errors, values) => {
        if(errors) return;
        let processedFormValue = {
          // ...this.state.initialFormValue,
          goodId: this.props.initialFormValue.goodId,
          ...values,
        };
        this.props.onSubmit.call(e.currentTarget, errors, processedFormValue);
      });
    };
  }

  onBeforeUpload(file) {
    const fr = new FileReader();
    fr.readAsDataURL(file);
    fr.onload = e => {
      this.setState({
        imagePreviewUrl: e.target.result,
      });
    };
    return false;
  }

  render() {
    const { getFieldDecorator, getFieldValue } = this.formOp;
    const { initialFormValue } = this.props;
    const submitBtnProps = {
      style: { width: '8em' },
      type: 'primary',
      size: 'large',
    };

    const tagList = [
      {
        name: 'basic',
        label: '基本类型',
        tags: [
          { label: '课本', value: 1 },
          { label: '教辅', value: 2 },
          { label: '课外书', value: 3 },
        ],
      },
      {
        name: 'grade',
        label: '适合年级',
        tags: [
          { label: '大一', value: 1 },
          { label: '大二', value: 2 },
          { label: '大三', value: 3 },
          { label: '大四', value: 4 },
          { label: '研究生', value: 5 },
        ],
      },
      {
        name: 'college',
        label: '适合学院',
        tags: [
          { label: '电信', value: 1 },
          { label: '计科', value: 2 },
          { label: '光电', value: 3 },
          { label: '软件', value: 4 },
          { label: '其它', value: 5 },
        ],
      },
    ];

    return (
      <Form onSubmit={this.submitHandler}>
        <div className="line-decorated-text" styleName="form-section-title">测量对象</div>
        <Row gutter={36}>
          <Col span={8}>
            <Form.Item label="商品名称">
            {getFieldDecorator('name', {
              initialValue: initialFormValue.name,
              rules: [
                { required: true, message: '请输入商品名称' },
              ],
            })(
              <Input />
            )}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="价格">
            {getFieldDecorator('price', {
              getValueFromEvent: e => Math.round(parseFloat(e.target.value) * 100) / 100,
              normalize: v => String(v),
              initialValue: initialFormValue.price,
              rules: [
                { required: true, message: '需输入商品价格' },
                { pattern: /^[1-9]+?[0-9]*(\.[0-9]{1,2})?$/, message: '输入合法的商品价格' },
              ],
            })(
              <Input />
            )}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="商品类别">
            {getFieldDecorator('type', {
              initialValue: initialFormValue.type,
              rules: [{ required: true, message: '请选择类别' }],
            })(
              <Select style={{width: '100%'}} placeholder="点击选择">
                <Option value={1}>单本出售</Option>
                <Option value={2}>整套出售</Option>
              </Select>
            )}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={36}>
            <Form.Item label="商品描述">
            {getFieldDecorator('description', {
              initialValue: initialFormValue.description,
              rules: [
                { max: 200, message: '内容请控制在200字以内' },
                { required: true, message: '必需填写情况概述' },
              ],
            })(
              <TextArea autosize={{ minRows: 5 }} placeholder="200字以内" />
            )}
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={36} styleName="form-row">
          <Col span={14}>
            <div className="line-decorated-text" styleName="form-section-title">商品标签</div>
            {tagList.map(({ name, label, tags }) => (
              <Row key={name} styleName="tag-selector-row">
                <Col span={6}>{label}</Col>
                <Col span={18}>
                  {getFieldDecorator(`tags.${name}`, {
                    initialValue: initialFormValue.tags[name] || [],
                  })(
                    <TagSelector tags={tags} />
                  )}
                </Col>
              </Row>
            ))}
          </Col>
          <Col span={10}>
            <div className="line-decorated-text" styleName="form-section-title">商品图片</div>
            <Form.Item label="">
              {getFieldDecorator('image', {
                valuePropName: 'fileList',
                getValueFromEvent: ({ file }) => {
                  if(file.type.indexOf('image/') !== 0) {
                    message.error('仅可上传图片');
                    return [];
                  } else {
                    return [file];
                  }
                },
                initialValue: [], // 已上传的图片是拿不到初值的
                rules: [
                  // 如果没有上传过图片这就是必填项
                  { required: !initialFormValue.imgUrl, message: '必须上传图片' },
                ],
              })(
                <Upload
                  name="task_upload"
                  styleName="form-uploader"
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={this.onBeforeUpload}
                >
                  {(() => {
                    // 只取第一项 // const img = value[0];
                    const mergedImageUrl = this.state.imagePreviewUrl || initialFormValue.imgUrl;
                    if (!mergedImageUrl) {
                      return (<>
                        <p styleName="upload-icon">
                          <Icon type="cloud-upload" />
                        </p>
                        <p className="ant-upload-text" styleName="form-uploader-filename">
                            {/* `${img.name} (${Math.round(img.size/1024/1024*100)/100}MB)` */}
                            商品图片上传
                        </p>
                        <p className="ant-upload-hint">
                          {/* 请上传包括STL文件、照片和描述文件的压缩包 */}
                        </p>
                      </>);
                    } else {
                      return (
                        <img styleName="upload-image-preview" src={mergedImageUrl} />
                      );
                    }
                  })(getFieldValue('image'))}
                </Upload>
              )}
            </Form.Item>
          </Col>
        </Row>
        <Form.Item styleName="form-submit-bar">
          {[
          <Button {...submitBtnProps} key="submit" htmlType="submit">提交</Button>,
          <Button {...submitBtnProps} key="loading" disabled loading >正在提交</Button>,
          <Button {...submitBtnProps} key="success" disabled>提交成功</Button>,
          ][this.props.submitStage]}
        </Form.Item>
      </Form>
    );
  }
}

const WrappedForm = Form.create()(RawForm);



export default AddTask;
export { AddTask };
