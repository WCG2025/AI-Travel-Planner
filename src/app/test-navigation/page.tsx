'use client';

import React, { useState } from 'react';
import { NavigationQueryDialog } from '@/components/features/navigation/navigation-query-dialog';
import { NavigationQuery, TransitRoute } from '@/types/navigation';

export default function NavigationTestPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [queryResults, setQueryResults] = useState<TransitRoute[]>([]);

  const handleQuerySubmit = async (query: NavigationQuery) => {
    try {
      // 这里我们只是模拟查询，实际应用中会调用API
      console.log('查询参数:', query);
      setQueryResults([]); // 清空之前的结果
      setIsDialogOpen(false);
    } catch (error) {
      console.error('查询失败:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>导航功能测试页面</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setIsDialogOpen(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          打开导航查询对话框
        </button>
      </div>

      {queryResults.length > 0 && (
        <div>
          <h2>查询结果</h2>
          <pre>{JSON.stringify(queryResults, null, 2)}</pre>
        </div>
      )}

      <NavigationQueryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleQuerySubmit}
        initialQuery={{
          origin: '',
          destination: '',
        }}
      />
    </div>
  );
}