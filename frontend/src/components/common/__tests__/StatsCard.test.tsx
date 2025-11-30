import React from 'react';
import { render, screen } from '@testing-library/react';
import StatsCard from '../StatsCard';

describe('StatsCard', () => {
  it('タイトルと値を表示する', () => {
    render(<StatsCard title="総収益" value="¥1,000,000" />);
    expect(screen.getByText('総収益')).toBeInTheDocument();
    expect(screen.getByText('¥1,000,000')).toBeInTheDocument();
  });

  it('数値型の値を表示する', () => {
    render(<StatsCard title="プロジェクト数" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('アイコンを表示する', () => {
    render(<StatsCard title="総収益" value="¥1,000,000" icon="💰" />);
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('バッジを表示する', () => {
    const { container } = render(
      <StatsCard 
        title="総収益" 
        value="¥1,000,000" 
        badge={{ text: '新規', color: 'blue' }} 
      />
    );
    expect(container.textContent).toContain('新規');
  });

  it('トレンド情報を表示する', () => {
    const { container } = render(
      <StatsCard 
        title="総収益" 
        value="¥1,000,000" 
        trend={{ value: '+15%', isPositive: true }} 
      />
    );
    expect(container.textContent).toContain('+15%');
  });

  it('正のトレンドに上矢印を表示する', () => {
    const { container } = render(
      <StatsCard 
        title="総収益" 
        value="¥1,000,000" 
        trend={{ value: '+15%', isPositive: true }} 
      />
    );
    expect(container.textContent).toContain('↑');
  });

  it('負のトレンドに下矢印を表示する', () => {
    const { container } = render(
      <StatsCard 
        title="総収益" 
        value="¥1,000,000" 
        trend={{ value: '-5%', isPositive: false }} 
      />
    );
    expect(container.textContent).toContain('↓');
  });

  it('正しいバッジカラーを適用する', () => {
    const { container } = render(
      <StatsCard 
        title="ステータス" 
        value="アクティブ" 
        badge={{ text: '確認済み', color: 'green' }} 
      />
    );
    const badge = container.querySelector('.bg-green-100.text-green-700');
    expect(badge).toBeInTheDocument();
  });

  it('正しい正のトレンドカラーを適用する', () => {
    const { container } = render(
      <StatsCard 
        title="総収益" 
        value="¥1,000,000" 
        trend={{ value: '+15%', isPositive: true }} 
      />
    );
    const trendElement = container.querySelector('.text-green-600');
    expect(trendElement).toBeInTheDocument();
  });

  it('正しい負のトレンドカラーを適用する', () => {
    const { container } = render(
      <StatsCard 
        title="総収益" 
        value="¥1,000,000" 
        trend={{ value: '-5%', isPositive: false }} 
      />
    );
    const trendElement = container.querySelector('.text-red-600');
    expect(trendElement).toBeInTheDocument();
  });
});
