'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { clientDb } from '../../lib/firebase-client';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp
} from 'firebase/firestore';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Home, 
  MessageSquare, 
  Users, 
  Bot, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  Moon, 
  Sun,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  Check,
  X,
  Archive,
  Bell,
  UserPlus,
  TrendingUp,
  ChevronLeft,
  Menu,
  Navigation
} from 'lucide-react';

interface Chat {
  id: string;
  userEmail: string;
  userName: string;
  lastMessage?: string;
  lastActivity: any;
  unreadCount?: number;
  status?: string;
  type?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  senderName: string;
  timestamp: any;
  time: string;
}

const TalexusAIHub = () => {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userTyping, setUserTyping] = useState(false);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Resizable panels
  const [sidebarWidth, setSidebarWidth] = useState(264);
  const [conversationWidth, setConversationWidth] = useState(450);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingConversation, setIsResizingConversation] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Resize functionality for sidebar
  const handleSidebarMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizingSidebar(true);
    e.preventDefault();
  }, []);

  const handleSidebarMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingSidebar) return;
    e.preventDefault();
    const newWidth = Math.max(60, Math.min(400, e.clientX));
    setSidebarWidth(newWidth);
  }, [isResizingSidebar]);

  const handleSidebarMouseUp = useCallback(() => {
    setIsResizingSidebar(false);
  }, []);

  // Resize functionality for conversation panel
  const handleConversationMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizingConversation(true);
    e.preventDefault();
  }, []);

  const handleConversationMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingConversation) return;
    e.preventDefault();
    const newWidth = Math.max(350, Math.min(700, e.clientX - sidebarWidth));
    setConversationWidth(newWidth);
  }, [isResizingConversation, sidebarWidth]);

  const handleConversationMouseUp = useCallback(() => {
    setIsResizingConversation(false);
  }, []);

  useEffect(() => {
    if (isResizingSidebar) {
      document.addEventListener('mousemove', handleSidebarMouseMove);
      document.addEventListener('mouseup', handleSidebarMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleSidebarMouseMove);
        document.removeEventListener('mouseup', handleSidebarMouseUp);
      };
    }
  }, [isResizingSidebar, handleSidebarMouseMove, handleSidebarMouseUp]);

  useEffect(() => {
    if (isResizingConversation) {
      document.addEventListener('mousemove', handleConversationMouseMove);
      document.addEventListener('mouseup', handleConversationMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleConversationMouseMove);
        document.removeEventListener('mouseup', handleConversationMouseUp);
      };
    }
  }, [isResizingConversation, handleConversationMouseMove, handleConversationMouseUp]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'now';
    
    // Handle Firebase Timestamp
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return 'now';
    }
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const handleTyping = () => {
    if (selectedConversation === null || !chats[selectedConversation]) return;
    
    const chatId = chats[selectedConversation].id;
    updateDoc(doc(clientDb, 'chats', chatId), {
      adminTyping: true
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateDoc(doc(clientDb, 'chats', chatId), {
        adminTyping: false
      });
    }, 1000);
  };

  const sendMessage = async () => {
    const messageText = message.trim();
    if (!messageText || selectedConversation === null || !chats[selectedConversation]) return;

    const chatId = chats[selectedConversation].id;
    setMessage('');
    
    try {
      await addDoc(collection(clientDb, 'chats', chatId, 'messages'), {
        text: messageText,
        sender: 'admin',
        senderName: 'Talexus AI',
        senderEmail: 'admin@talexus.ai',
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(clientDb, 'chats', chatId), {
        lastActivity: serverTimestamp(),
        lastMessage: messageText,
        adminTyping: false
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filterConversations = () => {
    let filtered = chats;
    
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch(selectedTab) {
      case 'unread':
        return filtered.filter(c => c.type === 'unread' || (c.unreadCount && c.unreadCount > 0));
      case 'unassigned':
        return filtered.filter(c => c.type === 'unassigned');
      case 'archived':
        return filtered.filter(c => c.type === 'archived');
      default:
        return filtered;
    }
  };

  // Listen to chats from Firebase
  useEffect(() => {
    const chatsRef = collection(clientDb, 'chats');
    const q = query(chatsRef, orderBy('lastActivity', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📱 TalexusHub: Firebase snapshot received:', snapshot.docs.length, 'chats');
      const chatList = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        console.log('📱 TalexusHub: Chat data:', data);
        return {
          id: doc.id,
          userEmail: data.userEmail,
          userName: data.userName || 'Anonymous User',
          lastMessage: data.lastMessage || '',
          lastActivity: data.lastActivity,
          unreadCount: data.unreadCount || undefined,
          status: data.status || 'online',
          type: data.unreadCount > 0 ? 'unread' : 'unassigned'
        };
      });
      console.log('📱 TalexusHub: Setting chats:', chatList);
      setChats(chatList);
    }, (error) => {
      console.error('📱 TalexusHub: Firebase error:', error);
    });

    return () => unsubscribe();
  }, []);

  // Listen to messages for selected chat
  useEffect(() => {
    if (selectedConversation === null || !chats[selectedConversation]) return;

    const chatId = chats[selectedConversation].id;
    const messagesRef = collection(clientDb, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate();
        return {
          id: doc.id,
          text: data.text,
          sender: data.sender,
          senderName: data.senderName || 'Unknown',
          timestamp: data.timestamp,
          time: timestamp ? formatTime(timestamp) : 'now'
        };
      });
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [selectedConversation, chats]);

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', active: false },
    { icon: MessageSquare, label: 'Conversations', active: true, badge: chats.length > 0 ? chats.length.toString() : undefined },
    { icon: Users, label: 'Customization', active: false },
    { icon: Bot, label: 'Chatbot', active: false },
    { icon: BarChart3, label: 'User Engagements', active: false },
  ];

  const selectedChat = selectedConversation !== null ? chats[selectedConversation] : null;
  const selectedChatMessages = selectedChat ? messages : [];

  // Prevent hydration issues by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`} style={{ backgroundColor: '#0F172A' }}>
      <style>{`
        .dark {
          color-scheme: dark;
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 3px;
        }
        
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #475569;
        }
        
        .status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border: 2px solid white;
          border-radius: 50%;
        }
        
        .dark .status-dot {
          border-color: #1e293b;
        }
      `}</style>

      {/* Left Sidebar */}
      <div 
        className={`${sidebarCollapsed ? 'w-20' : ''} flex flex-col`}
        style={{ 
          width: sidebarCollapsed ? '80px' : `${sidebarWidth}px`,
          backgroundColor: '#0F172A',
          transition: isResizingSidebar ? 'none' : 'width 0.1s ease'
        }}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-blue-700 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div 
                className={`w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md ${sidebarCollapsed ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                onClick={sidebarCollapsed ? () => setSidebarCollapsed(false) : undefined}
              >
                <span className="text-white font-bold text-sm">T</span>
              </div>
{!sidebarCollapsed && sidebarWidth > 220 && (
                <div>
                  <h1 className="text-white font-bold text-sm">TALEXUS AI HUB</h1>
                  <p className="text-blue-200 dark:text-gray-400 text-xs">Admin Dashboard</p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && sidebarWidth > 80 && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-white hover:bg-blue-700 dark:hover:bg-gray-800 p-1 rounded"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
className={`w-full flex items-center ${sidebarCollapsed || sidebarWidth <= 220 ? 'justify-center' : 'justify-between'} ${sidebarCollapsed || sidebarWidth <= 220 ? 'px-2 py-2' : 'px-4 py-3'} mb-1 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-blue-700 dark:bg-gray-800 text-white' 
                  : 'text-blue-200 dark:text-gray-400 hover:bg-blue-700 dark:hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                {!sidebarCollapsed && sidebarWidth > 220 && <span className="text-sm font-medium">{item.label}</span>}
              </div>
              {!sidebarCollapsed && sidebarWidth > 220 && item.badge && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-blue-700 dark:border-gray-800">
          <div className={`space-y-2 ${sidebarCollapsed || sidebarWidth <= 220 ? 'flex flex-col items-center' : ''}`}>
            <button className={`${sidebarCollapsed || sidebarWidth <= 220 ? 'p-2 rounded-lg hover:bg-blue-700 flex items-center justify-center' : 'w-full flex items-center space-x-3 px-4 py-2'} text-blue-200 dark:text-gray-400 hover:text-white transition-colors`}>
              <HelpCircle className="w-5 h-5" />
              {!sidebarCollapsed && sidebarWidth > 220 && <span className="text-sm">Support</span>}
            </button>
            <button className={`${sidebarCollapsed || sidebarWidth <= 220 ? 'p-2 rounded-lg hover:bg-blue-700 flex items-center justify-center' : 'w-full flex items-center space-x-3 px-4 py-2'} text-blue-200 dark:text-gray-400 hover:text-white transition-colors`}>
              <Settings className="w-5 h-5" />
              {!sidebarCollapsed && sidebarWidth > 220 && <span className="text-sm">Settings</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar resize handle */}
      {!sidebarCollapsed && (
        <div 
          className={`w-px cursor-col-resize bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors ${
            isResizingSidebar ? 'bg-gray-400 dark:bg-gray-500' : ''
          }`}
          onMouseDown={handleSidebarMouseDown}
        />
      )}

      {/* Conversations List */}
      <div 
        className="border-r border-blue-700 dark:border-gray-700 flex flex-col"
        style={{ 
          width: `${conversationWidth}px`,
          backgroundColor: '#0F172A'
        }}
      >
        {/* Header */}
        <div className="p-4 bg-blue-600 dark:bg-gray-900 border-b border-blue-700 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">CONVERSATIONS</h2>
          </div>
          

          {/* Filter Tabs */}
          <div className="flex bg-blue-700 dark:bg-gray-800 rounded-xl p-1 gap-1 w-full overflow-hidden">
            {['all', 'unread', 'unassigned', 'archived'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex-1 px-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis ${
                  selectedTab === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-blue-200 hover:text-white hover:bg-blue-600'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filterConversations().map((conversation, index) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(index)}
              className={`px-4 py-4 mb-1 mx-2 rounded-lg cursor-pointer transition-colors ${
                selectedConversation === index 
                  ? 'bg-blue-700 dark:bg-gray-800 text-white' 
                  : 'text-blue-200 dark:text-gray-400 hover:bg-blue-700 dark:hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                    {conversation.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className={`status-dot ${
                    conversation.status === 'online' ? 'bg-green-500' : 
                    conversation.status === 'away' ? 'bg-yellow-500' : 
                    'bg-gray-400'
                  }`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`font-medium text-sm truncate ${
                      selectedConversation === index ? 'text-white' : 'text-white'
                    }`}>
                      {conversation.userName}
                    </h3>
                    <span className={`text-xs ml-2 flex-shrink-0 ${
                      selectedConversation === index ? 'text-white' : 'text-white'
                    }`}>
                      {formatTime(conversation.lastActivity)}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${
                    selectedConversation === index ? 'text-white' : 'text-white'
                  }`}>
                    {conversation.lastMessage || conversation.userEmail}
                  </p>
                </div>

                {conversation.unreadCount && conversation.unreadCount > 0 && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs rounded-full">
                      {conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {chats.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-700 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-200" />
              </div>
              <p className="text-white font-medium">No conversations yet</p>
              <p className="text-blue-200 text-sm mt-1">Chats will appear here when users start conversations</p>
            </div>
          )}
        </div>
      </div>

      {/* Conversation resize handle */}
      <div 
        className={`w-px cursor-col-resize bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors ${
          isResizingConversation ? 'bg-gray-400 dark:bg-gray-500' : ''
        }`}
        onMouseDown={handleConversationMouseDown}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: '#0F172A' }}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-blue-600 dark:bg-gray-900 border-b border-blue-700 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold">
                      {selectedChat.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className={`status-dot ${
                      selectedChat.status === 'online' ? 'bg-green-500' : 
                      selectedChat.status === 'away' ? 'bg-yellow-500' : 
                      'bg-gray-400'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{selectedChat.userName}</h3>
                    <p className="text-sm text-green-400">● {selectedChat.status || 'online'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                  <button className="p-2 text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors">
                    <UserPlus className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesAreaRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin"
              style={{ backgroundColor: '#0F172A' }}
            >
              {selectedChatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-lg ${msg.sender === 'admin' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {msg.sender === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {selectedChat.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                    
                    <div className={`group relative ${msg.sender === 'admin' ? 'bg-blue-700 text-white' : 'bg-blue-300 text-blue-900'} rounded-2xl px-4 py-3 shadow-sm`}>
                      <p className="text-sm">{msg.text}</p>
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${msg.sender === 'admin' ? 'text-blue-200' : 'text-blue-700'}`}>
                        <span className="text-xs">{msg.time}</span>
                        {msg.sender === 'admin' && (
                          <Check className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {userTyping && (
                <div className="flex justify-start">
                  <div className="flex items-end space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {selectedChat.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="bg-blue-300 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-xs text-blue-700 ml-2">typing...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-blue-600 dark:bg-gray-900 border-t border-blue-700 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <button className="p-3 text-teal-500 hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-all">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && message.trim()) {
                        sendMessage();
                      }
                    }}
                    className="w-full px-6 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:border-teal-500 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.1)] focus:bg-white dark:focus:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    style={{
                      boxShadow: message ? '0 0 20px rgba(20, 184, 166, 0.15)' : undefined
                    }}
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-500 hover:text-teal-400 transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                
                <button 
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    message.trim() 
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:shadow-[0_0_25px_rgba(20,184,166,0.6)] hover:from-teal-400 hover:to-cyan-400' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!message.trim()}
                  onClick={sendMessage}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#0F172A' }}>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-200" />
              </div>
              <h3 className="font-semibold text-white mb-2">Select a conversation</h3>
              <p className="text-blue-200">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default TalexusAIHub;
