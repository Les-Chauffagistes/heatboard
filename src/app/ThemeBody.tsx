'use client';

import { useTheme } from '@/app/hooks/useTheme';
import MockingProvider from '@/app/MockingProvider';

interface ThemeBodyProps {
  readonly children: React.ReactNode;
  readonly className: string;
}

export default function ThemeBody({ children, className }: Readonly<ThemeBodyProps>) {
  const { isDark } = useTheme();

  return (
    <body 
      className={className} 
      style={{
        backgroundColor: isDark ? "#1f1f1f" : "#ce8415ff"
      }}
    >
      <MockingProvider>{children}</MockingProvider>
    </body>
  );
}
