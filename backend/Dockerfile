FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY ./app /app/app

RUN pip install --no-cache-dir fastapi uvicorn[standard] psycopg2-binary sqlalchemy alembic redis pydantic[email] python-jose passlib[bcrypt]

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


