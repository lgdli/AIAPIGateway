import { useState, useEffect } from 'react';
import { Modal, Table, Tag } from '@douyinfe/semi-ui';
import { API } from '../../../helpers';
import { showError } from '../../../helpers/utils';

function ExecutionHistoryModal({ visible, task, onClose }) {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadExecutions = async (p = 1) => {
    if (!task) return;
    setLoading(true);
    try {
      const res = await API.get(`/api/cron-task/${task.id}/executions?page=${p}&page_size=10`);
      setExecutions(res.data.data || []);
      setTotal(res.data.total || 0);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) loadExecutions(1);
  }, [visible, task]);

  const columns = [
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'success' ? 'green' : s === 'failed' ? 'red' : 'blue'}>{s}</Tag> },
    { title: 'Started', dataIndex: 'started_at', key: 'started', render: (t) => new Date(t * 1000).toLocaleString() },
    { title: 'Duration (ms)', dataIndex: 'duration_ms', key: 'duration' },
    { title: 'Trigger', dataIndex: 'triggered_by', key: 'trigger' },
    { title: 'Result', dataIndex: 'result_message', key: 'result' }
  ];

  return (
    <Modal title={`Execution History - ${task?.display_name || ''}`} visible={visible} onCancel={onClose} footer={null} width={800}>
      <Table 
        columns={columns} 
        dataSource={executions} 
        rowKey="id" 
        loading={loading}
        pagination={{ currentPage: page, total, pageSize: 10, onPageChange: loadExecutions }}
      />
    </Modal>
  );
}

export default ExecutionHistoryModal;
