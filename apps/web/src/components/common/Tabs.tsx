import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  tabListClassName?: string;
  tabButtonClassName?: string;
  tabContentClassName?: string;
}

const Tabs: React.FC<TabsProps> = React.memo(({
  tabs,
  defaultTabId,
  onTabChange,
  className = '',
  tabListClassName = '',
  tabButtonClassName = '',
  tabContentClassName = ''
}) => {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    onTabChange?.(tabId);
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* タブリスト */}
      <div
        className={`flex gap-2 border-b border-gray-200 overflow-x-auto ${tabListClassName}`}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTabId === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => handleTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm md:text-base font-medium
              whitespace-nowrap border-b-2 transition-colors
              ${activeTabId === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }
              ${tabButtonClassName}
            `}
          >
            {tab.icon && <span className="text-lg">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {activeTab && (
        <div
          id={`panel-${activeTabId}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTabId}`}
          className={`animate-fadeIn ${tabContentClassName}`}
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
});

Tabs.displayName = 'Tabs';

export default Tabs;
