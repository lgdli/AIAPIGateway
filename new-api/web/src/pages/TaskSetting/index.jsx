import { useState, useEffect } from 'react';
import { Typography, Card, Button, Table, Toast, Switch } from '@douyinfe/semi-ui';
import { IconRefresh, IconEdit, IconHistory } from '@douyinfe/semi-icons';
import TaskEditModal from './components/TaskEditModal';
import ExecutionHistoryModal from './components/ExecutionHistoryModal';
import { API } from '../../helpers';
import { showError } from '../../helpers/utils';

function TaskSetting() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/cron-task');
      setTasks(res.data);
    } catch (err) {
      showError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const handleToggle = async (task) => {
    try {
      await API.put(`/api/cron-task/${task.id}`, { enabled: !task.enabled });
      Toast.success('Task updated');
      loadTasks();
    } catch (err) {
      showError('Failed to update task');
    }
  };

  const handleTrigger = async (task) => {
    try {
      await API.post(`/api/cron-task/${task.id}/trigger`);
      Toast.success('Task triggered');
    } catch (err) {
      showError('Failed to trigger task');
    }
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setEditModalVisible(true);
  };

  const handleHistory = (task) => {
    setSelectedTask(task);
    setHistoryModalVisible(true);
  };

  const columns = [
    { title: 'Name', dataIndex: 'display_name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'desc' },
    { title: 'Cron', dataIndex: 'cron_expression', key: 'cron' },
    { 
      title: 'Enabled', 
      dataIndex: 'enabled',
      key: 'enabled',
      render: (text, record) => <Switch checked={record.enabled} onChange={() => handleToggle(record)} />
    },
    { 
      title: 'Last Run', 
      dataIndex: 'last_execution',
      key: 'last_run',
      render: (exec) => exec ? new Date(exec.started_at * 1000).toLocaleString() : 'Never'
    },
    { 
      title: 'Status',
      dataIndex: 'last_execution',
      key: 'status',
      render: (exec) => exec?.status || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <div>
          <Button icon={<IconRefresh />} onClick={() => handleTrigger(record)} size="small" style={{marginRight: 4}}>Run</Button>
          <Button icon={<IconEdit />} onClick={() => handleEdit(record)} size="small" style={{marginRight: 4}}>Edit</Button>
          <Button icon={<IconHistory />} onClick={() => handleHistory(record)} size="small">History</Button>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card>
        <Typography.Title heading={3}>Scheduled Tasks</Typography.Title>
        <Table columns={columns} dataSource={tasks} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
      <TaskEditModal visible={editModalVisible} task={selectedTask} onClose={() => { setEditModalVisible(false); loadTasks(); }} />
      <ExecutionHistoryModal visible={historyModalVisible} task={selectedTask} onClose={() => setHistoryModalVisible(false)} />
    </div>
  );
}

export default TaskSetting;
