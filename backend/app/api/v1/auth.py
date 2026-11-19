from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.db.mongodb import get_db_collection
from app.models.user import (
    UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse, UserRole
)
from app.core.security import (
    hash_password, verify_password, create_access_token, get_current_user_token_payload
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(request: UserRegisterRequest):
    users_col = get_db_collection("users")
    
    # Check if user already exists
    existing = await users_col.find_one({"email": request.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_doc = {
        "name": request.name,
        "email": request.email.lower(),
        "hashed_password": hash_password(request.password),
        "role": request.role.value,
        "title": request.title,
        "company": request.company,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    res = await users_col.insert_one(user_doc)
    user_id = str(res.inserted_id)

    user_response = UserResponse(
        id=user_id,
        name=request.name,
        email=request.email.lower(),
        role=request.role,
        title=request.title,
        company=request.company,
        created_at=user_doc["created_at"],
        is_active=True
    )

    access_token = create_access_token(data={
        "sub": user_id,
        "email": user_response.email,
        "role": user_response.role.value,
        "name": user_response.name
    })

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest):
    users_col = get_db_collection("users")
    user = await users_col.find_one({"email": request.email.lower()})
    
    if not user or not verify_password(request.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    user_id = str(user["_id"])
    user_response = UserResponse(
        id=user_id,
        name=user["name"],
        email=user["email"],
        role=UserRole(user.get("role", "candidate")),
        title=user.get("title"),
        company=user.get("company"),
        created_at=user.get("created_at", datetime.now(timezone.utc)),
        is_active=user.get("is_active", True)
    )

    access_token = create_access_token(data={
        "sub": user_id,
        "email": user_response.email,
        "role": user_response.role.value,
        "name": user_response.name
    })

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.get("/me", response_model=UserResponse)
async def get_me(token_payload: dict = Depends(get_current_user_token_payload)):
    user_id = token_payload.get("sub")
    users_col = get_db_collection("users")
    user = await users_col.find_one({"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=UserRole(user.get("role", "candidate")),
        title=user.get("title"),
        company=user.get("company"),
        created_at=user.get("created_at", datetime.now(timezone.utc)),
        is_active=user.get("is_active", True)
    )

@router.get("/users", response_model=List[UserResponse])
async def list_users(token_payload: dict = Depends(get_current_user_token_payload)):
    # Recruiters and admins can list users
    if token_payload.get("role") not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied.")
    
    users_col = get_db_collection("users")
    cursor = users_col.find()
    users = await cursor.to_list(length=100)
    
    return [
        UserResponse(
            id=str(u["_id"]),
            name=u["name"],
            email=u["email"],
            role=UserRole(u.get("role", "candidate")),
            title=u.get("title"),
            company=u.get("company"),
            created_at=u.get("created_at", datetime.now(timezone.utc)),
            is_active=u.get("is_active", True)
        )
        for u in users
    ]
