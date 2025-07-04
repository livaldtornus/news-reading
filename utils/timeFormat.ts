export function formatTimeAgo(dateString: string): string {
  const now = new Date();
  // Convert UTC time from database to Vietnam time (+7)
  const date = new Date(dateString);
  const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours for Vietnam timezone
  
  const diffInMs = now.getTime() - vietnamTime.getTime();
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) {
    return 'Vừa xong';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  } else {
    // Nếu quá 7 ngày thì hiển thị ngày tháng ở múi giờ Việt Nam
    return vietnamTime.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  }
}

// Hàm format thời gian đầy đủ ở múi giờ Việt Nam
export function formatFullDateTime(dateString: string): string {
  const date = new Date(dateString);
  // Convert UTC time from database to Vietnam time (+7)
  const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours for Vietnam timezone
  
  return vietnamTime.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  });
} 