import React, { useState } from 'react';
import { Modal, Form, RadioGroup, Radio, Button, Typography, Space } from '@douyinfe/semi-ui';
import { API } from '../../../../helpers/api';

const ExportChannelsModal = ({ visible, onCancel, selectedChannels, onSuccess, t }) => {
  const [loading, setLoading] = useState(false);
  const [exportScope, setExportScope] = useState('selected');
  const [format, setFormat] = useState('json');
  const [exportMethod, setExportMethod] = useState('download');

  const handleExport = async () => {
    setLoading(true);
    try {
      const requestData = {
        format,
        all: exportScope === 'all',
        ids: exportScope === 'selected' ? selectedChannels.map(ch => ch.id) : [],
      };

      const res = await API.post('/api/channel/export', requestData);
      const { success, data, message } = res.data;
      
      if (success && data) {
        if (exportMethod === 'download') {
          const mimeType = format === 'json' ? 'application/json' : 'text/csv';
          const blob = new Blob([data.content], { type: mimeType });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        
        if (onSuccess) {
          onSuccess(data, exportMethod);
        }
        onCancel();
      } else {
        Modal.error({ title: t('导出失败'), content: message || t('未知错误') });
      }
    } catch (error) {
      Modal.error({ title: t('导出失败'), content: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('导出渠道')}
      visible={visible}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>{t('取消')}</Button>
          <Button type="primary" loading={loading} onClick={handleExport}>
            {t('导出')}
          </Button>
        </Space>
      }
      width={500}
    >
      <Form>
        <Typography.Text type="warning" style={{ marginBottom: 16, display: 'block' }}>
          {t('导出文件包含渠道密钥(Key)，请妥善保管，避免泄露')}
        </Typography.Text>
        
        <Form.Section text={t('导出范围')}>
          <RadioGroup
            value={exportScope}
            onChange={(e) => setExportScope(e.target.value)}
            type="vertical"
          >
            <Radio value="selected" disabled={selectedChannels.length === 0}>
              {t('导出选中')} {selectedChannels.length > 0 && `(${selectedChannels.length} ${t('条')})`}
            </Radio>
            <Radio value="all">{t('导出全部')}</Radio>
          </RadioGroup>
        </Form.Section>

        <Form.Section text={t('导出格式')}>
          <RadioGroup
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <Radio value="json">JSON</Radio>
            <Radio value="csv">CSV</Radio>
          </RadioGroup>
        </Form.Section>

        <Form.Section text={t('导出方式')}>
          <RadioGroup
            value={exportMethod}
            onChange={(e) => setExportMethod(e.target.value)}
          >
            <Radio value="download">{t('文件下载')}</Radio>
            <Radio value="display">{t('页面显示')}</Radio>
          </RadioGroup>
        </Form.Section>
      </Form>
    </Modal>
  );
};

export default ExportChannelsModal;
