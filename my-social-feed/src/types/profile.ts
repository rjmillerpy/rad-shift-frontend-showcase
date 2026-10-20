import { Post } from "./post";

export interface Profile {
  username: string;
  bio?: string;
  profile_picture_url?: string;
  posts: Post[];
}
