import { type ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export const Layout = ({ children, showHeader = true }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showHeader && <Header />}
      <main className={showHeader ? 'pt-0' : ''}>
        {children}
      </main>
    </div>
  );
};