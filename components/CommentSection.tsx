import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo } from '../utils/timeFormat';

const API_URL = 'http://192.168.0.103:3001/api'; // Đổi thành domain backend nếu cần

export default function CommentSection({ articleUrl, user, accessToken, onLoginPress }) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const commentInputRef = useRef(null);

  // Fetch comments
  const fetchComments = async () => {
    if (!articleUrl) return;
    
    setCommentLoading(true);
    try {
      const res = await fetch(`${API_URL}/comments?article_url=${encodeURIComponent(articleUrl)}`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      } else {
        console.error('Error fetching comments:', data.error);
        setComments([]);
      }
    } catch (err) {
      console.error('Network error fetching comments:', err);
      setComments([]);
    } finally {
      setCommentLoading(false);
    }
  };

  useEffect(() => {
    if (articleUrl) {
      fetchComments();
    }
  }, [articleUrl]);

  // Gửi comment mới
  const handleSendComment = async () => {
    if (!commentText.trim() || !articleUrl) return;
    
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          article_url: articleUrl,
          content: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommentText('');
        // Refresh comments after posting
        fetchComments();
      } else {
        Alert.alert('Lỗi', data.error || 'Gửi bình luận thất bại');
      }
    } catch (err) {
      console.error('Network error posting comment:', err);
      Alert.alert('Lỗi', 'Gửi bình luận thất bại');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ marginTop: 24, backgroundColor: '#fff', marginBottom: 24 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 17, marginBottom: 8 }}>Bình luận</Text>
      {commentLoading ? (
        <ActivityIndicator size="small" color="#2196f3" />
      ) : comments.length === 0 ? (
        <Text style={{ color: '#888', fontStyle: 'italic' }}>Chưa có bình luận nào</Text>
      ) : (
        comments.map((c, i) => (
          <View key={c.id || i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
            <Image 
              source={{ 
                uri: c.user_info?.avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_info?.full_name || 'U')}` 
              }} 
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 16, 
                marginRight: 10, 
                backgroundColor: '#eee' 
              }} 
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 15 }}>
                {c.user_info?.full_name || 'Người dùng'}
              </Text>
              <Text style={{ color: '#444', fontSize: 15 }}>{c.content}</Text>
              <Text style={{ color: '#aaa', fontSize: 12 }}>
                {formatTimeAgo(c.created_at)}
              </Text>
            </View>
          </View>
        ))
      )}
      {/* Comment input */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <TextInput
          ref={commentInputRef}
          style={{ 
            flex: 1, 
            borderWidth: 1, 
            borderColor: '#ddd', 
            borderRadius: 20, 
            paddingHorizontal: 16, 
            paddingVertical: 8, 
            fontSize: 15, 
            backgroundColor: '#fafbfc' 
          }}
          placeholder="Viết bình luận..."
          value={commentText}
          onChangeText={setCommentText}
          editable={!sending}
          returnKeyType="send"
          onSubmitEditing={handleSendComment}
          multiline={false}
        />
        <TouchableOpacity 
          onPress={handleSendComment} 
          disabled={sending || !commentText.trim()} 
          style={{ 
            marginLeft: 8, 
            opacity: sending || !commentText.trim() ? 0.5 : 1 
          }}
        >
          <Ionicons name="send" size={24} color="#2196f3" />
        </TouchableOpacity>
      </View>
    </View>
  );
} 