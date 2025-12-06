import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal', () => {
  it('開いている時にモーダルを表示する', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="テストモーダル">
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    expect(screen.getByText('テストモーダル')).toBeInTheDocument();
    expect(screen.getByText('モーダルコンテンツ')).toBeInTheDocument();
  });

  it('閉じている時にモーダルを表示しない', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="テストモーダル">
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    expect(screen.queryByText('テストモーダル')).not.toBeInTheDocument();
  });

  it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="テストモーダル">
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    
    const closeButton = screen.getByLabelText('モーダルを閉じる');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('showCloseButtonがfalseの時は閉じるボタンを表示しない', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="テストモーダル" showCloseButton={false}>
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    expect(screen.queryByLabelText('モーダルを閉じる')).not.toBeInTheDocument();
  });

  it('正しいaria属性を持つ', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="テストモーダル">
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('タイトルに正しいIDを持つ', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="テストモーダル">
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    
    const title = screen.getByText('テストモーダル');
    expect(title).toHaveAttribute('id', 'modal-title');
  });

  it('smサイズのモーダルを表示する', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="テストモーダル" size="sm">
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    const modal = container.querySelector('.max-w-sm');
    expect(modal).toBeInTheDocument();
  });

  it('mdサイズのモーダルを表示する', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="テストモーダル" size="md">
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    const modal = container.querySelector('.max-w-md');
    expect(modal).toBeInTheDocument();
  });

  it('lgサイズのモーダルを表示する', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="テストモーダル" size="lg">
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    const modal = container.querySelector('.max-w-lg');
    expect(modal).toBeInTheDocument();
  });

  it('xlサイズのモーダルを表示する', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="テストモーダル" size="xl">
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    const modal = container.querySelector('.max-w-4xl');
    expect(modal).toBeInTheDocument();
  });
});
