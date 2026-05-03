  import { useState, useEffect } from "react";
  import UI from "./components/UI";
  import LoginPage from "./components/LoginPage";
  import { BrowserRouter, Routes, Route } from "react-router-dom";
  import AdminDashboard from "./pages/AdminDashboard";

  interface Card {
    name: string;
    suit: string;
    image: string;
    index?: number;
  }

  interface User {
    email: string;
  }

  interface TarotChatMessage {
    role: "user" | "assistant";
    content: string;
  }

  type PageName = "tarot" | "energy" | "history" | "profile";

  const READING_COST = 5;
  const DEFAULT_TOKENS = 0;
  const API_BASE = "http://127.0.0.1:8002";

  const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const [currentPage, setCurrentPage] = useState<PageName>("tarot");
    const [busy, setBusy] = useState(false);
    const [followUpBusy, setFollowUpBusy] = useState(false);

    const [allCards, setAllCards] = useState<Card[]>([]);
    const [selectedCards, setSelectedCards] = useState<Card[]>([]);
    const [question, setQuestion] = useState("");
    const [currentTopic, setCurrentTopic] = useState("general");

    const [conversationId, setConversationId] = useState("");
    const [tarotMessages, setTarotMessages] = useState<TarotChatMessage[]>([]);
    const [hasChargedCurrentReading, setHasChargedCurrentReading] = useState(false);
    const [waitingForClarification, setWaitingForClarification] = useState(false);

    const [tokens, setTokens] = useState(DEFAULT_TOKENS);

