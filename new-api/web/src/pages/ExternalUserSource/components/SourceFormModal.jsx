import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, Toast, Space } from '@douyinfe/semi-ui';
import { API } from '../../../helpers/api';

const SourceFormModal = ({ visible, source, onCancel, onSuccess }) => {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (source) {
        setForm({
          name: source.name,
          db_type: source.db_type,
          host: source.host,
          port: source.port,
          database: source.database,
          username: source.username,
          password: '',
          table_name: source.table_name,
          query_where: source.query_where || '',
          unique_key: source.unique_key,
          enabled: source.enabled,
        });
      } else {
        setForm({
          db_type: 'mysql',
          port: 3306,
          unique_key: 'id',
          enabled: 0,
        });
      }
    }
  }, [visible, source]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = { ...form };
      if (source && !data.password) {
        delete data.password;
      }

      if (source) {
        await API.put(`/api/external-user-source/${source.id}`, data);
        Toast.success('Updated');
      } else {
        await API.post('/api/external-user-source', data);
        Toast.success('Created');
      }
      onSuccess();
    } catch (err) {
      Toast.error(source ? 'Update failed' : 'Create failed');
    }
    setLoading(false);
  };

  const handleTest = async () => {
    if (!form.host || !form.port || !form.database || !form.username) {
      Toast.warning('Please fill connection fields first');
      return;
    }

    setTesting(true);
    try {
      // Create temp source to test connection
      const tempData = { ...form, name: 'temp_test_' + Date.now() };
      if (!tempData.password) tempData.password = 'test';
      
      const res = await API.post('/api/external-user-source', tempData);
      if (res.data.data?.id) {
        const testRes = await API.post(`/api/external-user-source/${res.data.data.id}/test`);
        await API.delete(`/api/external-user-source/${res.data.data.id}`);
        if (testRes.data.success) {
          Toast.success('Connection successful');
        } else {
          Toast.error(testRes.data.error || 'Connection failed');
        }
      }
    } catch (err) {
      Toast.error('Test failed: ' + (err.response?.data?.error || err.message));
    }
    setTesting(false);
  };

  const updateForm = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <Modal
      title={source ? 'Edit Source' : 'Add Source'}
      visible={visible}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={handleTest} loading={testing}>Test Connection</Button>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>Save</Button>
        </Space>
      }
      style={{ width: 600 }}
    >
      <Form>
        <Form.Input
          field="name"
          label="Name"
          initValue={form.name}
          onChange={(e) => updateForm('name', e)}
          rules={[{ required: true }]}
          placeholder="Employee Database"
        />
        <Form.Select
          field="db_type"
          label="Database Type"
          initValue={form.db_type}
          onChange={(value) => { updateForm('db_type', value); updateForm('port', value === 'mysql' ? 3306 : 5432); }}
          rules={[{ required: true }]}
        >
          <Select.Option value="mysql">MySQL</Select.Option>
          <Select.Option value="postgresql">PostgreSQL</Select.Option>
        </Form.Select>
        <Form.Input
          field="host"
          label="Host"
          initValue={form.host}
          onChange={(e) => updateForm('host', e)}
          rules={[{ required: true }]}
          placeholder="192.168.1.100"
        />
        <Form.InputNumber
          field="port"
          label="Port"
          initValue={form.port}
          onChange={(value) => updateForm('port', value)}
          rules={[{ required: true }]}
        />
        <Form.Input
          field="database"
          label="Database"
          initValue={form.database}
          onChange={(e) => updateForm('database', e)}
          rules={[{ required: true }]}
          placeholder="hr_system"
        />
        <Form.Input
          field="username"
          label="Username"
          initValue={form.username}
          onChange={(e) => updateForm('username', e)}
          rules={[{ required: true }]}
          placeholder="readonly"
        />
        <Form.Input
          field="password"
          label="Password"
          type="password"
          initValue={form.password}
          onChange={(e) => updateForm('password', e)}
          placeholder={source ? 'Leave empty to keep current' : ''}
          rules={source ? [] : [{ required: true }]}
        />
        <Form.Input
          field="table_name"
          label="Table Name"
          initValue={form.table_name}
          onChange={(e) => updateForm('table_name', e)}
          rules={[{ required: true }]}
          placeholder="employees"
        />
        <Form.Input
          field="query_where"
          label="WHERE Clause (optional)"
          initValue={form.query_where}
          onChange={(e) => updateForm('query_where', e)}
          placeholder="status = 'active'"
        />
        <Form.Input
          field="unique_key"
          label="Unique Key Field"
          initValue={form.unique_key}
          onChange={(e) => updateForm('unique_key', e)}
          rules={[{ required: true }]}
          placeholder="employee_id"
        />
        <Form.Switch
          field="enabled"
          label="Enabled"
          initValue={form.enabled === 1}
          onChange={(checked) => updateForm('enabled', checked ? 1 : 0)}
        />
      </Form>
    </Modal>
  );
};

export default SourceFormModal;
