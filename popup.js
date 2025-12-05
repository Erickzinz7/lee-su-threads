// Popup script for Threads Profile Extractor

// Cross-browser compatibility: use browser.* API if available (Firefox), fallback to chrome.*
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', () => {
  const profileCountEl = document.getElementById('profileCount');
  const sessionCountEl = document.getElementById('sessionCount');
  const profileListEl = document.getElementById('profileList');
  const exportBtn = document.getElementById('exportBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');

  let profiles = {};

  // Load cached profiles
  function loadProfiles() {
    browserAPI.storage.local.get(['profileCache', 'sessionCount']).then((result) => {
      profiles = result.profileCache || {};
      const count = Object.keys(profiles).length;
      const sessionCount = result.sessionCount || 0;

      profileCountEl.textContent = count;
      sessionCountEl.textContent = sessionCount;

      renderProfileList();
    }).catch((err) => {
      console.error('Failed to load profiles:', err);
    });
  }

  // Render the profile list
  function renderProfileList() {
    const entries = Object.entries(profiles);

    if (entries.length === 0) {
      profileListEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">
            No profiles extracted yet.<br>
            Browse Threads to capture profile info.
          </div>
        </div>
      `;
      return;
    }

    // Sort by timestamp (most recent first)
    entries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));

    profileListEl.innerHTML = entries.map(([username, data]) => `
      <div class="profile-item" data-username="${escapeHtml(username)}">
        ${data.profileImage
          ? `<img src="${escapeHtml(data.profileImage)}" class="profile-avatar" alt="${escapeHtml(username)}" />`
          : `<div class="profile-avatar"></div>`
        }
        <div class="profile-info">
          <div class="profile-name">${escapeHtml(data.displayName || username)}</div>
          <div class="profile-meta">
            @${escapeHtml(username)}
            ${data.location ? ` • 📍 ${escapeHtml(data.location)}` : ''}
          </div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    profileListEl.querySelectorAll('.profile-item').forEach(item => {
      item.addEventListener('click', () => {
        const username = item.dataset.username;
        browserAPI.tabs.create({ url: `https://www.threads.com/@${username}` });
      });
    });
  }

  // Export profiles as JSON
  exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(profiles, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `threads-profiles-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);

    showToast('Exported successfully!');
  });

  // Copy to clipboard
  copyBtn.addEventListener('click', async () => {
    const dataStr = JSON.stringify(profiles, null, 2);

    try {
      await navigator.clipboard.writeText(dataStr);
      showToast('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy', true);
    }
  });

  // Clear cache
  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all cached profiles?')) {
      browserAPI.storage.local.set({ profileCache: {}, sessionCount: 0 })
        .then(() => {
          profiles = {};
          loadProfiles();
          showToast('Cache cleared!');
        })
        .catch((err) => {
          console.error('Failed to clear cache:', err);
          showToast('Failed to clear cache', true);
        });
    }
  });

  // Show toast notification
  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      background: ${isError ? '#ef4444' : '#10b981'};
      color: white;
      border-radius: 6px;
      font-size: 13px;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s';
      setTimeout(() => toast.remove(), 200);
    }, 2000);
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // Initial load
  loadProfiles();

  // Listen for updates from content script
  browserAPI.runtime.onMessage.addListener((message) => {
    if (message.type === 'PROFILE_INFO_EXTRACTED') {
      loadProfiles();
    }
  });
});
