// ============================================================
// TAROT TALK — Translations (EN / VI)
// ============================================================

export type Language = "vi" | "en";

// Kiểu cấu trúc dùng string thay vì literal để EN/VI không conflict
export interface Translations {
  sidebar: {
    tagline: string;
    nav: { tarot: string; energy: string; history: string; profile: string };
    settings: string;
    adminPage: string;
    adminLogin: string;
    openMenu: string;
    closeMenu: string;
    tokens: string;
    meditation: { on: string; off: string; titleOn: string; titleOff: string };
    audio: { on: string; off: string; titleOn: string; titleOff: string };
  };
  adminModal: {
    title: string;
    subtitle: string;
    placeholderEmail: string;
    placeholder: string;
    submit: string;
    submitting: string;
    cancel: string;
    errorEmpty: string;
    errorDefault: string;
    errorNoAccess: string;
  };
  tarot: {
    emptyResult: string;
    headings: {
      directAnswer: string; overview: string;
      card1: string; card2: string; card3: string;
      summary: string; advice: string;
      past: string; present: string; future: string;
      influence: string; definition: string;
    };
    birthDate: string;
    birthDatePlaceholder: string;
    zodiac: string;
    element: string;
    question: string;
    questionPlaceholder: string;
    topicLabel: string;
    topics: {
      general: string; love: string; career: string;
      finance: string; health: string; spiritual: string;
    };
    dealBtn: string;
    dealingBtn: string;
    confirmBtn: string;
    confirmingBtn: string;
    readingTitle: string;
    chatPlaceholder: string;
    sendBtn: string;
    sendingBtn: string;
    selectedCards: string;
    cardPosition: (i: number) => string;
    noTokens: string;
    resetBtn: string;
    shareBtn: string;
    spread: string;
    arrangement: string;
    needMoreInfo: string;
    errorConnect: string;
    errorSystem: string;
  };
  energy: {
    title: string;
    currentTokens: string;
    choosePackage: string;
    buy: string;
    packages: {
      starter: { name: string; tokens: number };
      pro: { name: string; tokens: number };
      premium: { name: string; tokens: number };
    };
  };
  history: {
    title: string;
    noHistory: string;
    date: string;
    cards: string;
    topic: string;
  };
  profile: {
    title: string;
    email: string;
    tokens: string;
    logout: string;
  };
  login: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submitLogin: string;
    submitRegister: string;
    switchToRegister: string;
    switchToLogin: string;
    loading: string;
  };
  common: {
    noPermission: string;
    close: string;
    loading: string;
    error: string;
    success: string;
    paymentSuccess: string;
    paymentCancel: string;
  };
}

