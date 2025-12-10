/**
 * UI injection functions for followers/following dialog
 * Handles creating and inserting location badges and fetch buttons
 */

import { findUsernameContainer } from './domHelpers.js';

// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Inject appropriate location UI for a user (badge, empty indicator, or fetch button)
 * @param {string} username - Username (without @)
 * @param {string} userId - User ID
 * @param {Map} profileCache - Cache of profile data
 */
export function injectLocationUIForUser(username, userId, profileCache) {
  const profileInfo = profileCache.get(username);

  if (profileInfo) {
    if (profileInfo.location) {
      // Has cached data with location - display it
      injectLocationBadgeIntoUserRow(username, profileInfo);
    } else {
      // Has cached data but no location - show empty indicator
      injectEmptyLocationIntoUserRow(username);
    }
  } else if (userId) {
    // No cached data - add a button to fetch on demand
    injectLocationButtonIntoUserRow(username, userId, profileCache);
  }
}

/**
 * Inject a fetch location button into a specific user row
 * @param {string} username - Username (without @)
 * @param {string} userId - User ID
 * @param {Map} profileCache - Cache of profile data
 */
function injectLocationButtonIntoUserRow(username, userId, profileCache) {
  // Find all links to this user's profile
  const profileLinks = document.querySelectorAll(`a[href="/@${username}"]`);

  profileLinks.forEach((link) => {
    // Navigate up to find the user row container
    let userRow = link;
    for (let i = 0; i < 10 && userRow; i++) {
      if (userRow.querySelector && userRow.textContent.includes(username)) {
        // Check if we already added a button or badge
        if (userRow.querySelector('.threads-friendships-fetch-btn') ||
            userRow.querySelector('.threads-friendships-location-badge')) {
          return;
        }

        // Find the container to insert button
        const insertTarget = findUsernameContainer(userRow, username);
        if (insertTarget) {
          const btn = createFriendshipsLocationButton(username, userId, profileCache);
          // Find the follow button that is a direct child
          const followButton = Array.from(insertTarget.children).find(child =>
            child.getAttribute && child.getAttribute('role') === 'button'
          );
          if (followButton) {
            insertTarget.insertBefore(btn, followButton);
          } else {
            // No follow button (e.g., own profile) - append to end
            insertTarget.appendChild(btn);
          }
          break;
        }
      }
      userRow = userRow.parentElement;
    }
  });
}

/**
 * Create a fetch location button for friendships list
 * @param {string} username - Username (without @)
 * @param {string} userId - User ID
 * @param {Map} profileCache - Cache of profile data
 * @returns {HTMLButtonElement} - The created button
 */
function createFriendshipsLocationButton(username, userId, profileCache) {
  const btn = document.createElement('button');
  btn.className = 'threads-friendships-fetch-btn';
  btn.textContent = '📍';
  btn.title = `Get location for @${username}`;
  btn.setAttribute('data-username', username);
  btn.setAttribute('data-userid', userId);

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    btn.disabled = true;
    btn.textContent = '⏳';

    // Fetch profile info
    const fetchRequestId = Math.random().toString(36).substring(7);
    const profileInfo = await new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'threads-fetch-response' && event.data?.requestId === fetchRequestId) {
          window.removeEventListener('message', handler);
          resolve(event.data.result);
        }
      };
      window.addEventListener('message', handler);

      window.postMessage({
        type: 'threads-fetch-request',
        requestId: fetchRequestId,
        userId: userId
      }, '*');

      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(null);
      }, 10000);
    });

    if (profileInfo && !profileInfo._rateLimited) {
      profileCache.set(username, profileInfo);

      // Replace button with badge
      if (profileInfo.location) {
        const badge = createLocationBadge(profileInfo);
        btn.parentElement.replaceChild(badge, btn);
      } else {
        // No location data
        btn.textContent = '—';
        btn.title = 'No location available';
        btn.disabled = true;
      }
    } else if (profileInfo?._rateLimited) {
      btn.textContent = '⏸';
      btn.title = 'Rate limited. Try again later.';
      btn.disabled = false;
    } else {
      btn.textContent = '🔄';
      btn.title = 'Failed. Click to retry.';
      btn.disabled = false;
    }
  });

  return btn;
}

