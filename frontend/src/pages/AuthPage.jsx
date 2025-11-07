import React, { useState } from 'react';
import { toast, Toaster } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function AuthPage({ setUser }) {
  const [tab, setTab] = useState('login');
  const [avatar, setAvatar] = useState(null); // will send file
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setAvatar(null);
      setAvatarPreview(null);
    }
  };

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password');

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success('Login successful!');
      navigate('/social');
    } catch (err) {
      console.error(err.response);
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  // SIGNUP
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword)
      return toast.error('Please fill all fields');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('email', email);
      fd.append('password', password);
      if (avatar) fd.append('avatar', avatar);

      await api.post('/auth/signup', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Signup successful! Please login.');
      setTab('login');
    } catch (err) {
      console.error(err.response);
      toast.error(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6">
      <Toaster richColors position="top-right" />

      <div className="backdrop-blur-xl bg-white/50 border border-white/40 shadow-2xl rounded-3xl p-10 w-full max-w-md animate-fadeIn">
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setTab('login')}
            className={`px-6 py-2 font-semibold rounded-t-xl transition-colors ${
              tab === 'login' ? 'bg-green-500 text-white' : 'bg-green-200 text-green-700'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`px-6 py-2 font-semibold rounded-t-xl transition-colors ${
              tab === 'signup' ? 'bg-green-500 text-white' : 'bg-green-200 text-green-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {tab === 'login' ? (
          <form className="space-y-5" onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input" required />
            <button type="submit" className="btn w-full">Login</button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleSignup}>
            <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="input" required />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input" required />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" required />
            <div>
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
              {avatarPreview && <img src={avatarPreview} alt="Avatar" className="w-20 h-20 mt-2 rounded-full object-cover" />}
            </div>
            <button type="submit" className="btn w-full">Sign Up</button>
          </form>
        )}
      </div>
    </div>
  );
}