// ✅ DÁN NGAY DƯỚI ĐÂY
useEffect(() => {
  if (!user?.email) return;

  fetch(`http://127.0.0.1:8002/api/users/profile-summary?email=${user.email}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setTokens(data.token_balance);
      }
    });
}, [user?.email]);
    useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");

  if (status === "success") {
    alert("🎉 Thanh toán thành công!");

    const tier = localStorage.getItem("pending_tier");

    if (tier === "starter") setTokens(prev => prev + 50);
    if (tier === "pro") setTokens(prev => prev + 150);
    if (tier === "premium") setTokens(prev => prev + 300);

    localStorage.removeItem("pending_tier");

    window.history.replaceState({}, "", "/");
  }

  if (status === "cancel") {
    alert("❌ Bạn đã hủy thanh toán");
    localStorage.removeItem("pending_tier");
    window.history.replaceState({}, "", "/");
  }
}, []);
    const resetTarotState = () => {
      setAllCards([]);
      setSelectedCards([]);
      setQuestion("");
      setCurrentTopic("general");
      setConversationId("");
      setTarotMessages([]);
      setHasChargedCurrentReading(false);
      setWaitingForClarification(false);
    };

    const pushAssistant = (content: string) => {
      if (!content) return;
      setTarotMessages((prev) => [...prev, { role: "assistant", content }]);
    };

    const pushUser = (content: string) => {
      if (!content) return;
      setTarotMessages((prev) => [...prev, { role: "user", content }]);
    };

    const handleLogin = (email: string) => {
    const role = localStorage.getItem("role"); // lấy từ login API
    setUser({ email });
    setIsLoggedIn(true);

    // 👉 QUAN TRỌNG
    if (role === "admin") {
      window.location.href = "/admin";
    } else {
      setCurrentPage("tarot");
    }
  };

    const handleLogout = () => {
      setIsLoggedIn(false);
      setUser(null);
      setCurrentPage("tarot");
      setTokens(DEFAULT_TOKENS);
      resetTarotState();
    };

    const handlePaymentSuccess = (addedTokens: number) => {
      setTokens((prev) => prev + addedTokens);
    };

    const dealAllCards = async () => {
      if (busy || !isLoggedIn) return;

      setBusy(true);
      setConversationId("");
      setTarotMessages([]);
      setHasChargedCurrentReading(false);
      setWaitingForClarification(false);

      try {
        const res = await fetch(`${API_BASE}/api/all_cards`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const data = await res.json();
        if (!data.cards || !Array.isArray(data.cards)) {
          throw new Error("Invalid response format");
        }

        const shuffled: Card[] = [...data.cards]
          .sort(() => Math.random() - 0.5)
          .map((card: Card, idx: number) => ({
            ...card,
            index: idx,
          }));

        setAllCards(shuffled);
        setSelectedCards([]);
      } catch (error) {
        console.error("Error dealing cards:", error);
        alert("❌ Lỗi khi chia bài! Vui lòng thử lại.");
      } finally {
        setBusy(false);
      }
    };

    const selectCard = (card: Card) => {
      if (!isLoggedIn || busy || followUpBusy) return;

      setSelectedCards((prev) => {
        const found = prev.find((c) => c.index === card.index);

        if (found) {
          return prev.filter((c) => c.index !== card.index);
        }

        if (prev.length >= 3) {
          alert("⚠️ Chỉ được chọn 3 lá!");
          return prev;
        }

        return [...prev, card];
      });
    };

    const confirmCards = async () => {
      if (!isLoggedIn) {
        alert("⚠️ Bạn cần đăng nhập trước khi sử dụng.");
        return;
      }

      if (selectedCards.length !== 3) {
        alert("⚠️ Hãy chọn đúng 3 lá bài!");
        return;
      }

      if (tokens < READING_COST) {
        alert("⚠️ Bạn không đủ token. Hãy vào mục Năng Lượng để nạp thêm.");
        setCurrentPage("energy");
        return;
      }

      const userQuestion = question.trim();

      setBusy(true);
      setTarotMessages([]);
      setWaitingForClarification(false);

      if (userQuestion) {
        pushUser(userQuestion);
      }

      try {
        const res = await fetch(`${API_BASE}/api/tarot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email: user?.email || "",
            topic: currentTopic,
            question: userQuestion,
            cards: selectedCards,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `API Error: ${res.status}`);
        }

        const data = await res.json();
        console.log("TAROT RESPONSE =", data);
        console.log("conversation_id =", data?.conversation_id);

        setConversationId(data.conversation_id || "");

        if (data.need_more_info) {
          setWaitingForClarification(true);
          pushAssistant(
            data.follow_up_question || "Bạn hãy nói rõ hơn để mình luận giải chính xác."
          );
          return;
        }

        setWaitingForClarification(false);
        pushAssistant(data.answer || "⚠️ Không có kết quả trả về.");

        if (!hasChargedCurrentReading) {
          setTokens((prev) => Math.max(0, prev - READING_COST));
          setHasChargedCurrentReading(true);
        }
      } catch (error) {
        console.error("Error getting reading:", error);
        pushAssistant("❌ Lỗi khi kết nối Tarot AI.");
      } finally {
        setBusy(false);
      }
    };

    const askTarotFollowUp = async (message: string) => {
      const cleaned = message.trim();
      if (!cleaned) return;

      if (!conversationId) {
        alert("⚠️ Hãy trải bài trước.");
        return;
      }

      pushUser(cleaned);
      setFollowUpBusy(true);

      try {
        const res = await fetch(`${API_BASE}/api/tarot/follow-up`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message: cleaned,
            user_email: user?.email || "",
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `API Error: ${res.status}`);
        }

        const data = await res.json();
        console.log("TAROT FOLLOW UP RESPONSE =", data);

        if (data.need_more_info) {
          setWaitingForClarification(true);
          pushAssistant(data.follow_up_question || "Bạn hãy nói rõ hơn nhé.");
          return;
        }

        setWaitingForClarification(false);
        pushAssistant(data.answer || "⚠️ Không có câu trả lời tiếp theo.");

        if (!hasChargedCurrentReading) {
          setTokens((prev) => Math.max(0, prev - READING_COST));
          setHasChargedCurrentReading(true);
        }
      } catch (error) {
        console.error("Error follow-up tarot:", error);
        pushAssistant("❌ Không thể xử lý câu hỏi tiếp theo lúc này.");
      } finally {
        setFollowUpBusy(false);
      }
    };

    return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<LoginPage onLogin={handleLogin} />}
        />

        <Route
    path="/admin"
    element={
      localStorage.getItem("role") === "admin" ? (
        <AdminDashboard />
      ) : (
        <div style={{ padding: 50 }}>❌ Không có quyền</div>
      )
    }
  />

        <Route
          path="/"
          element={
            !isLoggedIn ? (
              <LoginPage onLogin={handleLogin} />
            ) : (
              <UI
                isLoggedIn={isLoggedIn}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                user={user}
                onLogout={handleLogout}
                busy={busy}
                allCards={allCards}
                selectedCards={selectedCards}
                result=""
                question={question}
                currentTopic={currentTopic}
                onDealAll={dealAllCards}
                onSelectCard={selectCard}
                onConfirm={confirmCards}
                onSetQuestion={setQuestion}
                onSetTopic={setCurrentTopic}
                tokens={tokens}
                onPaymentSuccess={handlePaymentSuccess}
                tarotMessages={tarotMessages}
                onAskTarotFollowUp={askTarotFollowUp}
                followUpBusy={followUpBusy}
                conversationId={conversationId}
                waitingForClarification={waitingForClarification}
              />
            )
          }
        />

      </Routes>
    </BrowserRouter>
  );
  };
  export default App;