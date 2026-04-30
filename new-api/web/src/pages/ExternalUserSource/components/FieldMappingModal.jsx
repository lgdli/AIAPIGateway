import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Input, Select, Space, Toast, Popconfirm, Spin } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';
import { API } from '../../../helpers/api';

const localFields = [
  { value: 'username', label: 'Username' },
  { value: 'email', label: 'Email' },
  { value: 'group', label: 'Group' },
  { value: 'display_name', label: 'Display Name' },
  { value: 'role', label: 'Role' },
  { value: 'status', label: 'Status' },
  { value: 'quota', label: 'Quota' },
];

const FieldMappingModal = ({ visible, source, onCancel, onSuccess }) => {
  const [mappings, setMappings] = useState([]);
  const [externalFields, setExternalFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadMappings = async () => {
    if (!source) return;
    setLoading(true);
    try {
      const res = await API.get(`/api/external-user-source/${source.id}/mappings`);
      setMappings(res.data.data || []);
    } catch (err) {
      Toast.error('Failed to load mappings');
    }
    setLoading(false);
  };

  const loadExternalFields = async () => {
    if (!source) return;
    setLoadingFields(true);
    try {
      const res = await API.get(`/api/external-user-source/${source.id}/fields`);
      if (res.data.success) {
        setExternalFields(res.data.data || []);
      } else {
        Toast.error(res.data.error || 'Failed to load fields');
      }
    } catch (err) {
      Toast.error('Failed to load external fields');
    }
    setLoadingFields(false);
  };

  useEffect(() => {
    if (visible) {
      loadMappings();
      loadExternalFields();
    }
  }, [visible, source]);

  const handleAdd = () => {
    setMappings([...mappings, {
      id: Date.now(),
      external_field: '',
      local_field: 'username',
      transform_type: 'direct',
      transform_config: '',
      default_value: '',
    }]);
  };

  const handleDelete = (index) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    setMappings(newMappings);
  };

  const handleChange = (index, field, value) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setMappings(newMappings);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = mappings.map(m => ({
        external_field: m.external_field,
        local_field: m.local_field,
        transform_type: m.transform_type,
        transform_config: m.transform_config,
        default_value: m.default_value,
      }));
      await API.put(`/api/external-user-source/${source.id}/mappings`, { mappings: data });
      Toast.success('Saved');
      onSuccess();
    } catch (err) {
      Toast.error('Save failed');
    }
    setSaving(false);
  };

  const columns = [
    {
      title: 'External Field',
      dataIndex: 'external_field',
      width: 200,
      render: (text, record, index) => (
        loadingFields ? (
          <Spin size="small" />
        ) : (
          <Select
            value={text}
            onChange={(value) => handleChange(index, 'external_field', value)}
            style={{ width: '100%' }}
            placeholder="Select field"
            filter
            showClear
          >
            {externalFields.map(f => (
              <Select.Option key={f} value={f}>{f}</Select.Option>
            ))}
          </Select>
        )
      ),
    },
    {
      title: 'Local Field',
      dataIndex: 'local_field',
      width: 150,
      render: (text, record, index) => (
        <Select
          value={text}
          onChange={(value) => handleChange(index, 'local_field', value)}
          style={{ width: '100%' }}
        >
          {localFields.map(f => (
            <Select.Option key={f.value} value={f.value}>{f.label}</Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Transform',
      dataIndex: 'transform_type',
      width: 120,
      render: (text, record, index) => (
        <Select
          value={text}
          onChange={(value) => handleChange(index, 'transform_type', value)}
          style={{ width: '100%' }}
        >
          <Select.Option value="direct">Direct</Select.Option>
          <Select.Option value="value_map">Value Map</Select.Option>
          <Select.Option value="compute">Compute</Select.Option>
        </Select>
      ),
    },
    {
      title: 'Config',
      dataIndex: 'transform_config',
      width: 250,
      render: (text, record, index) => {
        if (record.transform_type === 'value_map') {
          return (
            <Input
              value={text}
              onChange={(e) => handleChange(index, 'transform_config', e)}
              placeholder='{"teacher":1,"admin":10}'
            />
          );
        } else if (record.transform_type === 'compute') {
          return (
            <Input
              value={text}
              onChange={(e) => handleChange(index, 'transform_config', e)}
              placeholder='${emp_id}_${dept}'
            />
          );
        }
        return '-';
      },
    },
    {
      title: 'Default Value',
      dataIndex: 'default_value',
      width: 150,
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => handleChange(index, 'default_value', e)}
          placeholder="default value"
        />
      ),
    },
    {
      title: '',
      width: 60,
      render: (text, record, index) => (
        <Popconfirm title="Delete?" onConfirm={() => handleDelete(index)}>
          <Button icon={<IconDelete />} type="danger" size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title={`Field Mappings - ${source?.name}`}
      visible={visible}
      onCancel={onCancel}
      style={{ width: 900 }}
      footer={
        <Space>
          <Button type="primary" onClick={handleAdd} icon={<IconPlus />}>Add</Button>
          <Button type="tertiary" onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSave} loading={saving}>Save</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={mappings}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
      {mappings.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
          No mappings. Click "Add" to start.
        </div>
      )}
    </Modal>
  );
};

export default FieldMappingModal;
