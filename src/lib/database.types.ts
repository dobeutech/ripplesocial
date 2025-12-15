export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type PrivacyLevel = 'public' | 'private' | 'recipient_only';
export type PosterAnonymity = 'full_profile' | 'first_name_only';
export type RecipientType = 'registered' | 'anonymous';
export type DocumentType = 'drivers_license' | 'passport' | 'national_id';
export type VerificationRequestStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'tagged' | 'like' | 'comment' | 'match_found' | 'verification_complete';

export interface Database {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string | null;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          verification_status: VerificationStatus;
          verification_submitted_at: string | null;
          verified_at: string | null;
          interests: string[];
          notification_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          verification_status?: VerificationStatus;
          verification_submitted_at?: string | null;
          verified_at?: string | null;
          interests?: string[];
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          verification_status?: VerificationStatus;
          verification_submitted_at?: string | null;
          verified_at?: string | null;
          interests?: string[];
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string | null;
          author_first_name: string;
          content: string;
          recipient_type: RecipientType;
          recipient_id: string | null;
          recipient_name: string;
          privacy_level: PrivacyLevel;
          poster_anonymity: PosterAnonymity;
          recipient_visibility_override: PrivacyLevel | null;
          interests: string[];
          like_count: number;
          comment_count: number;
          engagement_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id?: string | null;
          author_first_name: string;
          content: string;
          recipient_type: RecipientType;
          recipient_id?: string | null;
          recipient_name: string;
          privacy_level?: PrivacyLevel;
          poster_anonymity?: PosterAnonymity;
          recipient_visibility_override?: PrivacyLevel | null;
          interests?: string[];
          like_count?: number;
          comment_count?: number;
          engagement_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string | null;
          author_first_name?: string;
          content?: string;
          recipient_type?: RecipientType;
          recipient_id?: string | null;
          recipient_name?: string;
          privacy_level?: PrivacyLevel;
          poster_anonymity?: PosterAnonymity;
          recipient_visibility_override?: PrivacyLevel | null;
          interests?: string[];
          like_count?: number;
          comment_count?: number;
          engagement_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          parent_comment_id: string | null;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_comment_id?: string | null;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          parent_comment_id?: string | null;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          post_id: string | null;
          triggering_user_id: string | null;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          post_id?: string | null;
          triggering_user_id?: string | null;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          post_id?: string | null;
          triggering_user_id?: string | null;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      pending_recipient_matches: {
        Row: {
          id: string;
          post_id: string;
          recipient_name: string;
          recipient_email: string | null;
          matched: boolean;
          matched_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          recipient_name: string;
          recipient_email?: string | null;
          matched?: boolean;
          matched_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          recipient_name?: string;
          recipient_email?: string | null;
          matched?: boolean;
          matched_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          id: string;
          user_id: string;
          document_url: string;
          document_type: DocumentType;
          status: VerificationRequestStatus;
          rejection_reason: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_url: string;
          document_type: DocumentType;
          status?: VerificationRequestStatus;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_url?: string;
          document_type?: DocumentType;
          status?: VerificationRequestStatus;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      document_type: DocumentType;
      notification_type: NotificationType;
      poster_anonymity: PosterAnonymity;
      privacy_level: PrivacyLevel;
      recipient_type: RecipientType;
      verification_request_status: VerificationRequestStatus;
      verification_status: VerificationStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
