import React, { useState, useEffect } from 'react';
import { Button, Table, Popconfirm, Typography, Tag, Space, Toast } from '@douyinfe/semi-ui';
import { IconPlus, IconEdit, IconDelete, IconRefresh, IconLink, IconSetting, IconHistory } from '@douyinfe/semi-icons';
import { API } from '../../helpers/api';
import SourceFormModal from './components/SourceFormModal';
import FieldMappingModal from './components/FieldMappingModal';
import SyncLogModal from './components/SyncLogModal';

const { Title } = Typography;

const ExternalUserSource = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [mappingVisible, setMappingVisible] = useState(false);
  const [logVisible, setLogVisible] = useState(false);
  const [currentSource, setCurrentSource] = useState(null);

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/external-user-source');
      setSources(res.data.data || []);
    } catch (err) {
      Toast.error('Failed to load sources');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleTest = async (id) => {
    try {
      const res = await API.post(`/api/external-user-source/${id}/test`);
      if (res.data.success) {
        Toast.success('Connection successful');
      } else {
        Toast.error(res.data.error || 'Connection failed');
      }
    } catch (err) {
      Toast.error('Test failed');
    }
  };

  const handleSync = async (id) => {
    try {
      const res = await API.post(`/api/external-user-source/${id}/sync`);
      if (res.data.success) {
        Toast.success(`Sync completed: +${res.data.log.inserted} ~${res.data.log.updated} x${res.data.log.disabled}`);
        loadSources();
      } else {
        Toast.error(res.data.error || 'Sync failed');
      }
    } catch (err) {
      Toast.error('Sync failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/api/external-user-source/${id}`);
      Toast.success('Deleted');
      loadSources();
    } catch (err) {
      Toast.error('Delete failed');
    }
  };

  const handleEdit = (record) => {
    setCurrentSource(record);
    setFormVisible(true);
  };

  const handleMapping = (record) => {
    setCurrentSource(record);
    setMappingVisible(true);
  };

  const handleLog = (record) => {
    setCurrentSource(record);
    setLogVisible(true);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'db_type',
      key: 'db_type',
      render: (text) => <Tag color={text === 'mysql' ? 'blue' : 'green'}>{text?.toUpperCase()}</Tag>,
    },
    {
      title: 'Host',
      dataIndex: 'host',
      key: 'host',
      render: (text, record) => `${text}:${record.port}`,
    },
    {
      title: 'Table',
      dataIndex: 'table_name',
      key: 'table_name',
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled) => (
        <Tag color={enabled === 1 ? 'green' : 'grey'}>
          {enabled === 1 ? 'Enabled' : 'Disabled'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space>
          <Button icon={<IconLink />} size="small" onClick={() => handleTest(record.id)}>Test</Button>
          <Button icon={<IconRefresh />} size="small" onClick={() => handleSync(record.id)}>Sync</Button>
          <Button icon={<IconSetting />} size="small" onClick={() => handleMapping(record)}>Mapping</Button>
          <Button icon={<IconHistory />} size="small" onClick={() => handleLog(record)}>Logs</Button>
          <Button icon={<IconEdit />} size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this source?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<IconDelete />} size="small" type="danger">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title heading={3}>External User Sources</Title>
      <Button
        icon={<IconPlus />}
        style={{ marginBottom: 16 }}
        onClick={() => { setCurrentSource(null); setFormVisible(true); }}
      >
        Add Source
      </Button>
      <Table columns={columns} dataSource={sources} rowKey="id" loading={loading} />
      
      <SourceFormModal
        visible={formVisible}
        source={currentSource}
        onCancel={() => setFormVisible(false)}
        onSuccess={() => { setFormVisible(false); loadSources(); }}
      />
      
      <FieldMappingModal
        visible={mappingVisible}
        source={currentSource}
        onCancel={() => setMappingVisible(false)}
        onSuccess={() => setMappingVisible(false)}
      />
      
      <SyncLogModal
        visible={logVisible}
        source={currentSource}
        onCancel={() => setLogVisible(false)}
      />
    </div>
  );
};

export default ExternalUserSource;
