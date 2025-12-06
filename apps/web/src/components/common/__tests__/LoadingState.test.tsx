import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  it('デフォルトメッセージを表示する', () => {
    render(<LoadingState />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('カスタムメッセージを表示する', () => {
    render(<LoadingState message="データを読み込んでいます..." />);
    expect(screen.getByText('データを読み込んでいます...')).toBeInTheDocument();
  });

  it('正しいaria属性を持つ', () => {
    render(<LoadingState />);
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('smサイズのスピナーを表示する', () => {
    const { container } = render(<LoadingState size="sm" />);
    const spinner = container.querySelector('.h-8.w-8');
    expect(spinner).toBeInTheDocument();
  });

  it('mdサイズのスピナーを表示する', () => {
    const { container } = render(<LoadingState size="md" />);
    const spinner = container.querySelector('.h-12.w-12');
    expect(spinner).toBeInTheDocument();
  });

  it('lgサイズのスピナーを表示する', () => {
    const { container } = render(<LoadingState size="lg" />);
    const spinner = container.querySelector('.h-16.w-16');
    expect(spinner).toBeInTheDocument();
  });
});
