import { useState } from 'react';
import { Heart, MessageCircle, User, Bookmark } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/auth-context';
import type { Database } from '../../lib/database.types';

type Post = Database['public']['Tables']['posts']['Row'];

interface PostWithAuthor extends Post {
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

interface PostCardProps {
  post: PostWithAuthor;
  onLikeToggle: () => void;
  onBookmarkToggle?: () => void;
}

export function PostCard({ post, onLikeToggle, onBookmarkToggle }: PostCardProps) {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLikeToggle = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      if (post.is_liked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id });
      }
      onLikeToggle();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user || isBookmarking) return;

    setIsBookmarking(true);
    try {
      if (post.is_bookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('bookmarks')
          .insert({ post_id: post.id, user_id: user.id });
      }
      onBookmarkToggle?.();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsBookmarking(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getAuthorDisplay = () => {
    if (post.poster_anonymity === 'first_name_only') {
      return post.author_first_name;
    }
    return post.author?.display_name || post.author_first_name;
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-start space-x-3 mb-3">
          {post.poster_anonymity === 'full_profile' && post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt={post.author.display_name || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <User size={20} className="text-emerald-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-900">{getAuthorDisplay()}</span>
              <span className="text-slate-400">→</span>
              <span className="font-medium text-emerald-600">{post.recipient_name || 'Someone'}</span>
            </div>
            <p className="text-xs text-slate-500">{formatTimeAgo(post.created_at)}</p>
          </div>
        </div>

        <p className="text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

        <div className="flex items-center space-x-6 pt-3 border-t border-slate-100">
          <button
            onClick={handleLikeToggle}
            disabled={!user || isLiking}
            className={`flex items-center space-x-2 transition-colors ${
              post.is_liked
                ? 'text-red-500'
                : 'text-slate-500 hover:text-red-500'
            } disabled:opacity-50`}
          >
            <Heart
              size={20}
              fill={post.is_liked ? 'currentColor' : 'none'}
              className="transition-all"
            />
            <span className="text-sm font-medium">{post.like_count}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-medium">{post.comment_count}</span>
          </button>

          <button
            onClick={handleBookmarkToggle}
            disabled={!user || isBookmarking}
            className={`flex items-center space-x-2 transition-colors ml-auto ${
              post.is_bookmarked
                ? 'text-amber-500'
                : 'text-slate-500 hover:text-amber-500'
            } disabled:opacity-50`}
            aria-label={post.is_bookmarked ? 'Remove bookmark' : 'Bookmark post'}
          >
            <Bookmark
              size={20}
              fill={post.is_bookmarked ? 'currentColor' : 'none'}
              className="transition-all"
            />
          </button>
        </div>

        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 text-center">Comments feature coming soon</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
