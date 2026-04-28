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
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Typography, Button, Spin, Tag, Empty } from '@douyinfe/semi-ui';
import { IllustrationNoResult, IllustrationNoResultDark } from '@douyinfe/semi-illustrations';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { marked } from 'marked';
import { API, showError } from '../../helpers';


const { Title, Text } = Typography;

const categoryLabels = {
  system: { zh: '系统公告', en: 'System' },
  feature: { zh: '功能更新', en: 'Feature' },
  pricing: { zh: '价格调整', en: 'Pricing' },
  notice: { zh: '通知', en: 'Notice' },
};

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  const isChinese = i18n.language.startsWith('zh');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await API.get('/api/news/' + id);
        const { success, data } = res.data;
        if (success) {
          setNews(data);
          document.title = data.title + ' - AI Gateway';
        } else {
          showError('News not found');
        }
      } catch (error) {
        showError('Failed to load news');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!news) {
    return (
      <div style={{ padding: '40px 20px' }}>
        <Empty
          image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
              darkModeImage={<IllustrationNoResultDark style={{ width: 150, height: 150 }} />}
          description={isChinese ? '新闻不存在' : 'News not found'}
        />
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft size={16} style={{ marginRight: 8 }} />
            {isChinese ? '返回首页' : 'Back to Home'}
          </Button>
        </div>
      </div>
    );
  }

  const categoryLabel = categoryLabels[news.category]?.[isChinese ? 'zh' : 'en'] || news.category;
  const categoryColor = {
    system: 'blue',
    feature: 'green',
    pricing: 'orange',
    notice: 'cyan',
  }[news.category] || 'grey';

  const renderContent = () => {
    if (news.content) {
      const htmlContent = marked.parse(news.content);
      return (
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{
            lineHeight: 1.8,
            fontSize: 15,
          }}
        />
      );
    }
    return <Text type="secondary">{news.summary || ''}</Text>;
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button theme="borderless" icon={<ArrowLeft size={16} />}>
            {isChinese ? '返回首页' : 'Back to Home'}
          </Button>
        </Link>
      </div>

      <Card style={{ marginBottom: 20 }}>
        {news.image && (
          <img
            src={news.image}
            alt={news.title}
            style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8, marginBottom: 20 }}
          />
        )}

        <Title heading={2} style={{ marginBottom: 12 }}>
          {news.title}
        </Title>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <Text type="tertiary">
            {new Date(news.publish_date).toLocaleString(isChinese ? 'zh-CN' : 'en-US')}
          </Text>
          <Tag color={categoryColor} size="large">
            {categoryLabel}
          </Tag>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--semi-color-border)',
            paddingTop: 20,
          }}
        >
          {renderContent()}
        </div>
      </Card>
    </div>
  );
};

export default NewsDetail;