export const translations: Record<Language, Translations> = {
  vi: {
    // ── Sidebar ──
    sidebar: {
      tagline: "MYSTIC READING",
      nav: {
        tarot: "Tarot",
        energy: "Năng Lượng",
        history: "Nhật Ký",
        profile: "Hồ Sơ",
      },
      settings: "Cài Đặt Nghi Thức",
      adminPage: "Trang Admin",
      adminLogin: "Đăng Nhập Admin",
      openMenu: "Mở menu",
      closeMenu: "Đóng menu",
      tokens: "Token",
      meditation: {
        on: "Đang Thiền",
        off: "Thiền",
        titleOn: "Thoát chế độ thiền",
        titleOff: "Chế độ thiền định",
      },
      audio: {
        on: "Nhạc",
        off: "Tắt",
        titleOn: "Tắt âm thanh",
        titleOff: "Mở âm thanh",
      },
    },

    // ── Admin Modal ──
    adminModal: {
      title: "Xác Thực Admin",
      subtitle: "Nhập email và mật khẩu tài khoản admin",
      placeholderEmail: "📧 Email admin",
      placeholder: "🔑 Mật khẩu",
      submit: "🔓 Vào Trang Admin",
      submitting: "⏳ Đang xác thực...",
      cancel: "Huỷ",
      errorEmpty: "Vui lòng nhập đủ email và mật khẩu",
      errorDefault: "❌ Email hoặc mật khẩu không đúng",
      errorNoAccess: "Tài khoản không có quyền admin",
    },

    // ── TarotPage ──
    tarot: {
      emptyResult:
        'Kết quả luận giải sẽ xuất hiện sau khi bạn chọn đủ các lá bài và bấm "Khai Mở Vận Mệnh".',
      headings: {
        directAnswer: "TRẢ LỜI TRỰC TIẾP",
        overview: "LUẬN GIẢI TỔNG QUAN",
        card1: "LÁ BÀI 1",
        card2: "LÁ BÀI 2",
        card3: "LÁ BÀI 3",
        summary: "TỔNG KẾT",
        advice: "LỜI KHUYÊN",
        past: "Quá khứ",
        present: "Hiện tại",
        future: "Tương lai",
        influence: "Tác động",
        definition: "Định nghĩa",
      },
      birthDate: "Ngày sinh (tùy chọn)",
      birthDatePlaceholder: "Ngày sinh của bạn",
      zodiac: "Cung hoàng đạo",
      element: "Nguyên tố",
      question: "Câu hỏi của bạn",
      questionPlaceholder: "Nhập câu hỏi bí ẩn của bạn...",
      topicLabel: "Chủ đề",
      topics: {
        general: "Tổng quát",
        love: "Tình yêu",
        career: "Sự nghiệp",
        finance: "Tài chính",
        health: "Sức khỏe",
        spiritual: "Tâm linh",
      },
      dealBtn: "🌌 Xáo Bài",
      dealingBtn: "✨ Đang Xáo...",
      confirmBtn: "🔮 Khai Mở Vận Mệnh",
      confirmingBtn: "✨ Đang giải mã...",
      readingTitle: "✨ Luận Giải",
      chatPlaceholder: "Hỏi thêm về lá bài...",
      sendBtn: "Gửi",
      sendingBtn: "...",
      selectedCards: "Lá bài đã chọn",
      cardPosition: (i: number) => `Lá ${i + 1}`,
      noTokens: "⚠️ Bạn không đủ token.",
      resetBtn: "🔄 Trải Mới",
      shareBtn: "📸 Chụp Màn Hình",
      spread: "Kiểu trải",
      arrangement: "Sắp xếp",
      needMoreInfo: "Nói rõ hơn nhé.",
      errorConnect: "❌ Lỗi khi kết nối Tarot AI.",
      errorSystem: "❌ Lỗi hệ thống.",
    },

    // ── Energy / Payment Page ──
    energy: {
      title: "Nạp Năng Lượng",
      currentTokens: "Token hiện tại",
      choosePackage: "Chọn gói năng lượng",
      buy: "Mua ngay",
      packages: {
        starter: { name: "Starter", tokens: 50 },
        pro: { name: "Pro", tokens: 150 },
        premium: { name: "Premium", tokens: 300 },
      },
    },

    // ── History Page ──
    history: {
      title: "Nhật Ký Tarot",
      noHistory: "Chưa có lịch sử đọc bài.",
      date: "Ngày",
      cards: "Lá bài",
      topic: "Chủ đề",
    },

    // ── Profile Page ──
    profile: {
      title: "Hồ Sơ",
      email: "Email",
      tokens: "Token",
      logout: "Đăng xuất",
    },

    // ── Login Page ──
    login: {
      title: "TAROT TALK",
      subtitle: "Hành trình tâm linh bắt đầu tại đây",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      passwordLabel: "Mật khẩu",
      passwordPlaceholder: "Nhập mật khẩu",
      submitLogin: "Đăng Nhập",
      submitRegister: "Đăng Ký",
      switchToRegister: "Chưa có tài khoản? Đăng ký",
      switchToLogin: "Đã có tài khoản? Đăng nhập",
      loading: "Đang xử lý...",
    },

    // ── Misc ──
    common: {
      noPermission: "❌ Không quyền",
      close: "Đóng",
      loading: "Đang tải...",
      error: "Lỗi",
      success: "Thành công",
      paymentSuccess: "🎉 Thanh toán thành công!",
      paymentCancel: "❌ Bạn đã hủy thanh toán",
    },
  },

  // ============================================================
  en: {
    // ── Sidebar ──
    sidebar: {
      tagline: "MYSTIC READING",
      nav: {
        tarot: "Tarot",
        energy: "Energy",
        history: "Journal",
        profile: "Profile",
      },
      settings: "Ritual Settings",
      adminPage: "Admin Panel",
      adminLogin: "Admin Login",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      tokens: "Tokens",
      meditation: {
        on: "Meditating",
        off: "Meditate",
        titleOn: "Exit meditation mode",
        titleOff: "Meditation mode",
      },
      audio: {
        on: "Music",
        off: "Muted",
        titleOn: "Mute audio",
        titleOff: "Unmute audio",
      },
    },

    // ── Admin Modal ──
    adminModal: {
      title: "Admin Authentication",
      subtitle: "Enter your admin email and password",
      placeholderEmail: "📧 Admin email",
      placeholder: "🔑 Password",
      submit: "🔓 Enter Admin Panel",
      submitting: "⏳ Verifying...",
      cancel: "Cancel",
      errorEmpty: "Please enter both email and password",
      errorDefault: "❌ Incorrect email or password",
      errorNoAccess: "This account does not have admin rights",
    },

    // ── TarotPage ──
    tarot: {
      emptyResult:
        'The reading will appear after you select all cards and click "Reveal Destiny".',
      headings: {
        directAnswer: "DIRECT ANSWER",
        overview: "OVERALL READING",
        card1: "CARD 1",
        card2: "CARD 2",
        card3: "CARD 3",
        summary: "SUMMARY",
        advice: "ADVICE",
        past: "Past",
        present: "Present",
        future: "Future",
        influence: "Influence",
        definition: "Definition",
      },
      birthDate: "Date of birth (optional)",
      birthDatePlaceholder: "Your date of birth",
      zodiac: "Zodiac sign",
      element: "Element",
      question: "Your question",
      questionPlaceholder: "Enter your mystical question...",
      topicLabel: "Topic",
      topics: {
        general: "General",
        love: "Love",
        career: "Career",
        finance: "Finance",
        health: "Health",
        spiritual: "Spiritual",
      },
      dealBtn: "🌌 Shuffle Cards",
      dealingBtn: "✨ Shuffling...",
      confirmBtn: "🔮 Reveal Destiny",
      confirmingBtn: "✨ Decoding...",
      readingTitle: "✨ Reading",
      chatPlaceholder: "Ask more about the cards...",
      sendBtn: "Send",
      sendingBtn: "...",
      selectedCards: "Selected cards",
      cardPosition: (i: number) => `Card ${i + 1}`,
      noTokens: "⚠️ You don't have enough tokens.",
      resetBtn: "🔄 New Reading",
      shareBtn: "📸 Screenshot",
      spread: "Spread type",
      arrangement: "Layout",
      needMoreInfo: "Please elaborate.",
      errorConnect: "❌ Failed to connect to Tarot AI.",
      errorSystem: "❌ System error.",
    },

    // ── Energy / Payment Page ──
    energy: {
      title: "Recharge Energy",
      currentTokens: "Current tokens",
      choosePackage: "Choose an energy package",
      buy: "Buy now",
      packages: {
        starter: { name: "Starter", tokens: 50 },
        pro: { name: "Pro", tokens: 150 },
        premium: { name: "Premium", tokens: 300 },
      },
    },

    // ── History Page ──
    history: {
      title: "Tarot Journal",
      noHistory: "No reading history yet.",
      date: "Date",
      cards: "Cards",
      topic: "Topic",
    },

    // ── Profile Page ──
    profile: {
      title: "Profile",
      email: "Email",
      tokens: "Tokens",
      logout: "Logout",
    },

    // ── Login Page ──
    login: {
      title: "TAROT TALK",
      subtitle: "Your spiritual journey begins here",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      submitLogin: "Login",
      submitRegister: "Register",
      switchToRegister: "No account? Register",
      switchToLogin: "Already have an account? Login",
      loading: "Processing...",
    },

    common: {
      noPermission: "❌ Unauthorized",
      close: "Close",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      paymentSuccess: "🎉 Payment successful!",
      paymentCancel: "❌ Payment cancelled",
    },
  },
};
