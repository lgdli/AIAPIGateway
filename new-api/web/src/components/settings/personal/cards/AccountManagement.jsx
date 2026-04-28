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

import React from 'react';
import {
  Button,
  Card,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IconLock,
} from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

const AccountManagement = ({
  t,
  setShowChangePasswordModal,
}) => {
  return (
    <Card className='!rounded-xl overflow-hidden'>
      <div className='p-4 border-b border-gray-100 dark:border-gray-700'>
        <div className='flex items-center gap-2'>
          <IconLock size='extra-large' className='text-gray-600 dark:text-gray-300' />
          <div>
            <Title heading={6} className='!mb-0'>
              {t('密码管理')}
            </Title>
            <div className='text-xs text-gray-600 dark:text-gray-400'>
              {t('定期更改密码可以提高账户安全性')}
            </div>
          </div>
        </div>
      </div>

      <div className='p-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div className='flex items-start w-full sm:w-auto'>
            <div className='w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-4 flex-shrink-0'>
              <IconLock size='large' className='text-slate-600 dark:text-slate-300' />
            </div>
            <div>
              <Title heading={6} className='mb-1'>
                {t('修改密码')}
              </Title>
              <Text type='tertiary' className='text-sm'>
                {t('定期更改密码可以提高账户安全性')}
              </Text>
            </div>
          </div>
          <Button
            type='primary'
            theme='solid'
            onClick={() => setShowChangePasswordModal(true)}
            className='!bg-slate-600 hover:!bg-slate-700 w-full sm:w-auto'
            icon={<IconLock />}
          >
            {t('修改密码')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AccountManagement;
