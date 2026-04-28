import { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Button } from '@douyinfe/semi-ui';
import { API } from '../../../helpers';
import { showError } from '../../../helpers/utils';

function TaskEditModal({ visible, task, onClose }) {
  const [form, setForm] = useState({ cron_expression: '', timeout_seconds: 300 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        cron_expression: task.cron_expression,
        timeout_seconds: task.timeout_seconds
      });
    }
  }, [task]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await API.put(`/api/cron-task/${task.id}`, form);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Task" visible={visible} onCancel={onClose} footer={null}>
      <Form initValues={form} onValueChange={setForm}>
        <Form.Input field="cron_expression" label="Cron Expression" placeholder="0 * * * *" />
        <Form.InputNumber field="timeout_seconds" label="Timeout (seconds)" min={10} max={3600} />
      </Form>
      <div style={{ textAlign: 'right', marginTop: 20 }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>Cancel</Button>
        <Button type="primary" onClick={handleSubmit} loading={loading}>Save</Button>
      </div>
    </Modal>
  );
}

export default TaskEditModal;
