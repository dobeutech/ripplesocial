import { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/auth-context';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null);
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'private' | 'recipient_only'>('public');
  const [posterAnonymity, setPosterAnonymity] = useState<'full_profile' | 'first_name_only'>('full_profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (recipientSearch.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [recipientSearch]);

  const searchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${recipientSearch}%,last_name.ilike.%${recipientSearch}%,display_name.ilike.%${recipientSearch}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleSelectRecipient = (recipient: Profile) => {
    setSelectedRecipient(recipient);
    setRecipientName(recipient.display_name || `${recipient.first_name} ${recipient.last_name || ''}`.trim());
    setRecipientSearch('');
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Please share your story');
      return;
    }

    if (!recipientName.trim()) {
      setError('Please specify who this story is about');
      return;
    }

    setLoading(true);

    try {
      const postData = {
        author_id: user?.id || null,
        author_first_name: profile?.first_name || 'Anonymous',
        content: content.trim(),
        recipient_type: selectedRecipient ? 'registered' as const : 'anonymous' as const,
        recipient_id: selectedRecipient?.id || null,
        recipient_name: recipientName.trim(),
        privacy_level: privacyLevel,
        poster_anonymity: posterAnonymity,
      };

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (postError) throw postError;

      if (!selectedRecipient && recipientName.trim()) {
        await supabase.from('pending_recipient_matches').insert({
          post_id: post.id,
          recipient_name: recipientName.trim(),
        });
      }

      if (selectedRecipient) {
        await supabase.from('notifications').insert({
          user_id: selectedRecipient.id,
          type: 'tagged',
          post_id: post.id,
          triggering_user_id: user?.id || null,
          message: `You were mentioned in a story by ${profile?.first_name || 'someone'}`,
        });
      }

      resetForm();
      onPostCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setRecipientName('');
    setRecipientSearch('');
    setSelectedRecipient(null);
    setSearchResults([]);
    setPrivacyLevel('public');
    setPosterAnonymity('full_profile');
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share a Positive Story" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Who is this story about?
          </label>
          {selectedRecipient ? (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-medium">
                  {selectedRecipient.first_name[0]}
                </div>
                <span className="font-medium text-slate-900">{recipientName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRecipient(null);
                  setRecipientName('');
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <Input
                placeholder="Search for a user or enter a name"
                value={recipientSearch || recipientName}
                onChange={(e) => {
                  if (selectedRecipient) {
                    setRecipientName(e.target.value);
                  } else {
                    setRecipientSearch(e.target.value);
                  }
                }}
              />
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => handleSelectRecipient(result)}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium">
                        {result.first_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {result.display_name || `${result.first_name} ${result.last_name || ''}`.trim()}
                        </p>
                        <p className="text-xs text-slate-500">{result.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Tag a registered user or enter any name for someone not yet on the platform
          </p>
        </div>

        <Textarea
          label="Your Story"
          placeholder="Share how this person made a positive impact..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Who can see this?
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="public"
                checked={privacyLevel === 'public'}
                onChange={(e) => setPrivacyLevel(e.target.value as 'public')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Public - Everyone can see</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="recipient_only"
                checked={privacyLevel === 'recipient_only'}
                onChange={(e) => setPrivacyLevel(e.target.value as 'recipient_only')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Recipient only - Only they can see</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="private"
                checked={privacyLevel === 'private'}
                onChange={(e) => setPrivacyLevel(e.target.value as 'private')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Private - Only you can see</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Share as
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="full_profile"
                checked={posterAnonymity === 'full_profile'}
                onChange={(e) => setPosterAnonymity(e.target.value as 'full_profile')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Full profile - Show your name</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="first_name_only"
                checked={posterAnonymity === 'first_name_only'}
                onChange={(e) => setPosterAnonymity(e.target.value as 'first_name_only')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">First name only - Semi-anonymous</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Sharing...' : 'Share Story'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
