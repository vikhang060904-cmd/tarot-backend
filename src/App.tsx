import { useState, useEffect, useCallback } from "react";
import UI from "./components/UI";
import LoginPage from "./components/LoginPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import { SPREAD_TYPES } from "./constants/spreads";

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

let READING_COST = 5;
const DEFAULT_TOKENS = 0;
const API_BASE = "";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("email"));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("email");
    return saved ? { email: saved } : null;
  });

  const [currentPage, setCurrentPage] = useState<PageName>(() => {
    return (localStorage.getItem("currentPage") as PageName) || "tarot";
  });
  const [busy, setBusy] = useState(false);
  const [followUpBusy, setFollowUpBusy] = useState(false);

  const [allCards, setAllCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [question, setQuestion] = useState("");
  const [currentTopic, setCurrentTopic] = useState("general");
  const [birthDate, setBirthDate] = useState(() => localStorage.getItem("birthDate") || "");

  // PERSISTENT STATE
  const [result, setResult] = useState(() => localStorage.getItem("tarotResult") || "");
  const [conversationId, setConversationId] = useState<string>(() => localStorage.getItem("conversationId") || "");
  const [tarotMessages, setTarotMessages] = useState<TarotChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("tarotMessages");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [spreadType, setSpreadType] = useState(SPREAD_TYPES[1].id); // Default to Three Card
  const [hasChargedCurrentReading, setHasChargedCurrentReading] = useState(false);
  const [waitingForClarification, setWaitingForClarification] = useState(false);

  const [tokens, setTokens] = useState(DEFAULT_TOKENS);

  useEffect(() => {
    if (!user?.email) return;

    fetch(`${API_BASE}/api/users/tokens?email=${user.email}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTokens(data.token_balance);
        }
      });
  }, [user?.email]);

  useEffect(() => {
    fetch(`${API_BASE}/api/tarot/config`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          READING_COST = data.reading_cost;
        }
      })
      .catch((err) => console.error("Error loading tarot cost config:", err));
  }, []);

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    if (status === "success") {
      alert("🎉 Thanh toán thành công!");
      const tier = localStorage.getItem("pending_tier");
      if (tier === "starter") setTokens((prev) => prev + 50);
      if (tier === "pro") setTokens((prev) => prev + 150);
      if (tier === "premium") setTokens((prev) => prev + 300);
      localStorage.removeItem("pending_tier");
      window.history.replaceState({}, "", "/");
    }

    if (status === "cancel") {
      alert("❌ Bạn đã hủy thanh toán");
      localStorage.removeItem("pending_tier");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const updateSpreadType = (type: string) => {
    setSpreadType(type);
    const spread = SPREAD_TYPES.find(s => s.id === type);
    if (spread) {
      if (spread.category === 'Tâm linh') setDeckArrangement('spiral');
      else if (spread.category === 'Tình duyên') setDeckArrangement('fan');
      else if (spread.category === 'Nâng cao') setDeckArrangement('rows');
      else setDeckArrangement('arc');
      setDealCount(spread.count);
    }
  };

  const resetTarotState = () => {
    setAllCards([]);
    setSelectedCards([]);
    setQuestion("");
    setCurrentTopic("general");
    setResult("");
    setConversationId("");
    setTarotMessages([]);
    setHasChargedCurrentReading(false);
    setWaitingForClarification(false);
    localStorage.removeItem("tarotResult");
    localStorage.removeItem("conversationId");
    localStorage.removeItem("tarotMessages");
  };


  const pushAssistant = (content: string) => {
    if (!content) return;
    setTarotMessages((prev) => {
      const next = [...prev, { role: "assistant" as const, content }];
      localStorage.setItem("tarotMessages", JSON.stringify(next));
      return next;
    });
  };

  const pushUser = (content: string) => {
    if (!content) return;
    setTarotMessages((prev) => {
      const next = [...prev, { role: "user" as const, content }];
      localStorage.setItem("tarotMessages", JSON.stringify(next));
      return next;
    });
  };

  const handleLogin = (email: string) => {
    const role = localStorage.getItem("role");
    localStorage.setItem("email", email);
    setUser({ email });
    setIsLoggedIn(true);
    if (role === "admin") {
      window.location.href = "/admin";
    } else {
      setCurrentPage("tarot");
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("currentPage");
    localStorage.removeItem("tarotResult");
    localStorage.removeItem("conversationId");
    localStorage.removeItem("tarotMessages");
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage("tarot");
    setTokens(DEFAULT_TOKENS);
    resetTarotState();
  }, []);

  const handlePaymentSuccess = (addedTokens: number) => {
    setTokens((prev) => prev + addedTokens);
  };

  const [dealMode, setDealMode] = useState<"random" | "fixed" | "seeded" | "custom" | "bysuit">("random");
  const [dealSuit, setDealSuit] = useState<string>("");
  const [dealSeed, setDealSeed] = useState<number>(0);
  const [dealCount, setDealCount] = useState<number>(3);
  const [deckArrangement, setDeckArrangement] = useState<"fan" | "arc" | "rows" | "spiral" | "infinity" | "waves" | "chaos" | "orbit">("arc");
  const maxSelectable = SPREAD_TYPES.find(s => s.id === spreadType)?.count || 3;

  const resetReading = useCallback(() => {
    setResult("");
    setConversationId("");
    setTarotMessages([]);
    setSelectedCards([]);
    setQuestion("");
    setHasChargedCurrentReading(false);
    setWaitingForClarification(false);
    
    localStorage.removeItem("tarotResult");
    localStorage.removeItem("conversationId");
    localStorage.removeItem("tarotMessages");
    localStorage.removeItem("question");
    
    setCurrentPage("tarot");
  }, []);

  const dealAllCards = useCallback(async () => {
    if (busy || !isLoggedIn) return [];
    setBusy(true);
    resetTarotState();
    try {
      const res = await fetch(`${API_BASE}/api/all_cards`);
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      const all: Card[] = data.cards.map((card: Card, idx: number) => ({ ...card, index: idx }));
      
      let finalDeck = [...all];
      if (dealMode === "random") finalDeck.sort(() => Math.random() - 0.5);
      else if (dealMode === "seeded") {
          let r = dealSeed;
          const rand = () => { r = (r * 1664525 + 1013904223) % 4294967296; return r / 4294967296; };
          finalDeck.sort(() => rand() - 0.5);
      } else if (dealMode === "bysuit" && dealSuit) {
          finalDeck = all.filter(c => c.suit?.toLowerCase() === dealSuit.toLowerCase()).sort(() => Math.random() - 0.5);
      } else if (dealMode === "custom") {
          finalDeck = [...all].sort(() => Math.random() - 0.5).slice(0, dealCount);
      }
      setAllCards(finalDeck);
      setSelectedCards([]);
      return finalDeck;
    } catch (e) {
      console.error(e);
      return [];
    } finally {
      setBusy(false);
    }
  }, [busy, isLoggedIn, dealMode, dealSeed, dealSuit, dealCount]);

  const selectCard = useCallback((card: Card) => {
    setSelectedCards((prev) => {
      if (prev.some(c => c.index === card.index)) return prev.filter(c => c.index !== card.index);
      if (prev.length >= maxSelectable) return prev;
      return [...prev, card];
    });
  }, [maxSelectable]);

  const confirmCards = useCallback(async (overrideTopic?: string) => {
    if (!isLoggedIn || selectedCards.length !== maxSelectable) return;
    if (tokens < READING_COST) {
      const isEn = localStorage.getItem("tarot_lang") === "en";
      alert(isEn ? "⚠️ Not enough tokens." : "⚠️ Bạn không đủ token.");
      setCurrentPage("energy");
      return;
    }
    const userQuestion = question.trim();
    setBusy(true);
    setResult("");
    setWaitingForClarification(false);
    
    // Clear old state
    setTarotMessages([]);
    localStorage.removeItem("tarotMessages");
    localStorage.removeItem("tarotResult");
    localStorage.removeItem("conversationId");

    if (userQuestion) {
      pushUser(userQuestion);
    }

    try {
      const res = await fetch(`${API_BASE}/api/tarot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: user?.email || "",
          topic: overrideTopic || currentTopic,
          question: userQuestion,
          cards: selectedCards,
          spread_type: spreadType,
          birth_date: birthDate,
          language: localStorage.getItem("tarot_lang") || "vi",
        }),
      });
      const data = await res.json();
      if (data.need_tokens) { setCurrentPage("energy"); return; }
      
      if (data.need_more_info) {
        setWaitingForClarification(true);
        const isEn = localStorage.getItem("tarot_lang") === "en";
        pushAssistant(data.follow_up_question || (isEn ? "Please clarify." : "Bạn hãy nói rõ hơn."));
      } else {
        setWaitingForClarification(false);
        setResult(data.answer || "");
        localStorage.setItem("tarotResult", data.answer || "");
        pushAssistant(data.answer || "");
        
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
          localStorage.setItem("conversationId", data.conversation_id);
        }
      }
      
      if (user?.email) {
          const tRes = await fetch(`${API_BASE}/api/users/tokens?email=${user.email}`);
          const tData = await tRes.json();
          if (tData.success) setTokens(tData.token_balance);
      }
    } catch (e) {
      console.error(e);
      const isEn = localStorage.getItem("tarot_lang") === "en";
      pushAssistant(isEn ? "❌ Error connecting to Tarot AI." : "❌ Lỗi khi kết nối Tarot AI.");
    } finally {
      setBusy(false);
    }
  }, [isLoggedIn, selectedCards, maxSelectable, tokens, question, currentTopic, user?.email, spreadType]);

  const askTarotFollowUp = useCallback(async (message: string) => {
    console.log("DEBUG: askTarotFollowUp start, message:", message, "convId:", conversationId);
    const cleaned = message.trim();
    if (!cleaned || !conversationId) {
      console.error("DEBUG: Missing message or conversationId", { cleaned, conversationId });
      return;
    }

    pushUser(cleaned);
    setFollowUpBusy(true);

    try {
      const res = await fetch(`${API_BASE}/api/tarot/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: cleaned,
          user_email: user?.email || "",
          language: localStorage.getItem("tarot_lang") || "vi",
        }),
      });
      const data = await res.json();
      if (data.need_more_info) {
        setWaitingForClarification(true);
        const isEn = localStorage.getItem("tarot_lang") === "en";
        pushAssistant(data.follow_up_question || (isEn ? "Please clarify." : "Nói rõ hơn nhé."));
      } else {
        setWaitingForClarification(false);
        pushAssistant(data.answer || "");
        
        // Sync tokens from backend
        if (user?.email) {
          const tRes = await fetch(`${API_BASE}/api/users/tokens?email=${user.email}`);
          const tData = await tRes.json();
          if (tData.success) setTokens(tData.token_balance);
        }
      }
    } catch (e) {
      console.error(e);
      const isEn = localStorage.getItem("tarot_lang") === "en";
      pushAssistant(isEn ? "❌ System error." : "❌ Lỗi hệ thống.");
    } finally {
      setFollowUpBusy(false);
    }
  }, [conversationId, user?.email, hasChargedCurrentReading]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/admin" element={localStorage.getItem("role") === "admin" ? <AdminDashboard /> : <div style={{ padding: 50 }}>❌ Không quyền</div>} />
        <Route path="/" element={!isLoggedIn ? <LoginPage onLogin={handleLogin} /> : (
          <UI
            isLoggedIn={isLoggedIn} currentPage={currentPage} onPageChange={setCurrentPage} user={user} onLogout={handleLogout}
            busy={busy} allCards={allCards} selectedCards={selectedCards} result={result} question={question} currentTopic={currentTopic}
            onDealAll={dealAllCards} onSelectCard={selectCard} onConfirm={confirmCards} onSetQuestion={setQuestion} onSetTopic={setCurrentTopic}
            tokens={tokens} onPaymentSuccess={handlePaymentSuccess} tarotMessages={tarotMessages} onAskTarotFollowUp={askTarotFollowUp}
            followUpBusy={followUpBusy} conversationId={conversationId} waitingForClarification={waitingForClarification}
            dealMode={dealMode} onSetDealMode={setDealMode} dealSuit={dealSuit} onSetDealSuit={setDealSuit} maxSelectable={maxSelectable}
            dealSeed={dealSeed} onSetDealSeed={setDealSeed} dealCount={dealCount} onSetDealCount={setDealCount}
            spreadType={spreadType} onSetSpreadType={updateSpreadType} deckArrangement={deckArrangement} onSetDeckArrangement={setDeckArrangement}
            onReset={resetReading}
            birthDate={birthDate}
            onSetBirthDate={setBirthDate}
          />
        )} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;
