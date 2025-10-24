import { useState } from 'react';
import { Bell, Heart, Plus, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '../ui/button';
import { AuthModal } from '../auth/auth-modal';

interface HeaderProps {
  onCreatePost: () => void;
  onShowNotifications: () => void;
  unreadCount?: number;
}

export function Header({ onCreatePost, onShowNotifications, unreadCount = 0 }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="text-emerald-600" size={28} fill="currentColor" />
            <h1 className="text-2xl font-bold text-slate-900">Ripple</h1>
          </div>

          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onCreatePost}
                  className="flex items-center space-x-1"
                >
                  <Plus size={18} />
                  <span>Share Story</span>
                </Button>

                <button
                  onClick={onShowNotifications}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User size={18} className="text-emerald-600" />
                      </div>
                    )}
                  </button>

                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
                        <div className="px-4 py-2 border-b border-slate-200">
                          <p className="font-medium text-slate-900">{profile?.display_name}</p>
                          <p className="text-sm text-slate-500">{profile?.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            signOut();
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} size="sm">
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
