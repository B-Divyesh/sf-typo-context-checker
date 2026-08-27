export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message: { type?: string; count?: number }, sender) => {
    if (message.type !== 'CONTEXT_CHECK_COUNT' || !sender.tab?.id) return;
    const count = Math.max(0, message.count ?? 0);
    void chrome.action.setBadgeText({ tabId: sender.tab.id, text: count ? String(count) : '' });
    void chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#9d1c13' });
    void chrome.action.setTitle({
      tabId: sender.tab.id,
      title: count ? `Context Check: ${count} possible ${count === 1 ? 'confusion' : 'confusions'}` : 'Context Check: no confusions found'
    });
  });
});
