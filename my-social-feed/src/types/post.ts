export interface PostSourceMetadata {
  platform: string;
  name: string;
  url?: string | null;
  label: string;
}

export interface PostLinkCard {
  url: string;
  title?: string | null;
  image?: string | null;
  hostname?: string | null;
  // When true, ``image`` is a thumbnail and the source link points to a video.
  // The card renders a centered play-button overlay over the thumbnail.
  is_video?: boolean;
}

export interface PostMetadata {
  tags?: string[];
  tagged_users?: string[];
  location?: string;
  source?: PostSourceMetadata;
  link_card?: PostLinkCard;
}

export interface QuotedPost {
  id: number;
  username: string;
  text: string;
}

export interface MediaMetadata {
  duration_seconds?: number | null;
  bitrate?: number | null;
  sample_rate?: number | null;
  dimensions?: { width: number; height: number } | null;
  format?: string;
  type?: "audio" | "video";
}

export interface Post {
  id: number;
  text: string;
  username: string;
  profile_picture_url?: string | null;
  image_url?: string | null;
  image_urls?: string[];
  video_url?: string | null;
  audio_url?: string | null;
  document_urls?: string[] | null;
  post_metadata?: PostMetadata;
  liked_by_me?: boolean;
  reposted_by_me?: boolean;
  is_followed_by_me?: boolean;
  is_me?: boolean;
  likes: number;
  reposts: number;
  shares: number;
  saves: number;
  laughs: number;
  laughed_by_me?: boolean;
  replies_count?: number;
  quotes_count?: number;
  slop_count?: number;
  reposted_by?: string[];
  unix_timestamp: number;
  saved_by_me?: boolean;
  parent_post_id?: number | null;
  media_metadata?: MediaMetadata | null;
  quoted_post?: QuotedPost | null;
}

export interface WidgetInfo {
  id: number;
  title: string;
  description: string | null;
  category: string;
  language: string;
  icon_emoji: string | null;
  author_username: string;
  status: string;
  install_count: number;
  likes: number;
  saves: number;
  rating_avg: number | null;
  default_width: number;
  default_height: number;
  resizable: boolean;
  tags: string[] | null;
  permissions: string[] | null;
}
