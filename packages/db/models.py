import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, Text, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, declarative_base
from pgvector.sqlalchemy import Vector

Base = declarative_base()

class UserRole(enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"

class MessageRole(enum.Enum):
    student = "student"
    assistant = "assistant"

class Institution(Base):
    __tablename__ = "institutions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    domain = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="institution")
    subjects = relationship("Subject", back_populates="institution")

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.id"), nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    grade = Column(Integer, nullable=True)
    subject_focus = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="users")
    sessions = relationship("Session", back_populates="student")
    analytics_events = relationship("AnalyticsEvent", back_populates="student")

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.id"), nullable=False)
    name = Column(String, nullable=False)
    curriculum_loaded = Column(Boolean, default=False)

    institution = relationship("Institution", back_populates="subjects")
    chunks = relationship("CurriculumChunk", back_populates="subject")
    sessions = relationship("Session", back_populates="subject")

class CurriculumChunk(Base):
    __tablename__ = "curriculum_chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(384), nullable=False)
    chapter = Column(String, nullable=False)
    page_ref = Column(Integer, nullable=True)

    subject = relationship("Subject", back_populates="chunks")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    student = relationship("User", back_populates="sessions")
    subject = relationship("Subject", back_populates="sessions")
    messages = relationship("Message", back_populates="session")
    analytics_events = relationship("AnalyticsEvent", back_populates="session")

class Message(Base):
    __tablename__ = "messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    role = Column(Enum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)
    intent_class = Column(String, nullable=True)
    hint_level = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="messages")

class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    event_type = Column(String, nullable=False)
    event_metadata = Column(JSONB, nullable=False, name="metadata")
    occurred_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="analytics_events")
    session = relationship("Session", back_populates="analytics_events")
