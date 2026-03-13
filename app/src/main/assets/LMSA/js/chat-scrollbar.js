let messagesElement = null;
let trackElement = null;
let thumbElement = null;
let resizeObserver = null;
let mutationObserver = null;
let scheduledFrame = null;
let dragState = null;

function scheduleUpdate() {
  if (scheduledFrame !== null) {
    cancelAnimationFrame(scheduledFrame);
  }

  scheduledFrame = requestAnimationFrame(() => {
    scheduledFrame = null;
    updateScrollbar();
  });
}

function setTrackVisibility(isVisible) {
  if (!trackElement) {
    return;
  }

  trackElement.classList.toggle('hidden', !isVisible);
  trackElement.classList.toggle('visible', isVisible);
  trackElement.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
}

function updateTrackGeometry() {
  const chatContainer = document.getElementById('chat-container');
  if (!chatContainer || !messagesElement || !trackElement) {
    return 0;
  }

  const topInset = 6;
  const bottomInset = 10;
  const top = messagesElement.offsetTop + topInset;
  const height = Math.max(messagesElement.clientHeight - topInset - bottomInset, 0);

  trackElement.style.top = `${top}px`;
  trackElement.style.height = `${height}px`;
  return height;
}

function updateScrollbar() {
  if (!messagesElement || !trackElement || !thumbElement) {
    return;
  }

  const trackHeight = updateTrackGeometry();
  const isEnabled = messagesElement.classList.contains('show-scrollbar');
  const maxScrollTop = messagesElement.scrollHeight - messagesElement.clientHeight;
  const isScrollable = isEnabled && maxScrollTop > 1 && trackHeight > 0;

  setTrackVisibility(isScrollable);

  if (!isScrollable) {
    thumbElement.style.height = '0px';
    thumbElement.style.transform = 'translateY(0px)';
    return;
  }

  const visibleRatio = messagesElement.clientHeight / messagesElement.scrollHeight;
  const thumbHeight = Math.max(Math.round(trackHeight * visibleRatio), 36);
  const maxThumbOffset = Math.max(trackHeight - thumbHeight, 0);
  const scrollProgress = maxScrollTop > 0 ? messagesElement.scrollTop / maxScrollTop : 0;
  const thumbOffset = maxThumbOffset * scrollProgress;

  thumbElement.style.height = `${thumbHeight}px`;
  thumbElement.style.transform = `translateY(${thumbOffset}px)`;
}

function syncScrollFromPointer(clientY, centerThumb = false) {
  if (!messagesElement || !trackElement || !thumbElement) {
    return;
  }

  const rect = trackElement.getBoundingClientRect();
  const thumbHeight = thumbElement.offsetHeight;
  const maxThumbOffset = Math.max(rect.height - thumbHeight, 0);
  const maxScrollTop = Math.max(messagesElement.scrollHeight - messagesElement.clientHeight, 0);

  if (maxThumbOffset <= 0 || maxScrollTop <= 0) {
    return;
  }

  const rawOffset = centerThumb
    ? clientY - rect.top - thumbHeight / 2
    : clientY - rect.top - (dragState?.pointerOffset ?? 0);
  const thumbOffset = Math.min(Math.max(rawOffset, 0), maxThumbOffset);
  const scrollProgress = thumbOffset / maxThumbOffset;

  messagesElement.scrollTop = scrollProgress * maxScrollTop;
  scheduleUpdate();
}

function handlePointerMove(event) {
  if (!dragState) {
    return;
  }

  event.preventDefault();
  syncScrollFromPointer(event.clientY, false);
}

function stopDragging() {
  if (!dragState || !trackElement) {
    dragState = null;
    return;
  }

  if (dragState.pointerId !== null) {
    trackElement.releasePointerCapture?.(dragState.pointerId);
  }

  dragState = null;
  trackElement.classList.remove('dragging');
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', stopDragging);
  window.removeEventListener('pointercancel', stopDragging);
}

function startDragging(event) {
  if (!trackElement || !thumbElement) {
    return;
  }

  const thumbRect = thumbElement.getBoundingClientRect();
  dragState = {
    pointerId: event.pointerId ?? null,
    pointerOffset: event.clientY - thumbRect.top,
  };

  trackElement.classList.add('dragging');
  if (dragState.pointerId !== null) {
    trackElement.setPointerCapture?.(dragState.pointerId);
  }

  window.addEventListener('pointermove', handlePointerMove, { passive: false });
  window.addEventListener('pointerup', stopDragging, { passive: true });
  window.addEventListener('pointercancel', stopDragging, { passive: true });
}

function initializeObservers() {
  resizeObserver?.disconnect();
  mutationObserver?.disconnect();

  if (typeof ResizeObserver === 'function') {
    resizeObserver = new ResizeObserver(() => {
      scheduleUpdate();
    });
    resizeObserver.observe(messagesElement);
    resizeObserver.observe(document.body);
  }

  mutationObserver = new MutationObserver(() => {
    scheduleUpdate();
  });

  mutationObserver.observe(messagesElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  });
}

function initializePointerHandlers() {
  thumbElement.addEventListener('pointerdown', (event) => {
    if (trackElement.classList.contains('hidden')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    startDragging(event);
  });

  trackElement.addEventListener('pointerdown', (event) => {
    if (event.target === thumbElement || trackElement.classList.contains('hidden')) {
      return;
    }

    event.preventDefault();
    syncScrollFromPointer(event.clientY, true);
  });
}

export function initializeChatScrollbar() {
  messagesElement = document.getElementById('messages');
  trackElement = document.getElementById('chat-scrollbar');
  thumbElement = document.getElementById('chat-scrollbar-thumb');

  if (!messagesElement || !trackElement || !thumbElement) {
    return;
  }

  initializeObservers();
  initializePointerHandlers();

  messagesElement.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('orientationchange', scheduleUpdate, { passive: true });

  scheduleUpdate();
  setTimeout(scheduleUpdate, 300);
  setTimeout(scheduleUpdate, 1000);
}

export function refreshChatScrollbar() {
  scheduleUpdate();
}