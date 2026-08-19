from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5174"]
    FRONTEND_URL: str = "http://localhost:5174"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "onboarding@resend.dev"
    RESEND_FROM_NAME: str = "UniPath"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    DEBUG: bool = False
    ADMIN_EMAILS: list[str] = []
    SENTRY_DSN: str = ""
    ENVIRONMENT: str = "development"
    EMAIL_WEBHOOK_SECRET: str = ""

    # Paymob (Egypt) — payment gateway. Leave blank in dev; checkout endpoints
    # return a clear 503 until these are set, rather than silently failing.
    # Names match the Paymob dashboard's own labels exactly (Settings > API
    # Keys) so there's no ambiguity about which of the 4 keys goes where —
    # note "Secret key" here is NOT the same box as the dashboard's "API key".
    PAYMOB_SECRET_KEY: str = ""       # dashboard: "Secret key" — used server-side to create intentions
    PAYMOB_PUBLIC_KEY: str = ""       # dashboard: "Public key" — safe to expose to the frontend
    PAYMOB_HMAC_SECRET: str = ""      # dashboard: "HMAC" — used to verify webhook authenticity
    PAYMOB_INTEGRATION_IDS: list[int] = []   # from Payments > Payment Integrations, not the API Keys page
    # This Egyptian-registered Paymob account settles in EGP only (confirmed
    # by a live test charge). Plan prices stay in USD everywhere the user
    # sees them; checkout converts to EGP at this rate right before charging.
    # Update periodically — this is a static rate, not a live feed.
    PAYMOB_CURRENCY: str = "EGP"
    USD_TO_EGP_RATE: float = 50.18
    PAYMOB_BASE_URL: str = "https://accept.paymob.com"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
