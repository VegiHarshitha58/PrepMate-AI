import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL


load_dotenv()


def get_database_url():
    required = [
        "DB_USER",
        "DB_PASSWORD",
        "DB_HOST",
        "DB_NAME",
    ]

    missing = [
        key for key in required
        if not os.getenv(key)
    ]

    if missing:
        raise RuntimeError(
            "Missing database environment variables: "
            + ", ".join(missing)
        )

    return URL.create(
        drivername="postgresql+psycopg2",
        username=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=int(
            os.getenv("DB_PORT", "5432")
        ),
        database=os.getenv("DB_NAME"),
    )


database_url = get_database_url()

engine = create_engine(
    database_url,
    pool_pre_ping=True,
)


def test_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        print(
            "✅ PostgreSQL connection successful!"
        )

    except Exception as exc:
        print(
            "❌ PostgreSQL connection failed:"
        )
        print(exc)


if __name__ == "__main__":
    test_connection()