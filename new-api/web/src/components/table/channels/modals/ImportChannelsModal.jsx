import React, { useState } from 'react';
import { Modal, Form, RadioGroup, Radio, Button, Typography, Space, Upload, Switch, Table } from '@douyinfe/semi-ui';
import { API } from '../../../../helpers/api';

const ImportChannelsModal = ({ visible, onCancel, onSuccess, t }) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('json');
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip');
  const [testConnectivity, setTestConnectivity] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (!file) { Modal.error({ title: t('请选择文件') }); return; }
    setLoading(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);
      formData.append('duplicate_strategy', duplicateStrategy);
      formData.append('test_connectivity', testConnectivity.toString());
      const res = await API.post('/api/channel/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { success, data, message } = res.data;
      if (success && data) { setResult(data); if (onSuccess && (data.success > 0 || data.updated > 0)) onSuccess(); }
      else { Modal.error({ title: t('导入失败'), content: message || t('未知错误') }); }
    } catch (error) { Modal.error({ title: t('导入失败'), content: error.message }); }
    finally { setLoading(false); }
  };

  const columns = [
    { title: t('渠道名称'), dataIndex: 'name', key: 'name' },
    { title: t('状态'), dataIndex: 'status', key: 'status', render: (text) => {
      const colors = { success: 'success', skipped: 'secondary', failed: 'danger', updated: 'primary' };
      return <Typography.Text type={colors[text] || 'secondary'}>{t(text)}</Typography.Text>;
    }},
    { title: t('详情'), dataIndex: 'message', key: 'message', render: (text) => text || '-' },
    { title: t('测试结果'), dataIndex: 'test_success', key: 'test_success', render: (val) => {
      if (val === undefined || val === null) return '-';
      return <Typography.Text type={val ? 'success' : 'danger'}>{val ? t('通过') : t('失败')}</Typography.Text>;
    }},
  ];

  return (
    <Modal title={t('导入渠道')} visible={visible} onCancel={onCancel} footer={
      <Space>
        <Button onClick={onCancel}>{t('关闭')}</Button>
        <Button type="primary" loading={loading} onClick={handleImport} disabled={!file}>{t('导入')}</Button>
      </Space>
    } width={800}>
      <Form>
        <Form.Section text={t('上传文件')}>
          <Upload draggable accept={format === 'json' ? '.json' : '.csv'} showUploadList={false} customRequest={({ file }) => setFile(file)}>
            <div style={{ padding: 20, border: '1px dashed #ccc', textAlign: 'center' }}>
              <Typography.Text>{file ? file.name : t('点击或拖拽文件到此区域上传')}</Typography.Text><br/>
              <Typography.Text type="secondary" size="small">{format === 'json' ? t('支持 .json 文件') : t('支持 .csv 文件')}</Typography.Text>
            </div>
          </Upload>
        </Form.Section>
        <Form.Section text={t('文件格式')}>
          <RadioGroup value={format} onChange={(e) => { setFormat(e.target.value); setFile(null); }}><Radio value="json">JSON</Radio><Radio value="csv">CSV</Radio></RadioGroup>
        </Form.Section>
        <Form.Section text={t('重复处理')}>
          <RadioGroup value={duplicateStrategy} onChange={(e) => setDuplicateStrategy(e.target.value)} type="vertical">
            <Radio value="skip">{t('跳过重复')} - {t('保留现有渠道，不导入重复项')}</Radio>
            <Radio value="update">{t('更新现有')} - {t('用导入数据更新现有渠道')}</Radio>
            <Radio value="create_new">{t('全部新建')} - {t('自动处理重复名称')}</Radio>
          </RadioGroup>
        </Form.Section>
        <Form.Section text={t('连通性测试')}>
          <Switch checked={testConnectivity} onChange={setTestConnectivity} checkedText={t('是')} uncheckedText={t('否')}/>
          <Typography.Text type="secondary" style={{ marginLeft: 8 }}>{t('导入后自动测试渠道连通性')}</Typography.Text>
        </Form.Section>
        {result && (
          <Form.Section text={t('导入结果')}>
            <Space style={{ marginBottom: 16 }}>
              <Typography.Text>{t('成功')}: {result.success}</Typography.Text>
              <Typography.Text>{t('更新')}: {result.updated}</Typography.Text>
              <Typography.Text>{t('跳过')}: {result.skipped}</Typography.Text>
              <Typography.Text>{t('失败')}: {result.failed}</Typography.Text>
              {testConnectivity && <Typography.Text>{t('测试失败')}: {result.test_failed}</Typography.Text>}
            </Space>
            <Table columns={columns} dataSource={result.details || []} pagination={{ pageSize: 10 }} size="small"/>
          </Form.Section>
        )}
      </Form>
    </Modal>
  );
};
export default ImportChannelsModal;
