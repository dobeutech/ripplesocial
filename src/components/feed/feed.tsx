import { useState, useEffect } from 'react';
import { PostCard } from '../posts/post-card';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/auth-context';
import type { Database } from '../../lib/database.types';
import { FEED_LIMITS } from '../../config/constants';

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

interface FeedProps {
  mode: 'public' | 'tagged' | 'top' | 'saved';
}

export function Feed({ mode }: FeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [mode, user]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      let postsData: PostWithAuthor[] | null = null;

      if (mode === 'saved' && user) {
        // For saved mode, fetch bookmarks first, then get the posts
        const { data: bookmarksData, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select('post_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (bookmarksError) throw bookmarksError;

        if (bookmarksData && bookmarksData.length > 0) {
          const bookmarkedPostIds = bookmarksData.map(b => b.post_id);
          const { data, error } = await supabase
            .from('posts')
            .select(`
              *,
              author:profiles!posts_author_id_fkey(id, display_name, avatar_url)
            `)
            .in('id', bookmarkedPostIds);

          if (error) throw error;
          
          // Sort posts to match bookmark order (most recently saved first)
          const postMap = new Map((data as PostWithAuthor[] | null)?.map(p => [p.id, p]));
          postsData = bookmarkedPostIds
            .map(id => postMap.get(id))
            .filter((p): p is PostWithAuthor => p !== undefined);
        } else {
          postsData = [];
        }
      } else {
        let query = supabase
          .from('posts')
          .select(`
            *,
            author:profiles!posts_author_id_fkey(id, display_name, avatar_url)
          `);

        if (mode === 'public') {
          query = query.eq('privacy_level', 'public');
        } else if (mode === 'tagged' && user) {
          query = query.eq('recipient_id', user.id);
        } else if (mode === 'top') {
          query = query
            .eq('privacy_level', 'public')
            .order('engagement_score', { ascending: false })
            .limit(FEED_LIMITS.TOP_STORIES);
        }

        if (mode !== 'top') {
          query = query.order('created_at', { ascending: false });
        }

        query = query.limit(FEED_LIMITS.DEFAULT);

        const { data, error } = await query;
        if (error) throw error;
        postsData = data as PostWithAuthor[];
      }

      if (user && postsData && postsData.length > 0) {
        const postIds = postsData.map(p => p.id);
        
        // Fetch likes and bookmarks in parallel
        const [likesResult, bookmarksResult] = await Promise.all([
          supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds),
          supabase
            .from('bookmarks')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds)
        ]);

        const likedPostIds = new Set(likesResult.data?.map(l => l.post_id) || []);
        const bookmarkedPostIds = new Set(bookmarksResult.data?.map(b => b.post_id) || []);

        const postsWithStatus = postsData.map(post => ({
          ...post,
          is_liked: likedPostIds.has(post.id),
          is_bookmarked: bookmarkedPostIds.has(post.id),
        }));

        setPosts(postsWithStatus);
      } else {
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 bg-slate-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/4" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-4/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    const getEmptyMessage = () => {
      switch (mode) {
        case 'tagged':
          return {
            title: 'No stories about you yet',
            subtitle: 'When someone shares a story about you, it will appear here'
          };
        case 'saved':
          return {
            title: 'No saved posts yet',
            subtitle: 'Bookmark posts to save them for later'
          };
        default:
          return {
            title: 'No stories to show',
            subtitle: 'Be the first to share a positive story!'
          };
      }
    };

    const { title, subtitle } = getEmptyMessage();

    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-2">{title}</p>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard 
          key={post.id} 
          post={post} 
          onLikeToggle={loadPosts}
          onBookmarkToggle={loadPosts}
        />
      ))}
    </div>
  );
}
