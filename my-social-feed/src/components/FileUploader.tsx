"use client";
import { UNSTYLED_BUTTON } from "@/lib/a11y";
import React, { useState, useCallback, useRef } from "react";

const ALLOWED_EXTENSIONS = new Set([
  // Images
  "jpg","jpeg","png","gif","webp","svg","bmp","tiff","tif","ico","heic","heif","avif",
  // Video
  "mp4","mov","avi","webm","mkv","flv","wmv","m4v",
  // Audio
  "mp3","wav","ogg","aac","m4a","flac","wma","opus",
  // Documents
  "pdf","doc","docx","txt","rtf","odt","csv","xls","xlsx","ppt","pptx","md",
  // Archives
  "zip","tar","gz","7z","rar",
]);

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set(["jpg","jpeg","png","gif","webp","svg","bmp","tiff","tif","ico","heic","heif","avif"]);
const VIDEO_EXTENSIONS = new Set(["mp4","mov","avi","webm","mkv","flv","wmv","m4v"]);
const AUDIO_EXTENSIONS = new Set(["mp3","wav","ogg","aac","m4a","flac","wma","opus"]);
const ARCHIVE_EXTENSIONS = new Set(["zip","tar","gz","7z","rar"]);

export interface UploadFile {
  file: File;
  id: string;
  preview: string | null;
  error: string | null;
}

interface FileUploaderProps {
  files: UploadFile[];
  onFilesChange: (files: UploadFile[]) => void;
  maxFiles?: number;
}

function getExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function getFileIcon(ext: string): string {
  if (VIDEO_EXTENSIONS.has(ext)) return "\uD83C\uDFAC";
  if (AUDIO_EXTENSIONS.has(ext)) return "\uD83C\uDFB5";
  if (ARCHIVE_EXTENSIONS.has(ext)) return "\uD83D\uDCE6";
  return "\uD83D\uDCC4";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function getFileCategory(ext: string): "image" | "video" | "audio" | "document" {
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  return "document";
}

export default function FileUploader({ files, onFilesChange, maxFiles = 20 }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (incoming: File[]) => {
      const newFiles: UploadFile[] = incoming.map((file) => {
        const ext = getExtension(file.name);
        let error: string | null = null;
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          error = `Unsupported file type: .${ext}`;
        } else if (file.size > MAX_FILE_SIZE_BYTES) {
          error = `File exceeds ${MAX_FILE_SIZE_MB}MB limit`;
        }
        const isImage = IMAGE_EXTENSIONS.has(ext) && !error;
        return {
          file,
          id: crypto.randomUUID(),
          preview: isImage ? URL.createObjectURL(file) : null,
          error,
        };
      });
      const combined = [...files, ...newFiles].slice(0, maxFiles);
      onFilesChange(combined);
    },
    [files, onFilesChange, maxFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length) processFiles(droppedFiles);
    },
    [processFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files;
      if (selected) processFiles(Array.from(selected));
      e.target.value = "";
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (id: string) => {
      const updated = files.filter((f) => f.id !== id);
      const removed = files.find((f) => f.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      onFilesChange(updated);
    },
    [files, onFilesChange]
  );

  return (
    <div>
      {/* Drop zone: a real button (Tab, Enter, Space), and the drop target */}
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        style={{ display: "none" }}
        data-testid="file-input"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          ...UNSTYLED_BUTTON,
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          border: `2px dashed ${isDragOver ? "#4a9eff" : "#2a2a4e"}`,
          borderRadius: 8,
          padding: "20px 16px",
          textAlign: "center",
          cursor: "pointer",
          background: isDragOver ? "rgba(74,158,255,0.06)" : "#1a1a2e",
          transition: "border-color 0.2s, background 0.2s",
          marginBottom: 8,
        }}
      >
        <span style={{ display: "block", color: isDragOver ? "#4a9eff" : "#888", fontSize: 14 }}>
          {isDragOver ? "Release to upload" : "Drop files here or click to browse"}
        </span>
        <span style={{ display: "block", color: "#555", fontSize: 11, marginTop: 4 }}>
          Max {MAX_FILE_SIZE_MB}MB per file
        </span>
      </button>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {files.map((uf) => {
            const ext = getExtension(uf.file.name);
            return (
              <div
                key={uf.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#1a1a2e",
                  border: `1px solid ${uf.error ? "#e55" : "#2a2a4e"}`,
                  borderRadius: 6,
                  padding: "6px 10px",
                }}
              >
                {/* Thumbnail or icon */}
                {uf.preview ? (
                  <img
                    src={uf.preview}
                    alt=""
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: "cover",
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>
                    {getFileIcon(ext)}
                  </span>
                )}

                {/* Name + size + error */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#ddd",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {uf.file.name}
                  </div>
                  <div style={{ fontSize: 11, color: uf.error ? "#e55" : "#777" }}>
                    {uf.error || formatSize(uf.file.size)}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(uf.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    fontSize: 18,
                    lineHeight: 1,
                    padding: "2px 6px",
                    flexShrink: 0,
                  }}
                  title="Remove file"
                >
                  X
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
