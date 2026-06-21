import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import BackgroundTasks

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")

def send_approval_request_email(new_user_name: str, new_user_email: str, new_user_role: str):
    if not SMTP_HOST or not ADMIN_EMAIL:
        print("SMTP settings or ADMIN_EMAIL not configured. Registration notification email skipped.")
        print(f"[PENDING USER ALERT] User: {new_user_name} ({new_user_email}), Role: {new_user_role} is pending approval.")
        return
        
    msg = MIMEMultipart()
    msg['From'] = SMTP_FROM_EMAIL or SMTP_USER
    msg['To'] = ADMIN_EMAIL
    msg['Subject'] = f"🔔 NGO Tracker: New Registration Pending Approval ({new_user_name})"
    
    body = f"""Hello,

A new user has registered on the NGO Work Tracker platform and is pending approval:

- Name: {new_user_name}
- Email: {new_user_email}
- Requested Role: {new_user_role}

Please log in to the NGO Work Tracker Admin Panel to approve or reject this user.

Regards,
NGO Tracker System
"""
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        # Connect to SMTP Server
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(msg['From'], msg['To'], msg.as_string())
        server.quit()
        print(f"Approval request email sent to {ADMIN_EMAIL} for user {new_user_email}")
    except Exception as e:
        print(f"Failed to send registration notification email: {e}")

def schedule_approval_email(background_tasks: BackgroundTasks, name: str, email: str, role: str):
    background_tasks.add_task(send_approval_request_email, name, email, role)
