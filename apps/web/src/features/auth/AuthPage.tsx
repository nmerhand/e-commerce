import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../../lib/api";
import { useAuth } from "./AuthContext";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isRegister) {
        await register(email, name, password);
      } else {
        await login(email, password);
      }
      navigate("/");
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "L’authentification a échoué. Réessayez.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <p className="eyebrow">
        {isRegister ? "Créer un compte" : "Ravi de vous revoir"}
      </p>
      <h1>{isRegister ? "Bienvenue chez Épure." : "Connectez-vous."}</h1>
      <p className="auth-intro">
        {isRegister
          ? "Retrouvez vos commandes et votre panier en un seul endroit."
          : "Accédez à votre compte et retrouvez votre sélection."}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegister && (
          <label>
            <span>Nom</span>
            <input
              autoComplete="name"
              maxLength={120}
              minLength={2}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>
        )}
        <label>
          <span>Adresse e-mail</span>
          <input
            autoComplete="email"
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label>
          <span>Mot de passe</span>
          <input
            autoComplete={isRegister ? "new-password" : "current-password"}
            maxLength={128}
            minLength={isRegister ? 12 : 1}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {isRegister && <small>12 caractères minimum.</small>}
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button button-dark auth-submit"
          disabled={submitting}
          type="submit"
        >
          {submitting
            ? "Veuillez patienter…"
            : isRegister
              ? "Créer mon compte"
              : "Se connecter"}
        </button>
      </form>

      <p className="auth-switch">
        {isRegister ? "Déjà un compte ?" : "Nouveau chez Épure ?"}{" "}
        <Link
          className="text-link"
          to={isRegister ? "/connexion" : "/inscription"}
        >
          {isRegister ? "Se connecter" : "Créer un compte"}
        </Link>
      </p>
    </main>
  );
}
