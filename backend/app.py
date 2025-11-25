from flask import Flask
import os
from core.database import init_db

# Import blueprint AUTH
from modules.integration.auth_routes import bp as auth_bp

# --- SỬA DÒNG NÀY ---
# Import blueprint SCHEDULING (trỏ đúng vào folder bạn đang có)
from modules.scheduling.routes import bp as scheduling_bp 

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret')
    
    init_db()
    
    app.register_blueprint(auth_bp)
    
    # --- VÀ DÒNG NÀY ---
    app.register_blueprint(scheduling_bp) 
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)