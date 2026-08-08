// frontend/src/components/common/ActionMenuPortal.jsx
// Portal-based contextual action menu.
//
// Renders the menu into document.body via React portal so it escapes any
// overflow-hidden / overflow-x-auto / scroll container that would clip an
// absolutely-positioned dropdown inside a table or card.
//
// Positioning is viewport-aware (uses getBoundingClientRect of the trigger):
//   - Vertical:   opens downward when there is room, otherwise upward.
//   - Horizontal: aligns to the trigger's trailing edge (works for LTR and
//                 RTL), clamped so the menu never leaves the viewport.
//   - Closes on:  click outside, Escape, scroll of any container, or resize.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const VIEWPORT_MARGIN = 8;
const GAP = 6;

const ActionMenuPortal = ({
  triggerRef,
  isOpen,
  onClose,
  children,
  align = 'end',
  preferred = 'down',
  className = '',
  style = {},
}) => {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, ready: false });

  const reposition = () => {
    const trigger = triggerRef?.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuHeight = menu.offsetHeight || 0;
    const menuWidth = menu.offsetWidth || 0;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // ---- Vertical: prefer given direction, flip when there is no room ----
    const spaceBelow = vh - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const openDown =
      preferred === 'down'
        ? spaceBelow >= menuHeight + GAP + VIEWPORT_MARGIN
        : spaceAbove >= menuHeight + GAP + VIEWPORT_MARGIN;

    let top = openDown
      ? triggerRect.bottom + GAP
      : triggerRect.top - menuHeight - GAP;

    if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;
    if (top + menuHeight + VIEWPORT_MARGIN > vh) {
      top = vh - menuHeight - VIEWPORT_MARGIN;
    }
    if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;

    // ---- Horizontal: align trailing edge to trigger, then clamp ----
    let left = align === 'start' ? triggerRect.left : triggerRect.right - menuWidth;

    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
    if (left + menuWidth + VIEWPORT_MARGIN > vw) {
      left = vw - menuWidth - VIEWPORT_MARGIN;
    }
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

    setPos({ top, left, ready: true });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    // First paint for a real measurement, then correct in a second frame so
    // the re-measured height reflects actual content before positioning.
    reposition();
    const raf = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, triggerRef, align, preferred]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      const trigger = triggerRef.current;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !(trigger && trigger.contains(e.target))
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    // Scroll and resize close the menu so it is never left detached from
    // its trigger at a stale viewport position.
    const closeOnLayoutChange = () => onClose();

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', closeOnLayoutChange);
    window.addEventListener('scroll', closeOnLayoutChange, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', closeOnLayoutChange);
      window.removeEventListener('scroll', closeOnLayoutChange, true);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 40,
        visibility: pos.ready ? 'visible' : 'hidden',
        ...style,
      }}
      className={className}
    >
      {children}
    </div>,
    document.body
  );
};

export default ActionMenuPortal;
