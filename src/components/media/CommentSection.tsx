"use client";

import React, { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: { name: string; avatar?: string | null; username: string };
}

interface CurrentUser {
  id?: string;
  name?: string | null;
  image?: string | null;
}

interface Props {
  mediaId: string;
  initialComments: Comment[];
  currentUser: CurrentUser;
}

export default function CommentSection({ mediaId, initialComments, currentUser }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/social/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, text }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to post comment");
        return;
      }

      setComments((prev) => [
        {
          ...data.comment,
          createdAt: data.comment.createdAt,
        },
        ...prev,
      ]);
      setText("");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
        <MessageCircle className="h-4 w-4" />
        Comments ({comments.length})
      </h3>

      {/* Input */}
      <form onSubmit={submitComment} className="flex gap-2">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={currentUser.image || ""} />
          <AvatarFallback>{currentUser.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <Button
            type="submit"
            size="icon-sm"
            loading={submitting}
            disabled={!text.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={comment.user.avatar || ""} />
                <AvatarFallback className="text-xs">{comment.user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-900">{comment.user.name}</span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 break-words">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
