/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useState } from 'react';
import {
  Button,
  Space,
  Table,
  Typography,
  Empty,
  Modal,
  Tag,
  Switch,
  TextArea,
  Input,
  Select,
  Spin,
  Popconfirm,
} from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { API, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const categoryOptions = [
  { value: 'system', label: '系统公告 (System)' },
  { value: 'feature', label: '功能更新 (Feature)' },
  { value: 'pricing', label: '价格调整 (Pricing)' },
  { value: 'notice', label: '通知 (Notice)' },
];

const statusOptions = [
  { value: 0, label: '草稿' },
  { value: 1, label: '已发布' },
];

const SettingsNews = () => {
  const { t, i18n } = useTranslation();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    image: '',
    category: 'system',
    pinned: false,
    status: 0,
  });

  const isChinese = i18n && i18n.language ? i18n.language.startsWith('zh') : true;

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/news/manage', {
        params: { page: currentPage, page_size: pageSize },
      });
      const { success, data, total: totalCount } = res.data || {};
      if (success) {
        setNewsList(data || []);
        setTotal(totalCount || 0);
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [currentPage, pageSize]);

  const handleOpenModal = (news = null) => {
    if (news) {
      setEditingNews(news);
      setFormData({
        title: news.title || '',
        summary: news.summary || '',
        content: news.content || '',
        image: news.image || '',
        category: news.category || 'system',
        pinned: news.pinned || false,
        status: news.status || 0,
      });
    } else {
      setEditingNews(null);
      setFormData({
        title: '',
        summary: '',
        content: '',
        image: '',
        category: 'system',
        pinned: false,
        status: 0,
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.title.trim()) {
      showError('Title is required');
      return;
    }
    if (!formData.category) {
      showError('Category is required');
      return;
    }

    try {
      if (editingNews) {
        const res = await API.put('/api/news/' + editingNews.id, formData);
        const { success, message } = res.data || {};
        if (success) {
          showSuccess('Updated successfully');
          setModalVisible(false);
          fetchNews();
        } else {
          showError(message || 'Update failed');
        }
      } else {
        const res = await API.post('/api/news', formData);
        const { success, message } = res.data || {};
        if (success) {
          showSuccess('Created successfully');
          setModalVisible(false);
          fetchNews();
        } else {
          showError(message || 'Create failed');
        }
      }
    } catch (error) {
      showError('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await API.delete('/api/news/' + id);
      const { success, message } = res.data || {};
      if (success) {
        showSuccess('Deleted successfully');
        fetchNews();
      } else {
        showError(message || 'Delete failed');
      }
    } catch (error) {
      showError('Delete failed');
    }
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      system: 'blue',
      feature: 'green',
      pricing: 'orange',
      notice: 'cyan',
    };
    return colorMap[category] || 'grey';
  };

  const getCategoryLabel = (category) => {
    const found = categoryOptions.find((o) => o.value === category);
    if (!found) return category;
    return isChinese ? found.label.split(' ')[0] : (found.label.split('(')[1] || '').replace(')', '') || category;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleString(isChinese ? 'zh-CN' : 'en-US');
    } catch (e) {
      return '-';
    }
  };

  const columns = [
    {
      title: t('标题'),
      dataIndex: 'title',
      width: 250,
      render: (text) => (
        <Text style={{ maxWidth: 230, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
          {text || ''}
        </Text>
      ),
    },
    {
      title: t('分类'),
      dataIndex: 'category',
      width: 100,
      render: (category) => (
        <Tag color={getCategoryColor(category)} size="small">
          {getCategoryLabel(category)}
        </Tag>
      ),
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'grey'} size="small">
          {status === 1 ? (isChinese ? '已发布' : 'Published') : (isChinese ? '草稿' : 'Draft')}
        </Tag>
      ),
    },
    {
      title: t('置顶'),
      dataIndex: 'pinned',
      width: 60,
      render: (pinned) => (pinned ? '📌' : '-'),
    },
    {
      title: t('发布时间'),
      dataIndex: 'publish_date',
      width: 150,
      render: (date) => formatDate(date),
    },
    {
      title: t('操作'),
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            theme="borderless"
            icon={<Edit size={16} />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title={isChinese ? '确定删除此新闻？' : 'Delete this news?'}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button theme="borderless" icon={<Trash2 size={16} />} type="danger" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title heading={6}>📰 {isChinese ? '新闻管理' : 'News Management'}</Title>
        <Button icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
          {isChinese ? '新增新闻' : 'Add News'}
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={newsList}
          pagination={{
            currentPage,
            pageSize,
            total,
            onPageChange: (page) => setCurrentPage(page),
            onPageSizeChange: (size) => {
              setPageSize(size);
              setCurrentPage(1);
            },
          }}
          empty={
            <Empty
              image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
              darkModeImage={<IllustrationNoResultDark style={{ width: 150, height: 150 }} />}
              description={isChinese ? '暂无新闻' : 'No news yet'}
              style={{ padding: 30 }}
            />
          }
        />
      </Spin>

      <Modal
        title={editingNews ? (isChinese ? '编辑新闻' : 'Edit News') : (isChinese ? '新增新闻' : 'Add News')}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        style={{ maxWidth: 600 }}
        bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
      >
        <div style={{ padding: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ display: 'block', marginBottom: 4 }}>{isChinese ? '标题' : 'Title'} *</Text>
            <Input
              placeholder={isChinese ? '请输入标题' : 'Enter title'}
              value={formData.title}
              onChange={(value) => setFormData({ ...formData, title: value })}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ display: 'block', marginBottom: 4 }}>{isChinese ? '分类' : 'Category'} *</Text>
            <Select
              optionList={categoryOptions}
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ display: 'block', marginBottom: 4 }}>{isChinese ? '封面图 URL' : 'Cover Image URL'}</Text>
            <Input
              placeholder="https://..."
              value={formData.image}
              onChange={(value) => setFormData({ ...formData, image: value })}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ display: 'block', marginBottom: 4 }}>{isChinese ? '摘要' : 'Summary'}</Text>
            <TextArea
              placeholder={isChinese ? '请输入摘要（可选）' : 'Enter summary (optional)'}
              value={formData.summary}
              onChange={(value) => setFormData({ ...formData, summary: value })}
              maxLength={500}
              showClear
              rows={2}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ display: 'block', marginBottom: 4 }}>{isChinese ? '正文（支持 Markdown）' : 'Content (Markdown supported)'}</Text>
            <TextArea
              placeholder={isChinese ? '请输入正文内容' : 'Enter content'}
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              showClear
              rows={6}
            />
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>{isChinese ? '置顶' : 'Pinned'}</Text>
              <Switch
                checked={formData.pinned}
                onChange={(checked) => setFormData({ ...formData, pinned: checked })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Text style={{ display: 'block', marginBottom: 8 }}>{isChinese ? '状态' : 'Status'} *</Text>
              <Select
                optionList={statusOptions}
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsNews;
