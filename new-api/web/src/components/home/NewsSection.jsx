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

import React, { useState, useEffect } from 'react';
import { Typography, Empty, Spin } from '@douyinfe/semi-ui';
import { IllustrationNoResult, IllustrationNoResultDark } from '@douyinfe/semi-illustrations';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, showError } from '../../helpers';

const { Text, Title } = Typography;

const categoryLabels = {
  system: { zh: '系统公告', en: 'System' },
  feature: { zh: '功能更新', en: 'Feature' },
  pricing: { zh: '价格调整', en: 'Pricing' },
  notice: { zh: '通知', en: 'Notice' },
};

const categoryIcons = {
  system: '📢',
  feature: '🚀',
  pricing: '💰',
  notice: '🔔',
};

const NewsSection = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const isChinese = i18n && i18n.language ? i18n.language.startsWith('zh') : true;

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/news', {
        params: { limit: 4, offset: 0 },
      });
      const { success, data } = res.data || {};
      if (success) {
        setNews(data || []);
      }
    } catch (error) {
      showError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleItemClick = (id) => {
    navigate('/news/' + id);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(isChinese ? 'zh-CN' : 'en-US');
    } catch (e) {
      return '';
    }
  };

  const styles = {
    container: {
      margin: '40px auto',
      maxWidth: 1200,
      padding: '0 20px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      borderBottom: '2px solid #e8e8e8',
      paddingBottom: 15,
    },
    title: {
      fontSize: 22,
      fontWeight: 600,
      color: '#333',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    more: {
      fontSize: 14,
      color: '#666',
      cursor: 'pointer',
      textDecoration: 'none',
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    item: {
      display: 'flex',
      alignItems: 'flex-start',
      padding: '20px 0',
      borderBottom: '1px dashed #e8e8e8',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    icon: {
      flexShrink: 0,
      width: 60,
      height: 60,
      borderRadius: 8,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 28,
      marginRight: 20,
      overflow: 'hidden',
    },
    iconImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    info: {
      flex: 1,
      minWidth: 0,
    },
    itemTitle: {
      fontSize: 17,
      fontWeight: 600,
      color: '#333',
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    tag: {
      fontSize: 12,
      padding: '2px 8px',
      borderRadius: 4,
      background: '#f0f0f0',
      color: '#666',
    },
    summary: {
      fontSize: 14,
      color: '#666',
      lineHeight: 1.6,
      marginBottom: 8,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    },
    date: {
      fontSize: 12,
      color: '#999',
    },
    empty: {
      padding: 40,
      textAlign: 'center',
    },
  };

  const getCategoryIcon = (category) => {
    return categoryIcons[category] || '📢';
  };

  const getCategoryLabel = (category) => {
    const label = categoryLabels[category];
    return label ? (isChinese ? label.zh : label.en) : category;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          📢 {isChinese ? '通知公告' : 'Announcements'}
        </div>
      </div>

      <Spin spinning={loading}>
        {news.length === 0 ? (
          <div style={styles.empty}>
            <Empty
              image={<IllustrationNoResult style={{ width: 100, height: 100 }} />}
              darkModeImage={<IllustrationNoResultDark style={{ width: 100, height: 100 }} />}
              description={isChinese ? '暂无公告' : 'No announcements yet'}
            />
          </div>
        ) : (
          <ul style={styles.list}>
            {news.map((item) => (
              <li
                key={item.id}
                style={styles.item}
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fafafa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={styles.icon}>
                  {item.image ? (
                    <img src={item.image} alt="" style={styles.iconImage} />
                  ) : (
                    getCategoryIcon(item.category)
                  )}
                </div>
                <div style={styles.info}>
                  <div style={styles.itemTitle}>
                    <span>{item.title}</span>
                    <span style={styles.tag}>{getCategoryLabel(item.category)}</span>
                  </div>
                  <div style={styles.summary}>{item.summary || ''}</div>
                  <div style={styles.date}>{formatDate(item.publish_date)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Spin>
    </div>
  );
};

export default NewsSection;
