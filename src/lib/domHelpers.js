/**
 * DOM helper functions for finding and manipulating Threads UI elements
 */

/**
 * Find the parent container that has both the name section and follow button
 * This is used to locate where to insert location badges/buttons in the followers/following list
 *
 * @param {HTMLElement} container - The container element to search within
 * @param {string} username - The username to find (without @)
 * @returns {HTMLElement|null} - The parent container element or null if not found
 */
export function findUsernameContainer(container, username) {
  // Find the profile link first
  const profileLink = container.querySelector(`a[href="/@${username}"]`);
  if (!profileLink) {
    return null;
  }

  // Navigate up from the profile link to find the container that has a button with role="button"
  // This container will have the username, profile pic, and follow/following button
  let current = profileLink;

  for (let i = 0; i < 15 && current; i++) {
    const parent = current.parentElement;
    if (parent) {
      // Look for any button child (could be "Follow", "Following", "Follow Back", etc.)
      const hasButton = Array.from(parent.children).some(child =>
        child.getAttribute &&
        child.getAttribute('role') === 'button' &&
        child.tagName.toLowerCase() !== 'a' // Exclude link buttons
      );

      if (hasButton) {
        return parent;
      }
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Find the post container element by traversing up the DOM tree
 * Used for identifying where to insert profile badges in the timeline feed
 *
 * @param {HTMLElement} element - Starting element
 * @returns {HTMLElement|null} - The post container element or null if not found
 */
export function findPostContainer(element) {
  let current = element;
  let depth = 0;
  const maxDepth = 20; // Increased for notification pages which have deeper nesting

  while (current && depth < maxDepth) {
    if (current.getAttribute) {
      // Prioritize data-pressable-container (most reliable)
      if (current.getAttribute('data-pressable-container') === 'true') {
        // Verify this container has a profile link (ensures we have the right container)
        const hasProfileLink = current.querySelector('a[href^="/@"]');
        if (hasProfileLink) {
          return current;
        }
        // If no profile link, continue searching upward (might be a nested container)
      }

      // Fallback to ARTICLE tag
      if (current.tagName === 'ARTICLE') {
        return current;
      }
    }

    current = current.parentElement;
    depth++;
  }

  return null;
}

/**
 * Detect which tab is currently active in the followers/following dialog
 * Uses tab position instead of text matching for language-agnosticism
 *
 * @param {NodeList} tabs - List of tab elements with role="tab"
 * @returns {{isFollowers: boolean, isFollowing: boolean}} - Which tab is active
 */
export function detectActiveTab(tabs) {
  let isFollowers = false;
  let isFollowing = false;

  tabs.forEach((tab, index) => {
    if (tab.getAttribute('aria-selected') === 'true') {
      // Use tab position instead of string matching (language-agnostic)
      // First tab (index 0) = Followers
      // Second tab (index 1) = Following
      if (index === 0) {
        isFollowers = true;
      } else if (index === 1) {
        isFollowing = true;
      }
    }
  });

  return { isFollowers, isFollowing };
}

/**
 * Detect if an element is within a user-list context (follower/following rows, activity modal user rows)
 * vs a post timeline context, based on DOM structure
 *
 * User-list rows have a horizontal layout: [username/time/bio] [Follow button]
 * Post timeline/activity feed has a vertical layout: everything stacked
 *
 * @param {HTMLElement} container - The container element (from findPostContainer)
 * @returns {boolean} - True if in user-list context, false if in post context
 */
export function isUserListContext(container) {
  if (!container) return false;

  // User-list rows have a distinctive pattern:
  // The direct children under data-pressable-container > first div are:
  //   1. div.x6s0dn4.x78zum5 (content wrapper - contains username, time, bio)
  //   2. div.x6s0dn4.xqcrz7y.x78zum5 (button wrapper - contains Follow button)
  // These two divs are siblings, and the presence of xqcrz7y indicates user-list layout

  // Look for a div that has both x6s0dn4 and xqcrz7y (button section)
  const buttonSection = container.querySelector(':scope > div > div.x6s0dn4.xqcrz7y');

  if (buttonSection) {
    // Check if button section also has x78zum5 (confirming it's a user-list row)
    const hasCorrectButtonClasses = buttonSection.classList.contains('x78zum5');

    if (hasCorrectButtonClasses) {
      // Verify parent has two children (content + button side-by-side)
      const parent = buttonSection.parentElement;

      if (parent && parent.children.length >= 2) {
        return true;
      }
    }
  }

  return false;
}
