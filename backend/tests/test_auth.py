import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.models.user import UserRole

def test_password_hashing():
    plain = "SuperSecurePass123!"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_flow():
    payload = {
        "sub": "user_12345",
        "email": "candidate@nexthire.ai",
        "role": UserRole.CANDIDATE.value,
        "name": "Jane Doe"
    }
    token = create_access_token(payload)
    assert isinstance(token, str)
    assert len(token) > 20

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user_12345"
    assert decoded["email"] == "candidate@nexthire.ai"
    assert decoded["role"] == "candidate"
    assert decoded["name"] == "Jane Doe"
