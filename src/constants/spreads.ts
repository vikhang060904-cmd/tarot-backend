export interface SpreadConfig {
  id: string;
  name: string;
  count: number;
  category: string;
  description: string;
  icon?: string;
  positions?: string[];
  layout: "circle" | "line" | "cross" | "horseshoe" | "spiral" | "grid" | "pyramid" | "star" | "mandala" | "tree";
  
  // Premium metadata
  spirit?: string;
  energy?: "Stable" | "High" | "Cosmic" | "Healing" | "Deep";
  tags?: string[];
  isNew?: boolean;
}

export const SPREAD_TYPES: SpreadConfig[] = [
  { 
    id: "single", 
    name: "Nghi Thức Tự Do", 
    count: 22, 
    category: "Cơ bản",
    description: "Bạn tự tay rút số lá bài mình muốn và cảm nhận thông điệp.",
    icon: "🔮",
    layout: "grid",
    spirit: "Tự Do Khai Phá",
    energy: "Stable",
    tags: ["Dễ dùng", "Phổ biến"],
    positions: Array.from({length: 22}).map((_, i) => `Thông điệp ${i + 1}`)
  },
  { 
    id: "three", 
    name: "Three Card", 
    count: 3, 
    category: "Cơ bản",
    description: "Quá khứ - Hiện tại - Tương lai",
    icon: "📜",
    layout: "line",
    positions: ["Quá khứ", "Hiện tại", "Tương lai"]
  },
  { 
    id: "mirror", 
    name: "Mirror Spread", 
    count: 4, 
    category: "Cơ bản",
    description: "Thấu hiểu bản thân & Đối diện",
    icon: "🪞",
    layout: "grid",
    positions: ["Bản thân", "Thế giới", "Điều bạn thấy", "Điều ẩn giấu"]
  },
  { 
    id: "five", 
    name: "Five Card Cross", 
    count: 5, 
    category: "Cơ bản",
    description: "Phân tích tình huống sâu",
    icon: "✚",
    layout: "cross",
    positions: ["Hiện tại", "Thử thách", "Tương lai", "Gốc rễ", "Tiềm năng"]
  },
  { 
    id: "hexagram", 
    name: "Hexagram", 
    count: 7, 
    category: "Nâng cao",
    description: "Sáu cạnh & Tâm điểm",
    icon: "✡️",
    layout: "star",
    positions: ["Đỉnh cao", "Dưới đáy", "Trái trên", "Phải dưới", "Trái dưới", "Phải trên", "Tâm điểm"]
  },
  { 
    id: "celtic", 
    name: "Celtic Cross", 
    count: 10, 
    category: "Nâng cao",
    description: "Toàn diện nhất & Huyền bí",
    icon: "🕸️",
    layout: "tree",
    spirit: "Huyền Bí Cổ Điển",
    energy: "Deep",
    tags: ["Toàn diện", "Khuyên dùng"],
    isNew: true,
    positions: ["Hiện tại", "Thách thức", "Mục tiêu", "Gốc rễ", "Quá khứ", "Tương lai", "Thái độ", "Môi trường", "Hy vọng", "Kết quả"]
  },
  { 
    id: "tree_of_life", 
    name: "Tree of Life", 
    count: 10, 
    category: "Tâm linh",
    description: "10 Sephiroth tâm linh",
    icon: "🌳",
    layout: "tree",
    positions: ["Kether", "Chokmah", "Binah", "Chesed", "Geburah", "Tiphareth", "Netzach", "Hod", "Yesod", "Malkuth"]
  },
  { 
    id: "horseshoe", 
    name: "Horseshoe", 
    count: 7, 
    category: "Cơ bản",
    description: "Vòng cung móng ngựa",
    icon: "🎠",
    layout: "horseshoe",
    positions: ["Quá khứ", "Hiện tại", "Thách thức", "Ẩn số", "Lời khuyên", "Hành động", "Kết quả"]
  },
  { 
    id: "relationship", 
    name: "Relationship", 
    count: 7, 
    category: "Tình duyên",
    description: "Xem tình cảm hai người",
    icon: "💕",
    layout: "grid",
    positions: ["Bạn", "Đối phương", "Cảm xúc của bạn", "Cảm xúc đối phương", "Rào cản", "Lời khuyên", "Tương lai"]
  },
  { 
    id: "decision", 
    name: "Decision", 
    count: 7, 
    category: "Cơ bản",
    description: "Lựa chọn hướng đi",
    icon: "⚖️",
    layout: "star",
    positions: ["Tình huống", "Lựa chọn A", "Lựa chọn B", "Kết quả A", "Kết quả B", "Rủi ro", "Lời khuyên"]
  },
  { 
    id: "zodiac", 
    name: "Zodiac Circle", 
    count: 12, 
    category: "Tâm linh",
    description: "12 cung hoàng đạo & 12 phương diện cuộc sống",
    icon: "♈",
    layout: "circle",
    positions: [
      "Bạch Dương (Bản thân)", "Kim Ngưu (Tài chính)", "Song Tử (Giao tiếp)", 
      "Cự Giải (Gia đình)", "Sư Tử (Sáng tạo)", "Xử Nữ (Sức khỏe)", 
      "Thiên Bình (Mối quan hệ)", "Bọ Cạp (Biến đổi)", "Nhân Mã (Tri thức)", 
      "Ma Kết (Sự nghiệp)", "Bảo Bình (Xã hội)", "Song Ngư (Tâm linh)"
    ]
  },
  { 
    id: "pyramid", 
    name: "Pyramid", 
    count: 10, 
    category: "Nâng cao",
    description: "Kim tự tháp thần bí - Giải quyết vấn đề",
    icon: "📐",
    layout: "pyramid",
    positions: [
      "Vấn đề cốt lõi", 
      "Tác động trái", "Tác động phải", 
      "Nền tảng 1", "Nền tảng 2", "Nền tảng 3",
      "Kết quả tiềm năng 1", "Kết quả tiềm năng 2", "Kết quả tiềm năng 3", "Kết quả cuối cùng"
    ]
  },
  { 
    id: "chakra", 
    name: "Chakra Balance", 
    count: 7, 
    category: "Tâm linh",
    description: "Cân bằng 7 luân xa cơ thể",
    icon: "🧘",
    layout: "line",
    positions: ["Gốc", "Xương cùng", "Búi mặt trời", "Tim", "Cổ họng", "Con mắt thứ ba", "Vương miện"]
  },
  { 
    id: "spiral", 
    name: "Spiral Galaxy", 
    count: 15, 
    category: "Nâng cao",
    description: "Vòng xoáy thiên hà - Khám phá tiềm năng",
    icon: "🌀",
    layout: "spiral",
    spirit: "Tiềm Năng Vô Hạn",
    energy: "Cosmic",
    tags: ["Nghệ thuật", "Sâu sắc"],
    isNew: true,
    positions: [
      "Tâm điểm", "Khởi đầu", "Phát triển", "Thách thức", "Vượt qua", 
      "Năng lượng 1", "Năng lượng 2", "Năng lượng 3", "Năng lượng 4", "Năng lượng 5",
      "Tiến trình 1", "Tiến trình 2", "Tiến trình 3", "Kết tinh", "Vô hạn"
    ]
  },
  { 
    id: "yearly", 
    name: "Yearly Forecast", 
    count: 12, 
    category: "Nâng cao",
    description: "Dự báo vận hạn 12 tháng",
    icon: "📅",
    layout: "circle",
    positions: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"]
  },
  { 
    id: "mystic_circle", 
    name: "Mystic Circle", 
    count: 22, 
    category: "Tâm linh",
    description: "Vòng tròn huyền bí - Đại bí mật",
    icon: "🔮",
    layout: "circle",
    positions: [
      "0. Chàng khờ", "1. Nhà ảo thuật", "2. Nữ tư tế", "3. Nữ hoàng", "4. Hoàng đế",
      "5. Giáo hoàng", "6. Tình nhân", "7. Cỗ xe", "8. Sức mạnh", "9. Ẩn sĩ",
      "10. Vòng quay", "11. Công lý", "12. Người treo", "13. Cái chết", "14. Tiết độ",
      "15. Ác quỷ", "16. Tòa tháp", "17. Ngôi sao", "18. Mặt trăng", "19. Mặt trời",
      "20. Phán xét", "21. Thế giới"
    ]
  },
  { 
    id: "grand_tableau", 
    name: "Grand Tableau", 
    count: 21, 
    category: "Nâng cao",
    description: "Cánh bướm thiên hà - 21 lá đối xứng",
    icon: "🦋",
    layout: "mandala",
    positions: [
      "Trung tâm","Trên gần","Trên xa","Dưới gần","Dưới xa",
      "Trái trong trên","Trái ngoài trên","Trái ngoài dưới","Trái trong dưới",
      "Phải trong trên","Phải ngoài trên","Phải ngoài dưới","Phải trong dưới",
      "Cánh xa trái trên","Cánh xa trái dưới",
      "Cánh xa phải trên","Cánh xa phải dưới",
      "Góc trên trái","Góc trên phải","Góc dưới trái","Góc dưới phải"
    ]
  }
];
