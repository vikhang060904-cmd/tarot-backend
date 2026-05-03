import { useState } from "react";
import "./LoginPage.css";

interface LoginPageProps {
  onLogin: (email: string) => void;
}

const API = "http://127.0.0.1:8002";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= LOGIN =================
  const handleLogin = async (e: React.FormEvent) => {
  console.log("CLICK LOGIN");
  e.preventDefault();
  setError("");

  if (!email || !password) {
    setError("⚠️ Vui lòng nhập đầy đủ");
    return;
  }

  try {
    setLoading(true);

    const res = await fetch("http://127.0.0.1:8002/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    // 🔥 FIX QUAN TRỌNG
    const text = await res.text();
    console.log("RAW RESPONSE:", text);

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server trả về không phải JSON");
    }

    console.log("LOGIN RESPONSE:", data);

    if (!res.ok) {
      throw new Error(data?.detail || "❌ Sai tài khoản hoặc mật khẩu");
    }

    // ✅ Lưu local
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.role);

    // ✅ callback
    onLogin(data.email);

  } catch (err: any) {
    console.error("LOGIN ERROR:", err);
    setError(err.message || "❌ Lỗi hệ thống");
  } finally {
    setLoading(false);
  }
};
  // ================= SIGNUP =================
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !passwordConfirm) {
      setError("⚠️ Nhập đầy đủ thông tin");
      return;
    }

    if (password !== passwordConfirm) {
      setError("❌ Mật khẩu không khớp");
      return;
    }

    if (password.length < 6) {
      setError("❌ Mật khẩu phải >= 6 ký tự");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      console.log("SIGNUP RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data?.detail || "Signup failed");
      }

      alert("🎉 Tạo tài khoản thành công!");

      setIsSignup(false);
      setPassword("");
      setPasswordConfirm("");

    } catch (err: any) {
      console.error("SIGNUP ERROR:", err);
      setError(err.message || "❌ Không tạo được tài khoản");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <h2>{isSignup ? "📝 Đăng ký" : "🔐 Đăng nhập"}</h2>

        {error && <p className="error">{error}</p>}

        <form
  onSubmit={(e) => {
    if (isSignup) handleSignup(e);
    else handleLogin(e);
  }}
>

          <input
            type="email"
            placeholder="📧 Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="🔑 Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {isSignup && (
            <input
              type="password"
              placeholder="🔁 Nhập lại mật khẩu"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? "⏳ Đang xử lý..."
              : isSignup
              ? "Đăng ký"
              : "Đăng nhập"}
          </button>
        </form>

        <p className="switch">
          {isSignup ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Đăng nhập" : "Đăng ký"}
          </span>
        </p>

      </div>
    </div>
  );
}