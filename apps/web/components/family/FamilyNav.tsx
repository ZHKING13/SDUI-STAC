'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

export function FamilyNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Rubriques de l’espace famille" className="family-nav">
      {items.map((item) => {
        const current = item.href === '/espace-famille' ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className="family-nav__link" aria-current={current ? 'page' : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
