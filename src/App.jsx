// src/App.jsx
import React, { useState } from "react";
import MapView from "./components/MapView";
import ChatUI from "./components/ChatUI";
import _ from 'lodash';

export default function App() {
  // 存储多店 IDs
  const [selectedIds, setSelectedIds] = useState([]);
  // 是否显示5KM半径
  const [show5kmRadius, setShow5kmRadius] = useState(false);
  // 聊天框是否展开
  const [isChatExpanded, setIsChatExpanded] = useState(true);

  // ChatUI 返回 { related_ids } => setSelectedIds
  const handleChatResult = (data) => {
    if (data.related_ids && data.related_ids.length > 0) {
      setSelectedIds(data.related_ids);  // 多店
    } else {
      setSelectedIds([]);
    }
  };

  // 点击 Clear All
  const clearAll = () => {
    setSelectedIds([]);
  };

  // 切换聊天框展开状态
  const toggleChat = () => {
    setIsChatExpanded(!isChatExpanded);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 overflow-hidden">
      {/* 固定高度的Header */}
      <header className="bg-gray-900 text-white shadow-lg p-4 flex items-center space-x-4 h-16 flex-shrink-0">
        <h1 className="text-2xl font-bold text-green-300 flex-grow">
          Subway Outlets Map
        </h1>
        
        {/* 5KM显示开关 */}
        <button
          className={`px-4 py-2 rounded transition-colors ${
            show5kmRadius
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setShow5kmRadius(!show5kmRadius)}
        >
          {show5kmRadius ? "Hide 5KM Radius" : "Show 5KM Radius"}
        </button>
        
        {/* 清除所有按钮 */}
        <button 
          className="px-4 py-2 bg-red-500 rounded hover:bg-red-600 transition-colors" 
          onClick={clearAll}
        >
          Clear All
        </button>
        
        {/* 聊天框收起/展开按钮 */}
        <button 
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors flex items-center" 
          onClick={toggleChat}
        >
          {isChatExpanded ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Hide Chat
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Show Chat
            </>
          )}
        </button>
      </header>

      {/* 内容区域使用剩余高度，flex-grow */}
      <div className="flex flex-grow overflow-hidden">
        {/* 地图区域，根据聊天框是否展开决定宽度 */}
        <div className={`${isChatExpanded ? 'w-[70%]' : 'w-full'} h-full relative bg-white shadow-inner transition-all duration-300`}>
          <MapView
            selectedIds={selectedIds}
            // 点击Marker => toggle
            onToggleId={(id) => {
              setSelectedIds((prev) => {
                if (prev.includes(id)) {
                  // 如果已选中 => 移除
                  return prev.filter((x) => x !== id);
                } else {
                  // 否则添加
                  return [...prev, id];
                }
              });
            }}
            show5kmRadius={show5kmRadius}
          />
        </div>
        
        {/* 右侧聊天区域，可收起/展开 */}
        <div 
          className={`${isChatExpanded ? 'w-[30%]' : 'w-0'} h-full border-l border-gray-300 shadow-inner flex-shrink-0 transition-all duration-300 overflow-hidden`}
        >
          <ChatUI onChatResult={handleChatResult} />
        </div>
      </div>
    </div>
  );
}
