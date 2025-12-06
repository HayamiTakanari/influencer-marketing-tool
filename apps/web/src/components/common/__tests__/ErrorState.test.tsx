import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorState from '../ErrorState';

describe('ErrorState', () => {
  it('エラーメッセージを表示する', () => {
    render(<ErrorState message="エラーが発生しました" />);
    expect(screen.getByRole('heading', { name: 'エラーが発生しました' })).toBeInTheDocument();
  });

  it('デフォルトタイトルを表示する', () => {
    render(<ErrorState message="通信エラー" />);
    expect(screen.getByRole('heading', { name: 'エラーが発生しました' })).toBeInTheDocument();
    expect(screen.getByText('通信エラー')).toBeInTheDocument();
  });

  it('カスタムタイトルを表示する', () => {
    render(<ErrorState title="接続エラー" message="サーバーに接続できませんでした" />);
    expect(screen.getByText('接続エラー')).toBeInTheDocument();
    expect(screen.getByText('サーバーに接続できませんでした')).toBeInTheDocument();
  });

  it('再試行ボタンを表示してクリックイベントを発火する', () => {
    const handleRetry = jest.fn();
    render(<ErrorState message="エラーが発生しました" onRetry={handleRetry} />);
    
    const button = screen.getByText('再試行');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('カスタム再試行ラベルを表示する', () => {
    const handleRetry = jest.fn();
    render(
      <ErrorState 
        message="エラーが発生しました" 
        onRetry={handleRetry} 
        retryLabel="もう一度試す" 
      />
    );
    expect(screen.getByText('もう一度試す')).toBeInTheDocument();
  });

  it('onRetryがない場合はボタンを表示しない', () => {
    render(<ErrorState message="エラーが発生しました" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('エラーアイコンを表示する', () => {
    render(<ErrorState message="エラーが発生しました" />);
    expect(screen.getByText('❌')).toBeInTheDocument();
  });
});
