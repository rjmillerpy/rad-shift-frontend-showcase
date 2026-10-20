"use client";
import React from "react";
import { NewPostFab, SearchFab } from "@/components/Fabs";

type Props = {
  showNewPost: boolean;
  onNewPost: () => void;
};

export default function FloatingActions({ showNewPost, onNewPost }: Props) {
  return (
    <>
      {/* Search is always there; with the new-post button below it, it moves up. */}
      <SearchFab bottom={showNewPost ? "100px" : "30px"} />
      {showNewPost && <NewPostFab bottom="30px" onClick={onNewPost} />}
    </>
  );
}
