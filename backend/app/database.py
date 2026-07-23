from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings


# Load application configuration (including database URL)
settings = get_settings()


# SQLite has a limitation: by default, one database connection
# can only be used in the same thread where it was created.
# FastAPI can handle requests using different threads,
# so we disable this restriction for SQLite.
#
# For other databases (e.g. PostgreSQL), no additional arguments are needed.
connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)


# Create SQLAlchemy engine.
# The engine is responsible for managing communication
# between the application and the database.
engine = create_engine(
    settings.database_url,
    connect_args=connect_args
)


# Create a database session factory.
# Sessions are used to execute database operations:
# - reading data
# - creating records
# - updating records
# - deleting records
#
# autocommit=False:
# Changes must be explicitly saved using db.commit().
#
# autoflush=False:
# SQLAlchemy will not automatically send pending changes
# to the database before every query.
#
# bind=engine:
# The session will use the database connection created above.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# Base class for all SQLAlchemy models.
#
# Every database model (User, Hardware, Rental)
# will inherit from this class.
#
# Example:
#
# class Hardware(Base):
#     __tablename__ = "hardware"
#     id = Column(Integer, primary_key=True)
#
# SQLAlchemy uses this class to understand
# which Python classes represent database tables.
class Base(DeclarativeBase):
    pass