chrome.runtime.onMessage.addListener(async event => {
    const data = await chrome.storage.local.get("savedTrails");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (data.savedTrails) {
        chrome.action.setBadgeText({ tabId: tab.id, text: Object.keys(data.savedTrails).length.toString() });
    } else {
        chrome.action.setBadgeText({ tabId: tab.id, text: "" });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status == "complete") {
        chrome.tabs.sendMessage(tabId, {
            event: "tab_updated", data: {
                id: tabId,
                changeInfo,
                tab
            }
        });
    }
}
);