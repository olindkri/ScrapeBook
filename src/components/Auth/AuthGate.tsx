import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoginForm } from './LoginForm';
import styles from './AuthGate.module.css';

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <>{children}</>;
}
