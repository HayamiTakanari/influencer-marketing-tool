import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('タイトルを表示する', () => {
    render(<EmptyState title="データがありません" />);
    expect(screen.getByText('データがありません')).toBeInTheDocument();
  });

  it('デフォルトアイコンを表示する', () => {
    render(<EmptyState title="空です" />);
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('カスタムアイコンを表示する', () => {
    render(<EmptyState icon="🔍" title="検索結果がありません" />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('説明文を表示する', () => {
    render(
      <EmptyState 
        title="データがありません" 
        description="新しいデータを追加してください。" 
      />
    );
    expect(screen.getByText('新しいデータを追加してください。')).toBeInTheDocument();
  });

  it('アクションボタンを表示してクリックイベントを発火する', () => {
    const handleAction = jest.fn();
    render(
      <EmptyState 
        title="データがありません" 
        actionLabel="新規作成" 
        onAction={handleAction} 
      />
    );
    
    const button = screen.getByText('新規作成');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('アクションラベルがない場合はボタンを表示しない', () => {
    render(<EmptyState title="データがありません" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('正しいaria属性を持つ', () => {
    render(<EmptyState title="空です" />);
    const container = screen.getByRole('region');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-label', '空の状態');
  });
});
