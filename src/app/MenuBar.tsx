import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface MenuItem {
  id: string;
  label?: string;
  /** A thin divider line (no label). */
  separator?: boolean;
  /** A non-clickable caption inside the menu. */
  heading?: boolean;
  disabled?: boolean;
  /** Marks the entry that is active right now (e.g. the lesson you are on). */
  current?: boolean;
  /** Opens in a new tab instead of calling onSelect. */
  href?: string;
  onSelect?: () => void;
}

export interface MenuDef {
  id: string;
  label: string;
  items: MenuItem[];
  /** Which edge the dropdown lines up with (use 'right' for menus near the right side). */
  align?: 'left' | 'right';
}

const ITEM_SELECTOR = '[role="menuitem"]:not(:disabled):not([aria-disabled="true"])';

/**
 * Desktop-style menu bar. Click (or Enter / Down arrow) opens a menu; arrow keys move around;
 * Left/Right switch menus; Escape closes. Closes when you click elsewhere.
 */
export function MenuBar({ brand, menus }: { brand: string; menus: MenuDef[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const focusFirstOnOpen = useRef(false);

  useEffect(() => {
    if (!openId) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenId(null);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenId(null);
        triggers.current[openId]?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openId]);

  // After a keyboard-open, put focus on the first usable item.
  useEffect(() => {
    if (openId && focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      rootRef.current?.querySelector<HTMLElement>(`[data-menu="${openId}"] ${ITEM_SELECTOR}`)?.focus();
    }
  }, [openId]);

  const openMenu = (id: string, viaKeyboard: boolean) => {
    focusFirstOnOpen.current = viaKeyboard;
    setOpenId(id);
  };

  const neighbour = (id: string, step: 1 | -1) => {
    const i = menus.findIndex((m) => m.id === id);
    return menus[(i + step + menus.length) % menus.length].id;
  };

  const onTriggerKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenu(id, true);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = neighbour(id, e.key === 'ArrowRight' ? 1 : -1);
      triggers.current[next]?.focus();
      if (openId) openMenu(next, false);
    }
  };

  const onMenuKeyDown = (e: KeyboardEvent, id: string) => {
    const items = [...(rootRef.current?.querySelectorAll<HTMLElement>(`[data-menu="${id}"] ${ITEM_SELECTOR}`) ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      e.preventDefault();
      items[(to + items.length) % items.length]?.focus();
    };
    if (e.key === 'ArrowDown') move(at + 1);
    else if (e.key === 'ArrowUp') move(at - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(items.length - 1);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = neighbour(id, e.key === 'ArrowRight' ? 1 : -1);
      openMenu(next, true);
      triggers.current[next]?.focus();
    } else if (e.key === 'Tab') setOpenId(null);
  };

  return (
    <div className="menubar" ref={rootRef}>
      <span className="menubar-brand">{brand}</span>
      <div className="menubar-menus" role="menubar" aria-label="Main menu">
        {menus.map((menu) => {
          const open = openId === menu.id;
          return (
            <div className="menu" key={menu.id}>
              <button
                ref={(el) => { triggers.current[menu.id] = el; }}
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={open}
                className={`menu-trigger${open ? ' open' : ''}`}
                onClick={() => (open ? setOpenId(null) : openMenu(menu.id, false))}
                onMouseEnter={() => { if (openId && !open) openMenu(menu.id, false); }}
                onKeyDown={(e) => onTriggerKeyDown(e, menu.id)}
              >
                {menu.label} <span aria-hidden="true">▾</span>
              </button>
              {open && (
                <div
                  className={`menu-panel${menu.align === 'right' ? ' right' : ''}`}
                  role="menu"
                  aria-label={menu.label}
                  data-menu={menu.id}
                  onKeyDown={(e) => onMenuKeyDown(e, menu.id)}
                >
                  {menu.items.map((item) => {
                    if (item.separator) return <div key={item.id} className="menu-sep" role="separator" />;
                    if (item.heading) return <div key={item.id} className="menu-heading" role="presentation">{item.label}</div>;
                    const cls = `menu-item${item.current ? ' current' : ''}`;
                    if (item.href) {
                      return (
                        <a
                          key={item.id}
                          role="menuitem"
                          className={cls}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenId(null)}
                        >
                          {item.label} <span aria-hidden="true">↗</span>
                        </a>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        role="menuitem"
                        className={cls}
                        disabled={item.disabled}
                        aria-current={item.current ? 'true' : undefined}
                        onClick={() => {
                          setOpenId(null);
                          item.onSelect?.();
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
