from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional
import sqlalchemy as sa

from app.database import SessionLocal
from app.dependencies import get_current_user
from app.core.limiter import limiter

router = APIRouter(prefix="/api/community", tags=["community"])

VALID_CATEGORIES = {"general", "visa", "housing", "universities", "language", "career", "tips"}
VALID_COUNTRIES  = {"Germany", "Poland", "Romania"}


# ── Schemas ──────────────────────────────────────────────────────────────────

class PostIn(BaseModel):
    title:       str = Field(..., min_length=3,  max_length=200)
    body:        str = Field(..., min_length=10, max_length=5000)
    category:    str = Field("general")
    country_tag: Optional[str] = None

class CommentIn(BaseModel):
    body: str = Field(..., min_length=2, max_length=2000)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _row(db, query, params=None):
    return db.execute(sa.text(query), params or {})

def _post_dict(row):
    return {
        "id":           row.id,
        "user_id":      row.user_id,
        "author_name":  row.author_name,
        "title":        row.title,
        "body":         row.body,
        "category":     row.category,
        "country_tag":  row.country_tag,
        "likes":        row.likes,
        "comment_count":row.comment_count,
        "created_at":   row.created_at.isoformat() if hasattr(row.created_at, "isoformat") else row.created_at,
    }


# ── GET /api/community/posts ──────────────────────────────────────────────────

