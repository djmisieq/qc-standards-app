"""
Initial data setup for QC Standards Application.
Creates default admin user and other necessary initial data.
"""
import logging
from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User, UserRole
from app.core.config import settings

logger = logging.getLogger(__name__)


def create_default_admin(session: Session) -> None:
    """Create default admin user if it doesn't exist."""
    # Check if admin already exists by username or email
    statement = select(User).where(
        (User.email == "admin@qcstandards.com") | 
        (User.email == "admin") |
        (User.username == "admin")
    )
    existing_admin = session.exec(statement).first()
    
    if existing_admin:
        logger.info("Default admin user already exists")
        return
    
    # Create admin user with simple credentials
    admin_user = User(
        username="admin",
        email="admin",  # Use 'admin' as email for simple login
        full_name="System Administrator",
        role=UserRole.ADMIN,
        is_active=True,
        is_superuser=True
    )
    admin_user.set_password("admin")  # Default password: admin
    
    session.add(admin_user)
    session.commit()
    
    logger.info("Default admin user created successfully")
    logger.info("Admin login: username/email: admin, password: admin")


def init_data() -> None:
    """Initialize database with default data."""
    with Session(engine) as session:
        logger.info("Initializing default data...")
        
        # Create default admin
        create_default_admin(session)
        
        # Add other initial data here as needed
        # For example: default templates, stages, etc.
        
        logger.info("Default data initialization completed")


if __name__ == "__main__":
    # Allow running this script directly
    logging.basicConfig(level=logging.INFO)
    init_data()
