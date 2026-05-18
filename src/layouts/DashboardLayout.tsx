import { ReactNode } from 'react';
import { NotificationsButton } from '../components/NotificationsButton';
import { Sidebar } from '../components/Sidebar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 lg:flex">
      <Sidebar />
      <main className="relative min-w-0 flex-1">
        <div className="fixed bottom-4 right-4 z-40 lg:bottom-8 lg:right-8">
          <NotificationsButton />
        </div>
        {children}
      </main>
    </div>
  );
}