/**
 * Inject location badge into a specific user row in followers/following list
 * @param {string} username - Username (without @)
 * @param {Object} profileInfo - Profile information object
 */
function injectLocationBadgeIntoUserRow(username, profileInfo) {
  // Find all links to this user's profile
  const profileLinks = document.querySelectorAll(`a[href="/@${username}"]`);

  profileLinks.forEach(link => {
    // Navigate up to find the user row container
    let userRow = link;
    for (let i = 0; i < 10 && userRow; i++) {
      // Look for the container that has the username
      if (userRow.querySelector && userRow.textContent.includes(username)) {
        // Check if we already added a badge
        if (userRow.querySelector('.threads-friendships-location-badge')) {
          return;
        }

        // Find where to insert the badge
        const insertTarget = findUsernameContainer(userRow, username);
        if (insertTarget) {
          const badge = createLocationBadge(profileInfo);
          // Find the follow button that is a direct child
          const followButton = Array.from(insertTarget.children).find(child =>
            child.getAttribute && child.getAttribute('role') === 'button'
          );
          if (followButton) {
            insertTarget.insertBefore(badge, followButton);
          } else {
            // No follow button (e.g., own profile) - append to end
            insertTarget.appendChild(badge);
          }
          break;
        }
      }
      userRow = userRow.parentElement;
    }
  });
}

/**
 * Inject empty location indicator into a specific user row in followers/following list
 * @param {string} username - Username (without @)
 */
function injectEmptyLocationIntoUserRow(username) {
  // Find all links to this user's profile
  const profileLinks = document.querySelectorAll(`a[href="/@${username}"]`);

  profileLinks.forEach(link => {
    // Navigate up to find the user row container
    let userRow = link;
    for (let i = 0; i < 10 && userRow; i++) {
      // Look for the container that has the username
      if (userRow.querySelector && userRow.textContent.includes(username)) {
        // Check if we already added something
        if (userRow.querySelector('.threads-friendships-location-badge') ||
            userRow.querySelector('.threads-friendships-fetch-btn')) {
          return;
        }

        // Find where to insert the indicator
        const insertTarget = findUsernameContainer(userRow, username);
        if (insertTarget) {
          const emptyIndicator = createEmptyLocationIndicator(username);
          // Find the follow button that is a direct child
          const followButton = Array.from(insertTarget.children).find(child =>
            child.getAttribute && child.getAttribute('role') === 'button'
          );
          if (followButton) {
            insertTarget.insertBefore(emptyIndicator, followButton);
          } else {
            // No follow button (e.g., own profile) - append to end
            insertTarget.appendChild(emptyIndicator);
          }
          break;
        }
      }
      userRow = userRow.parentElement;
    }
  });
}

/**
 * Create an empty location indicator (when cached but no location available)
 * @param {string} username - Username (without @)
 * @returns {HTMLButtonElement} - The created indicator
 */
function createEmptyLocationIndicator(username) {
  const indicator = document.createElement('button');
  indicator.className = 'threads-friendships-fetch-btn'; // Reuse same styling
  indicator.textContent = '➖';
  indicator.title = `No location available for @${username}`;
  indicator.disabled = true;
  indicator.style.cursor = 'default';
  indicator.style.opacity = '0.4';
  return indicator;
}

/**
 * Create a location badge for friendships list
 * @param {Object} profileInfo - Profile information object
 * @returns {HTMLSpanElement} - The created badge
 */
function createLocationBadge(profileInfo) {
  const badge = document.createElement('span');
  badge.className = 'threads-friendships-location-badge';

  const locationText = document.createElement('span');
  locationText.textContent = profileInfo.location;

  badge.appendChild(locationText);

  if (profileInfo.joined) {
    const joinedLabel = browserAPI.i18n.getMessage('joined') || 'Joined';
    badge.title = `${joinedLabel}: ${profileInfo.joined}`;
  }

  return badge;
}
