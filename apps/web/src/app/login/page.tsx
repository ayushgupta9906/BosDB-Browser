'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { login, getAllUsers, initializeDefaultUsers, registerUser } from '@/lib/auth';

// Define User type locally to resolve lint error or import it if exported
// Assuming User type is compatible with what getAllUsers returns
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
}

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    accountType: 'enterprise' as 'individual' | 'enterprise'
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch users from server on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();

          // Deduplicate users by ID (keep first occurrence)
          const uniqueUsers = Array.from(
            new Map((data.users || []).map((user: User) => [user.id, user])).values()
          ) as User[];
          setUsers(uniqueUsers);

          // If no users exist on server, create default admin via API
          if (data.users && data.users.length === 0) {
            await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'register',
                id: 'admin',
                name: 'Administrator',
                email: 'admin@bosdb.com',
                password: 'Admin@123',
                role: 'admin',
                // Status handled by API logic for first user
              })
            });
            // Refresh
            const retry = await fetch('/api/auth');
            const retryData = await retry.json();
            const uniqueRetryUsers = Array.from(
              new Map((retryData.users || []).map((user: User) => [user.id, user])).values()
            ) as User[];
            setUsers(uniqueRetryUsers);
          }
        }
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };

    fetchUsers();
  }, []);

  const handleLogin = async () => {
    setError('');

    if (!userId.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: userId.trim(), // Using email for login
          password: password
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('bosdb_current_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          ...newUser
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Show the message from API response (first user or pending approval)
      setSuccessMessage(data.message || 'Registration successful!');

      // Clear form
      setShowRegister(false);
      setNewUser({ id: '', name: '', email: '', password: '', role: 'user', accountType: 'enterprise' });

      // Refresh list
      const listRes = await fetch('/api/auth');
      const listData = await listRes.json();
      setUsers(listData.users || []);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) {
        setError('Google Login failed: No credential received');
        return;
      }

      const decoded: any = jwtDecode(credentialResponse.credential);
      const { email, name, sub: googleId, picture } = decoded;

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'google_login',
          email: email,
          name: name,
          googleId: googleId,
          picture: picture // Optional if backend supports it
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.requiresRegistration) {
          // Pre-fill and show register form
          setNewUser(prev => ({
            ...prev,
            email: data.googleData.email,
            name: data.googleData.name,
            googleId: data.googleData.googleId,
            password: '' // No password needed for google auth
          }));
          setShowRegister(true);
          setSuccessMessage('Please complete your registration details.');
        } else if (data.message) {
          // Registration / Pending (should not hit here for google_login anymore if new, but maybe for existing pending)
          window.alert(data.message);
          if (data.user.status === 'approved' || data.user.status === 'active') {
            localStorage.setItem('bosdb_current_user', JSON.stringify(data.user));
            router.push('/dashboard');
          } else {
            setSuccessMessage(data.message);
          }
        } else {
          // Login
          localStorage.setItem('bosdb_current_user', JSON.stringify(data.user));
          router.push('/dashboard');
        }
      } else {
        setError(data.error || 'Google Login failed');
      }

    } catch (err: any) {
      console.error('Google Login Error:', err);
      setError('Failed to process Google Login');
    }
  };

  const handleGoogleError = () => {
    setError('Google Login Failed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Back to Home */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🗄️ BosDB</h1>
          <p className="text-gray-400">Database Version Control System</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500 text-green-400 rounded-lg text-sm animate-fadeIn">
            ✅ {successMessage}
          </div>
        )}

        {!showRegister ? (
          // Login Form
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Employee Login</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="mb-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                shape="pill"
                width="100%"
              />
            </div>
            {/* 
            <button
              onClick={handleGoogleLogin}
              className="w-full px-4 py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg transition mb-6 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button> 
            */}

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-800 text-gray-500">Or continue with email</span></div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="e.g., admin@company.com"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition mb-4"
            >
              Login
            </button>

            <button
              onClick={() => setShowRegister(true)}
              className="w-full px-4 py-3 border border-gray-600 hover:bg-gray-700 text-gray-300 rounded-lg transition"
            >
              Register New User
            </button>
          </div>


        ) : (
          // Register Form
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              {newUser.googleId ? 'Complete Registration' : 'Register New User'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {!newUser.googleId && (
              <div className="mb-6 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  shape="pill"
                  width="100%"
                  text="signup_with"
                />
              </div>
            )}

            {!newUser.googleId && (
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-800 text-gray-500">Or register with email</span></div>
              </div>
            )}

            {/* Account Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                How will you use BosDB?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewUser({ ...newUser, accountType: 'individual' })}
                  className={`p-4 rounded-lg border-2 transition-all ${newUser.accountType === 'individual'
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-gray-600 bg-gray-900 text-gray-400 hover:border-gray-500'
                    }`}
                >
                  <div className="text-lg mb-1">👤 Individual</div>
                  <div className="text-xs opacity-70">Personal use</div>
                </button>
                <button
                  type="button"
                  onClick={() => setNewUser({ ...newUser, accountType: 'enterprise' })}
                  className={`p-4 rounded-lg border-2 transition-all ${newUser.accountType === 'enterprise'
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-gray-600 bg-gray-900 text-gray-400 hover:border-gray-500'
                    }`}
                >
                  <div className="text-lg mb-1">🏢 Company/Team</div>
                  <div className="text-xs opacity-70">For organizations</div>
                </button>
              </div>
              {newUser.accountType === 'enterprise' && (
                <p className="mt-2 text-xs text-gray-400">
                  💡 All users with the same email domain will be grouped together
                </p>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  User ID *
                </label>
                <input
                  type="text"
                  value={newUser.id}
                  onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                  placeholder="e.g., testuser"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g., Test User"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g., ayush@company.com"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                  disabled={!!newUser.googleId}
                />
              </div>

              {!newUser.googleId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min 8 chars, 1 upper, 1 lower, 1 number"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be 8+ characters with uppercase, lowercase, and number</p>
                </div>
              )}

            </div>

            <button
              onClick={handleRegister}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition mb-3"
            >
              {newUser.googleId ? 'Complete Registration' : 'Create User'}
            </button>

            <button
              onClick={() => setShowRegister(false)}
              className="w-full px-4 py-3 border border-gray-600 hover:bg-gray-700 text-gray-300 rounded-lg transition"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Existing Users - Outside the box */}
        {users.length > 0 && (
          <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Registered Users:</p>
            <div className="flex flex-wrap gap-2">
              {users.map(user => (
                <span
                  key={user.id}
                  className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => { setUserId(user.id); setShowRegister(false); }}
                >
                  {user.id} <span className="text-gray-500">({user.role})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
