import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../api/client";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start auditing in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-iris-bright hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          id="full_name"
          label="Full name"
          placeholder="Asha Mehta"
          value={form.full_name}
          onChange={set("full_name")}
          autoComplete="name"
        />
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@company.com"
          value={form.email}
          onChange={set("email")}
          autoComplete="email"
          required
        />
        <Input
          id="password"
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          hint="Use 8 or more characters."
          value={form.password}
          onChange={set("password")}
          autoComplete="new-password"
          required
        />
        {error && (
          <div className="rounded-lg border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
