import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { Header } from './components/layout/header';
import { Feed } from './components/feed/feed';
import { CreatePostModal } from './components/posts/create-post-modal';
import { NotificationPanel } from './components/notifications/notification-panel';
import { supabase } from './lib/supabase';

function AppContent() {
  const { user, loading } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [feedMode, setFeedMode] = useState<'public' | 'tagged' | 'top'>('public');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setUnreadCount(count || 0);
  };

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header
        onCreatePost={() => setShowCreatePost(true)}
        onShowNotifications={() => setShowNotifications(true)}
        unreadCount={unreadCount}
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {user && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 inline-flex space-x-2">
              <button
                onClick={() => setFeedMode('public')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  feedMode === 'public'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Public Feed
              </button>
              <button
                onClick={() => setFeedMode('top')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  feedMode === 'top'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Top Stories
              </button>
              <button
                onClick={() => setFeedMode('tagged')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  feedMode === 'tagged'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                About You
              </button>
            </div>
          </div>
        )}

        {!user && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Celebrate Positive Impact
            </h2>
            <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
              Share stories of how people have made a difference in your life and the world around you.
              Every act of kindness deserves to be remembered.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <p className="text-slate-500">Sign in to start sharing stories</p>
            </div>
          </div>
        )}

        <Feed key={`${feedMode}-${refreshKey}`} mode={feedMode} />
      </main>

      {user && (
        <>
          <CreatePostModal
            isOpen={showCreatePost}
            onClose={() => setShowCreatePost(false)}
            onPostCreated={handlePostCreated}
          />
          <NotificationPanel
            isOpen={showNotifications}
            onClose={() => {
              setShowNotifications(false);
              loadUnreadCount();
            }}
          />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
