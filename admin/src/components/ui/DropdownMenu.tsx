import { ReactNode, useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import styles from './DropdownMenu.module.css';

export interface DropdownMenuItemProps {
  label: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface DropdownMenuProps {
  triggerLabel?: ReactNode;
  items: DropdownMenuItemProps[];
}

export function DropdownMenu({ triggerLabel, items }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Más opciones"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {triggerLabel ?? <MoreVertical size={16} aria-hidden="true" />}
      </button>

      {isOpen && (
        <div className={styles.menu} role="menu">
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`${styles.item} ${item.variant === 'danger' ? styles.itemDanger : ''}`}
              onClick={() => {
                setIsOpen(false);
                item.onClick?.();
              }}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
