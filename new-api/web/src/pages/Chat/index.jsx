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
import { useTokenKeys } from '../../hooks/chat/useTokenKeys';
import { Spin } from '@douyinfe/semi-ui';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const encodeToBase64 = (str) => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return btoa(str);
  }
};

const ChatPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { keys, serverAddress, isLoading } = useTokenKeys(id);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const buildLink = (key, originalUrl) => {
    if (!serverAddress || !key || !originalUrl) return '';

    let url = originalUrl;

    if (url.includes('{cherryConfig}')) {
      const cherryConfig = {
        id: 'new-api',
        baseUrl: serverAddress,
        apiKey: `sk-${key}`,
      };
      const encodedConfig = encodeURIComponent(
        encodeToBase64(JSON.stringify(cherryConfig)),
      );
      url = url.replaceAll('{cherryConfig}', encodedConfig);
    } else if (url.includes('{aionuiConfig}')) {
      const aionuiConfig = {
        platform: 'new-api',
        baseUrl: serverAddress,
        apiKey: `sk-${key}`,
      };
      const encodedConfig = encodeURIComponent(
        encodeToBase64(JSON.stringify(aionuiConfig)),
      );
      url = url.replaceAll('{aionuiConfig}', encodedConfig);
    } else {
      const encodedAddress = encodeURIComponent(serverAddress);
      url = url.replaceAll('{address}', encodedAddress);
      url = url.replaceAll('{key}', `sk-${key}`);
    }

    return url;
  };

  const isSpecialProtocol = (url) => {
    if (!url) return false;
    return (
      url.startsWith('cherrystudio://') ||
      url.startsWith('aionui://') ||
      url.startsWith('ama://') ||
      url.startsWith('opencat://') ||
      url === 'fluentread' ||
      url === 'ccswitch'
    );
  };

  const isWebUrl = (url) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  useEffect(() => {
    if (isLoading || keys.length === 0 || isRedirecting) return;

    let originalUrl = '';
    const chats = localStorage.getItem('chats');
    if (chats && id) {
      try {
        const chatsArray = JSON.parse(chats);
        if (Array.isArray(chatsArray) && chatsArray[parseInt(id)]) {
          const chatItem = chatsArray[parseInt(id)];
          for (let k in chatItem) {
            originalUrl = chatItem[k];
            break;
          }
        }
      } catch (e) {
        console.error('Failed to parse chats:', e);
      }
    }

    if (!originalUrl) return;

    if (originalUrl === 'fluentread' || originalUrl === 'ccswitch') {
      navigate('/console');
      return;
    }

    if (isSpecialProtocol(originalUrl)) {
      const finalUrl = buildLink(keys[0], originalUrl);
      if (finalUrl) {
        setIsRedirecting(true);
        window.open(finalUrl, '_self');
      }
      return;
    }

    if (isWebUrl(originalUrl)) {
      setIsRedirecting(true);
    }
  }, [isLoading, keys, serverAddress, id, navigate, isRedirecting]);

  const getIframeSrc = () => {
    if (keys.length === 0) return '';

    let originalUrl = '';
    const chats = localStorage.getItem('chats');
    if (chats && id) {
      try {
        const chatsArray = JSON.parse(chats);
        if (Array.isArray(chatsArray) && chatsArray[parseInt(id)]) {
          const chatItem = chatsArray[parseInt(id)];
          for (let k in chatItem) {
            originalUrl = chatItem[k];
            break;
          }
        }
      } catch (e) {
        return '';
      }
    }

    if (!originalUrl || isSpecialProtocol(originalUrl)) {
      return '';
    }

    return buildLink(keys[0], originalUrl);
  };

  const iframeSrc = getIframeSrc();

  if (isLoading || isRedirecting) {
    return (
      <div className='fixed inset-0 w-screen h-screen flex items-center justify-center bg-white/80 z-[1000] mt-[60px]'>
        <div className='flex flex-col items-center'>
          <Spin size='large' spinning={true} tip={null} />
          <span
            className='whitespace-nowrap mt-2 text-center'
            style={{ color: 'var(--semi-color-primary)' }}
          >
            {isRedirecting ? t('正在打开应用...') : t('正在跳转...')}
          </span>
        </div>
      </div>
    );
  }

  if (!iframeSrc) {
    return (
      <div className='fixed inset-0 w-screen h-screen flex items-center justify-center bg-white/80 z-[1000] mt-[60px]'>
        <div className='flex flex-col items-center'>
          <span style={{ color: 'var(--semi-color-text-2)' }}>
            {t('无法加载聊天应用')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={iframeSrc}
      style={{
        width: '100%',
        height: 'calc(100vh - 64px)',
        border: 'none',
        marginTop: '64px',
      }}
      title='Chat Frame'
      allow='camera;microphone'
    />
  );
};

export default ChatPage;
