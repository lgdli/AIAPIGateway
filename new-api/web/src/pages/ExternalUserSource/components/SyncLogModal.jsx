import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Typography } from '@douyinfe/semi-ui';
import { API } from '../../../helpers/api';

const { Text } = Typography;

const SyncLogModal = ({ visible, source, onCancel }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const loadLogs = async (p = 1) => {
    if (!source) return;
    setLoading(true);
    try {
      const res = await API.get(`/api/external-user-source/${source.id}/logs?page=${p}&page_size=${pageSize}`);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
      setPage(p);
    } catch (err) {
      console.error('Failed to load logs');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      loadLogs(1);
    }
  }, [visible, source]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const columns = [
    {
      title: 'Time',
      dataIndex: 'started_at',
      render: (text, record) => (
        <div>
          <div>{formatTime(record.started_at)}</div>
          <Text type="secondary" size="small">
            Duration: {record.finished_at ? `${record.finished_at - record.started_at}s` : '-'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (text) => (
        <Tag color={text === 'success' ? 'green' : text === 'failed' ? 'red' : 'orange'}>
          {text?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Stats',
      render: (text, record) => (
        <div>
          <span style={{ marginRight: 8, color: 'green' }}>+{record.inserted}</span>
          <span style={{ marginRight: 8, color: 'blue' }}>~{record.updated}</span>
          <span style={{ marginRight: 8, color: 'orange' }}>x{record.disabled}</span>
          {record.errors > 0 && <span style={{ color: 'red' }}>!{record.errors}</span>}
        </div>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'error_details',
      render: (text) => (
        <Text type="secondary" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
          {text || '-'}
        </Text>
      ),
    },
  ];

  return (
    <Modal
      title={`Sync Logs - ${source?.name}`}
      visible={visible}
      onCancel={onCancel}
      style={{ width: 900 }}
      footer={null}
    >
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          currentPage: page,
          pageSize: pageSize,
          total: total,
          onPageChange: (p) => loadLogs(p),
        }}
      />
    </Modal>
  );
};

export default SyncLogModal;
