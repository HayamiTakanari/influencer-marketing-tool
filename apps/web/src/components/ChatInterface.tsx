import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { getChatList, getMessages, sendMessage, markMessagesAsRead } from '../services/api';
import { Message, Chat } from '../types';

interface ChatInterfaceProps {
  token: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ token }) => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: chatList = [] } = useQuery({
    queryKey: ['chatList'],
    queryFn: getChatList,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedChat?.id],
    queryFn: () => selectedChat ? getMessages(selectedChat.id) : [],
    enabled: !!selectedChat,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ projectId, content }: { projectId: string; content: string }) =>
      sendMessage(projectId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedChat?.id] });
      queryClient.invalidateQueries({ queryKey: ['chatList'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (projectId: string) => markMessagesAsRead(projectId),
  });

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('new-message', (message: Message) => {
      queryClient.setQueryData<Message[]>(
        ['messages', message.projectId],
        (old) => [...(old || []), message]
      );
      
      // Update chat list with new message
      queryClient.invalidateQueries({ queryKey: ['chatList'] });
    });

    newSocket.on('user-typing', ({ userId, projectId }: { userId: string; projectId: string }) => {
      if (projectId === selectedChat?.id) {
        setTypingUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
      }
    });

    newSocket.on('user-stop-typing', ({ userId, projectId }: { userId: string; projectId: string }) => {
      if (projectId === selectedChat?.id) {
        setTypingUsers(prev => prev.filter(id => id !== userId));
      }
    });

    newSocket.on('messages-read', ({ projectId }: { projectId: string }) => {
      if (projectId === selectedChat?.id) {
        queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, selectedChat?.id, queryClient]);

  useEffect(() => {
    if (selectedChat && socket) {
      socket.emit('join-project', selectedChat.id);
      markAsReadMutation.mutate(selectedChat.id);
    }
  }, [selectedChat, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;

    const content = messageInput.trim();
    setMessageInput('');

    // Send via API
    sendMessageMutation.mutate({
      projectId: selectedChat.id,
      content,
    });

    // Send via socket for real-time
    if (socket) {
      socket.emit('send-message', {
        projectId: selectedChat.id,
        content,
      });
    }
  };

  const handleTyping = (value: string) => {
    setMessageInput(value);

    if (socket && selectedChat) {
      if (value.trim() && !isTyping) {
        setIsTyping(true);
        socket.emit('typing-start', selectedChat.id);
      } else if (!value.trim() && isTyping) {
        setIsTyping(false);
        socket.emit('typing-stop', selectedChat.id);
      }
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessageInput(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat List */}
      <div className="w-1/3 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">チャット</h2>
        </div>
        <div className="overflow-y-auto">
          {chatList.map((chat: any) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChat?.id === chat.id}
              onClick={() => setSelectedChat(chat)}
            />
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-600">
                    {selectedChat.title.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedChat.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedChat.matchedInfluencer?.displayName || selectedChat.client?.companyName}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message: any) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>入力中...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="メッセージを入力..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={1}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    😊
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    送信
                  </button>
                </div>
              </div>
              
              {showEmojiPicker && (
                <div className="absolute bottom-20 right-4 z-10">
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                チャットを選択してください
              </h3>
              <p className="text-gray-600">
                左のリストからチャットを選択してメッセージを開始しましょう
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatListItem: React.FC<{
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}> = ({ chat, isSelected, onClick }) => {
  const lastMessage = chat.messages?.[0];

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-gray-600">
            {chat.title.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {chat.title}
            </h4>
            {lastMessage && (
              <span className="text-xs text-gray-500">
                {format(new Date(lastMessage.createdAt), 'MM/dd HH:mm', { locale: ja })}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-600 truncate">
              {lastMessage?.content || 'メッセージがありません'}
            </p>
            {chat.unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
                {chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isOwn = message.sender.role === "COMPANY"; // Adjust based on current user

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-900'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
          {format(new Date(message.createdAt), 'HH:mm', { locale: ja })}
          {message.isRead && isOwn && <span className="ml-1">✓</span>}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;