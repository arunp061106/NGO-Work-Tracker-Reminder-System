from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks, Request
from fastapi.responses import JSONResponse
import os
import shutil
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth, email_service
from database import engine, get_db, SessionLocal

# Create database tables — wrapped so a cold-start on Vercel doesn't crash
# if the DB is momentarily unreachable.
try:
    models.Base.metadata.create_all(bind=engine)

    # Seed/ensure specific admin user and clean up demo logins
    def seed_admin_user():
        db = SessionLocal()
        try:
            # Delete old demo login accounts for security
            for demo_email in ["admin@ngo.org", "staff@ngo.org"]:
                demo_user = db.query(models.User).filter(models.User.email == demo_email).first()
                if demo_user:
                    db.delete(demo_user)

            # Ensure arunp061106@gmail.com is approved and set as admin if already registered
            arun = db.query(models.User).filter(models.User.email == "arunp061106@gmail.com").first()
            if arun:
                arun.role = "admin"
                arun.is_approved = True

            db.commit()
            print("[INFO] Database seed/migration successfully completed.")
        except Exception as e:
            db.rollback()
            print(f"[WARN] Database seeding failed: {e}")
        finally:
            db.close()

    seed_admin_user()
except Exception as e:
    print(f"[WARN] Could not run create_all or seed: {e}")

app = FastAPI(
    title="NGO Work Tracker API",
    description="Backend API for NGO Staff Work Tracker & Reminder System",
    version="1.0.0"
)

# CORS configuration — allow all localhost origins for development,
# and all https origins for production (Vercel, custom domains, etc.)
# JWT tokens are sent via Authorization header, not cookies, so
# allow_credentials can be False which permits allow_origins=["*"].
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*",   # allow all https origins (Vercel, custom domains)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — ensures CORS headers reach the browser
# even when an unhandled exception causes a 500. Without this, the
# browser would see "Failed to fetch" instead of the real error.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    print(f"[UNHANDLED ERROR] {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers=headers,
    )

# Static file uploads — Vercel serverless has a read-only filesystem,
# so we skip mounting /static if the directory can't be created.
try:
    os.makedirs("static/uploads", exist_ok=True)
    app.mount("/static", StaticFiles(directory="static"), name="static")
except Exception:
    pass  # Running on Vercel or another read-only environment

# ================= AUTHENTICATION ENDPOINTS =================

@app.post("/api/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Auto-approve the first registered user to solve bootstrap problem
        is_first_user = db.query(models.User).count() == 0
        
        is_arun = user.email.lower() == "arunp061106@gmail.com"
        role_to_assign = "admin" if is_arun else user.role
        is_approved_status = True if (is_first_user or is_arun) else False

        hashed_pwd = auth.get_password_hash(user.password)
        new_user = models.User(
            name=user.name,
            email=user.email,
            hashed_password=hashed_pwd,
            role=role_to_assign,
            is_approved=is_approved_status
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Notify admin via email if not the first auto-approved admin user
        if not is_first_user:
            email_service.schedule_approval_email(background_tasks, user.name, user.email, user.role)
            
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[REGISTER ERROR] {e}")
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/login", response_model=schemas.Token)
def login_user(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if the user is approved
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval by the group leader."
        )
        
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ================= TASK MANAGEMENT ENDPOINTS =================

@app.post("/api/tasks", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task: schemas.TaskCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_task = models.Task(**task.model_dump(), staff_id=current_user.id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/api/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        return db.query(models.Task).all()
    return db.query(models.Task).filter(models.Task.staff_id == current_user.id).all()

@app.put("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, updated_task: schemas.TaskCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Task).filter(models.Task.id == task_id)
    db_task = query.first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user.role != "admin" and db_task.staff_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this task")
    
    query.update(updated_task.model_dump(), synchronize_session=False)
    db.commit()
    return query.first()

@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user.role != "admin" and db_task.staff_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this task")
        
    db.delete(db_task)
    db.commit()
    return None

@app.patch("/api/tasks/{task_id}/complete", response_model=schemas.TaskResponse)
def complete_task(task_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user.role != "admin" and db_task.staff_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    db_task.status = "Completed"
    current_user.tasks_completed_count += 1
    db.commit()
    db.refresh(db_task)
    return db_task


# ================= ATTENDANCE / PUNCH CLOCK =================

@app.post("/api/attendance/punch-in", response_model=schemas.UserResponse)
def punch_in(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    current_user.punch_status = "PUNCHED_IN"
    db.commit()
    db.refresh(current_user)
    return current_user

@app.post("/api/attendance/punch-out", response_model=schemas.UserResponse)
def punch_out(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    current_user.punch_status = "PUNCHED_OUT"
    db.commit()
    db.refresh(current_user)
    return current_user


# ================= DAILY WORK LOG & CLOUDINARY UPLOADS =================

@app.post("/api/logs", response_model=schemas.DailyLogResponse, status_code=status.HTTP_201_CREATED)
def create_daily_log(
    task_name: str = Form(...),
    date: str = Form(...),
    completion_time: str = Form(...),
    remarks: str = Form(...),
    observations: str = Form(None),
    outcome: str = Form(...),
    gps: str = Form(None),
    images: List[UploadFile] = File([]),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Register daily log
    db_log = models.DailyLog(
        task_name=task_name,
        date=date,
        completion_time=completion_time,
        remarks=remarks,
        observations=observations,
        outcome=outcome,
        gps=gps,
        staff_id=current_user.id
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)

    # File upload — Vercel serverless has a read-only filesystem.
    # Attempt to save locally; skip silently if it fails (e.g. on Vercel).
    for img in images:
        try:
            os.makedirs("static/uploads", exist_ok=True)
            file_location = f"static/uploads/{img.filename}"
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(img.file, buffer)

            db_photo = models.Photo(
                cloudinary_url=f"/static/uploads/{img.filename}",
                public_id=f"static/uploads/{img.filename}",
                log_id=db_log.id
            )
            db.add(db_photo)
        except OSError:
            # Read-only filesystem (Vercel) — skip local file save
            pass

    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/api/logs", response_model=List[schemas.DailyLogResponse])
def get_daily_logs(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        return db.query(models.DailyLog).all()
    return db.query(models.DailyLog).filter(models.DailyLog.staff_id == current_user.id).all()


# ================= ADMIN MONITORING ENDPOINTS =================

@app.get("/api/admin/users", response_model=List[schemas.UserResponse])
def admin_get_users(current_admin: models.User = Depends(auth.get_current_admin), db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.patch("/api/admin/users/{user_id}/toggle-role", response_model=schemas.UserResponse)
def admin_toggle_role(user_id: int, current_admin: models.User = Depends(auth.get_current_admin), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = "admin" if user.role == "staff" else "staff"
    db.commit()
    db.refresh(user)
    return user

@app.patch("/api/admin/users/{user_id}/approve", response_model=schemas.UserResponse)
def admin_approve_user(user_id: int, current_admin: models.User = Depends(auth.get_current_admin), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = True
    db.commit()
    db.refresh(user)
    return user

@app.delete("/api/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(user_id: int, current_admin: models.User = Depends(auth.get_current_admin), db: Session = Depends(get_db)):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None
