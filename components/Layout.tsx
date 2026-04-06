/**
 * Layout.tsx — wrapper موحّد
 * جميع الصفحات القديمة التي تستخدم <Layout> ستحصل تلقائياً
 * على ControlRoomGate + ControlRoomShell بدون أي تعديل فيها.
 */
import Head from 'next/head';
import ControlRoomGate from './control-room/ControlRoomGate';
import ControlRoomShell from './control-room/ControlRoomShell';

interface LayoutProps {
  title?: string;
  children: React.ReactNode;
}

export default function Layout({ title, children }: LayoutProps) {
  return (
    <>
      {title && (
        <Head>
          <title>{title} — الكنترول روم</title>
        </Head>
      )}
      <ControlRoomGate>
        {(access) => (
          <ControlRoomShell access={access}>
            {children}
          </ControlRoomShell>
        )}
      </ControlRoomGate>
    </>
  );
}
