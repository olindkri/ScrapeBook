import { useState, type FormEvent } from 'react';
import { signIn, signUp } from '../../firebase/auth';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>ScrapeBook</h1>
        <p className={styles.subtitle}>
          {isRegistering ? 'Create your account' : 'Sign in to your account'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={styles.input}
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? '...' : isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          className={styles.toggleBtn}
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
          }}
        >
          {isRegistering
            ? 'Already have an account? Sign in'
            : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}