@router.get("/posts")
def list_posts(
    category: Optional[str]  = None,
    country:  Optional[str]  = None,
    search:   Optional[str]  = None,
    sort:     str = "newest",
    limit:    int = 30,
    offset:   int = 0,
    current_user = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        where = ["1=1"]
        params: dict = {"limit": limit, "offset": offset}

        if category and category != "all":
            where.append("p.category = :category")
            params["category"] = category
        if country and country != "All":
            where.append("p.country_tag = :country")
            params["country"] = country
        if search:
            where.append("(LOWER(p.title) LIKE LOWER(:search) OR LOWER(p.body) LIKE LOWER(:search))")
            params["search"] = f"%{search}%"

        order = "p.created_at DESC"
        if sort == "oldest":
            order = "p.created_at ASC"
        elif sort == "popular":
            order = "likes DESC, p.created_at DESC"

        sql = f"""
            SELECT p.id, p.user_id,
                   COALESCE(sp.full_name, u.email) AS author_name,
                   p.title, p.body, p.category, p.country_tag, p.created_at,
                   COUNT(DISTINCT l.id) AS likes,
                   COUNT(DISTINCT c.id) AS comment_count
            FROM community_posts p
            JOIN users u ON u.id = p.user_id
            LEFT JOIN student_profiles sp ON sp.user_id = p.user_id
            LEFT JOIN community_likes l ON l.post_id = p.id
            LEFT JOIN community_comments c ON c.post_id = p.id
            WHERE {' AND '.join(where)}
            GROUP BY p.id, u.email, sp.full_name
            ORDER BY {order}
            LIMIT :limit OFFSET :offset
        """
        rows = _row(db, sql, params).fetchall()

        # total count
        count_sql = f"""
            SELECT COUNT(*) FROM community_posts p
            WHERE {' AND '.join(where)}
        """
        count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
        total = db.execute(sa.text(count_sql), count_params).scalar()

        # liked by current user
        liked_ids = set()
        if rows:
            post_ids = [r.id for r in rows]
            liked = db.execute(
                sa.text("SELECT post_id FROM community_likes WHERE user_id = :uid AND post_id IN :pids")
                .bindparams(sa.bindparam("pids", expanding=True)),
                {"uid": current_user.id, "pids": post_ids},
            ).fetchall()
            liked_ids = {r.post_id for r in liked}

        result = []
        for row in rows:
            d = _post_dict(row)
            d["liked_by_me"] = row.id in liked_ids
            result.append(d)

        return {"posts": result, "total": total}
    finally:
        db.close()


# ── POST /api/community/posts ─────────────────────────────────────────────────

@router.post("/posts", status_code=201)
@limiter.limit("10/hour")
def create_post(request: Request, data: PostIn, current_user = Depends(get_current_user)):
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(400, f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}")
    if data.country_tag and data.country_tag not in VALID_COUNTRIES:
        raise HTTPException(400, f"Invalid country_tag. Must be one of: {', '.join(VALID_COUNTRIES)}")

    db = SessionLocal()
    try:
        result = db.execute(sa.text("""
            INSERT INTO community_posts (user_id, title, body, category, country_tag)
            VALUES (:uid, :title, :body, :cat, :country)
            RETURNING id, created_at
        """), {
            "uid": current_user.id, "title": data.title, "body": data.body,
            "cat": data.category, "country": data.country_tag,
        }).fetchone()
        db.commit()
        return {"id": result.id, "created_at": result.created_at.isoformat() if hasattr(result.created_at, "isoformat") else result.created_at}
    finally:
        db.close()


# ── GET /api/community/posts/{id} ─────────────────────────────────────────────

@router.get("/posts/{post_id}")
def get_post(post_id: int, current_user = Depends(get_current_user)):
    db = SessionLocal()
    try:
        row = db.execute(sa.text("""
            SELECT p.id, p.user_id,
                   COALESCE(sp.full_name, u.email) AS author_name,
                   p.title, p.body, p.category, p.country_tag, p.created_at,
                   COUNT(DISTINCT l.id) AS likes,
                   COUNT(DISTINCT c.id) AS comment_count
            FROM community_posts p
            JOIN users u ON u.id = p.user_id
            LEFT JOIN student_profiles sp ON sp.user_id = p.user_id
            LEFT JOIN community_likes l ON l.post_id = p.id
            LEFT JOIN community_comments c ON c.post_id = p.id
            WHERE p.id = :pid
            GROUP BY p.id, u.email, sp.full_name
        """), {"pid": post_id}).fetchone()

        if not row:
            raise HTTPException(404, "Post not found")

        liked = db.execute(sa.text(
            "SELECT 1 FROM community_likes WHERE post_id = :pid AND user_id = :uid"
        ), {"pid": post_id, "uid": current_user.id}).fetchone()

        comments = db.execute(sa.text("""
            SELECT c.id, c.user_id,
                   COALESCE(sp.full_name, u.email) AS author_name,
                   c.body, c.created_at
            FROM community_comments c
            JOIN users u ON u.id = c.user_id
            LEFT JOIN student_profiles sp ON sp.user_id = c.user_id
            WHERE c.post_id = :pid
            ORDER BY c.created_at ASC
        """), {"pid": post_id}).fetchall()

        post = _post_dict(row)
        post["liked_by_me"] = liked is not None
        post["comments"] = [
            {
                "id": c.id,
                "user_id": c.user_id,
                "author_name": c.author_name,
                "body": c.body,
                "created_at": c.created_at.isoformat() if hasattr(c.created_at, "isoformat") else c.created_at,
            }
            for c in comments
        ]
        return post
    finally:
        db.close()


# ── DELETE /api/community/posts/{id} ─────────────────────────────────────────

@router.delete("/posts/{post_id}", status_code=204)
def delete_post(post_id: int, current_user = Depends(get_current_user)):
    db = SessionLocal()
    try:
        row = db.execute(sa.text(
            "SELECT user_id FROM community_posts WHERE id = :pid"
        ), {"pid": post_id}).fetchone()
        if not row:
            raise HTTPException(404, "Post not found")
        if row.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(403, "Not allowed")
        db.execute(sa.text("DELETE FROM community_posts WHERE id = :pid"), {"pid": post_id})
        db.commit()
    finally:
        db.close()


# ── POST /api/community/posts/{id}/like ──────────────────────────────────────

@router.post("/posts/{post_id}/like")
@limiter.limit("60/minute")
def toggle_like(request: Request, post_id: int, current_user = Depends(get_current_user)):
    db = SessionLocal()
    try:
        existing = db.execute(sa.text(
            "SELECT id FROM community_likes WHERE post_id = :pid AND user_id = :uid"
        ), {"pid": post_id, "uid": current_user.id}).fetchone()

        if existing:
            db.execute(sa.text(
                "DELETE FROM community_likes WHERE post_id = :pid AND user_id = :uid"
            ), {"pid": post_id, "uid": current_user.id})
            liked = False
        else:
            db.execute(sa.text(
                "INSERT INTO community_likes (post_id, user_id) VALUES (:pid, :uid)"
            ), {"pid": post_id, "uid": current_user.id})
            liked = True

        count = db.execute(sa.text(
            "SELECT COUNT(*) FROM community_likes WHERE post_id = :pid"
        ), {"pid": post_id}).scalar()
        db.commit()
        return {"liked": liked, "likes": count}
    finally:
        db.close()


# ── POST /api/community/posts/{id}/comments ──────────────────────────────────

@router.post("/posts/{post_id}/comments", status_code=201)
@limiter.limit("20/hour")
def add_comment(request: Request, post_id: int, data: CommentIn, current_user = Depends(get_current_user)):
    db = SessionLocal()
    try:
        exists = db.execute(sa.text(
            "SELECT 1 FROM community_posts WHERE id = :pid"
        ), {"pid": post_id}).fetchone()
        if not exists:
            raise HTTPException(404, "Post not found")

        row = db.execute(sa.text("""
            INSERT INTO community_comments (post_id, user_id, body)
            VALUES (:pid, :uid, :body)
            RETURNING id, created_at
        """), {"pid": post_id, "uid": current_user.id, "body": data.body}).fetchone()
        db.commit()

        # Fetch display name from student_profiles
        name_row = db.execute(sa.text(
            "SELECT COALESCE(full_name, :email) AS name FROM student_profiles WHERE user_id = :uid"
        ), {"uid": current_user.id, "email": current_user.email}).fetchone()
        author_name = name_row.name if name_row else current_user.email

        return {
            "id":          row.id,
            "user_id":     current_user.id,
            "author_name": author_name,
            "body":        data.body,
            "created_at":  row.created_at.isoformat() if hasattr(row.created_at, "isoformat") else row.created_at,
        }
    finally:
        db.close()


# ── DELETE /api/community/comments/{id} ──────────────────────────────────────

@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, current_user = Depends(get_current_user)):
    db = SessionLocal()
    try:
        row = db.execute(sa.text(
            "SELECT user_id FROM community_comments WHERE id = :cid"
        ), {"cid": comment_id}).fetchone()
        if not row:
            raise HTTPException(404, "Comment not found")
        if row.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(403, "Not allowed")
        db.execute(sa.text("DELETE FROM community_comments WHERE id = :cid"), {"cid": comment_id})
        db.commit()
    finally:
        db.close()
