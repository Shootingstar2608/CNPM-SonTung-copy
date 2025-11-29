from flask import Flask
import os
from core.database import init_db
from extensions import scheduler
from flask_cors import CORS


# Import Blueprints
from modules.integration.auth_routes import bp as auth_bp
from modules.scheduling.routes import bp as scheduling_bp 
from modules.integration.library_routes import bp as library_bp 
from modules.integration.data_sync_routes import bp as data_sync_bp
from modules.integration.admin_routes import bp as admin_bp

def create_app(init_scheduler=True):
    app = Flask(__name__)

    CORS(app)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret')
    app.config['SCHEDULER_API_ENABLED'] = True
    
    init_db()
    if init_scheduler:
        if not scheduler.running:
            scheduler.init_app(app)
            scheduler.start()
            
    app.register_blueprint(auth_bp)
    app.register_blueprint(scheduling_bp)
    app.register_blueprint(library_bp)
    app.register_blueprint(data_sync_bp)
    app.register_blueprint(admin_bp)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000, use_reloader=False)