// src/components/ChatUI.jsx
import React, { useState, useRef, useEffect } from "react";
import { config } from '../config';

export default function ChatUI({ onChatResult }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! Ask me about Subway outlets nearby or specific locations." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState(""); // 存储位置状态消息
  const messagesEndRef = useRef(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 获取用户位置
  const getUserLocation = () => {
    setLocationStatus("Getting your location...");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // 成功回调
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          setLocationStatus("Location found! You can now ask about nearby outlets.");
          
          // 3秒后清除状态消息
          setTimeout(() => setLocationStatus(""), 3000);
        },
        // 错误回调
        (error) => {
          console.error("Error getting location:", error);
          setLocationStatus("Could not get your location. Please try again or search by area name.");
          
          // 3秒后清除状态消息
          setTimeout(() => setLocationStatus(""), 3000);
        },
        // 选项
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationStatus("Geolocation is not supported by this browser.");
      // 3秒后清除状态消息
      setTimeout(() => setLocationStatus(""), 3000);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // 使用config中的API_URL
      const res = await fetch(`${config.API_URL}/chatbot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input.trim(),
          lat: userLocation?.lat,
          lon: userLocation?.lon
        })
      });
      const data = await res.json();

      const assistantMsg = { role: "assistant", content: data.answer };
      setMessages(prev => [...prev, assistantMsg]);

      if (onChatResult) {
        onChatResult(data); // { answer, related_ids, center? ...}
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: "Sorry, I couldn't process your request. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // 清除聊天记录
  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Hello! Ask me about Subway outlets nearby or specific locations." }]);
    // 通知父组件清除地图
    if (onChatResult) {
      onChatResult({ answer: "", related_ids: [], center: [] });
    }
    setUserLocation(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 标题栏 */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-3 px-4 font-medium text-sm flex justify-between items-center shadow-md">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div className="font-semibold">Subway Assistant</div>
          {userLocation ? (
            <span className="ml-2 text-xs bg-green-500 text-white py-1 px-2 rounded-full flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Location active
            </span>
          ) : (
            <button 
              onClick={getUserLocation}
              className="ml-2 text-xs bg-green-900 hover:bg-green-700 text-white py-1 px-2 rounded-full flex items-center transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Enable location
            </button>
          )}
        </div>
        <button 
          onClick={clearChat} 
          className="text-xs bg-green-900 hover:bg-green-700 text-white py-1 px-2 rounded transition-colors duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Clear Chat
        </button>
      </div>
      
      {/* 消息区域 - 使用固定高度和滚动 */}
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {locationStatus && (
          <div className="mb-3 py-2 px-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 shadow-sm">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {locationStatus}
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 7.586V3a1 1 0 10-2 0v4.586l-.293-.293z" />
                    <path d="M3 5a2 2 0 012-2h1a1 1 0 010 2H5v7h2l1 2h4l1-2h2V5h-1a1 1 0 110-2h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                  </svg>
                </div>
              )}
              
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  isUser 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none shadow-md" 
                    : "bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-200"
                }`}
              >
                {msg.content.split('\n').map((line, i) => (
                  <div key={i} className={i > 0 ? "mt-1" : ""}>{line}</div>
                ))}
              </div>
              
              {isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center ml-2 flex-shrink-0 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
        
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 7.586V3a1 1 0 10-2 0v4.586l-.293-.293z" />
                <path d="M3 5a2 2 0 012-2h1a1 1 0 010 2H5v7h2l1 2h4l1-2h2V5h-1a1 1 0 110-2h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
              </svg>
            </div>
            <div className="bg-white text-gray-800 px-4 py-3 rounded-lg rounded-tl-none shadow-sm border border-gray-200">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入区域 */}
      <div className="p-3 bg-white border-t border-gray-200 flex shadow-inner">
        <textarea
          className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-gray-50 text-gray-900"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about Subway outlets..."
          rows="2"
        />
        <button
          className={`bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-4 py-2 rounded-r-md transition-all duration-200 flex items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSend}
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Send
        </button>
      </div>
    </div>
  );
}
