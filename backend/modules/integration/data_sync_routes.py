from flask import Blueprint, request, jsonify
from dataclasses import asdict
from core.security import require_role
from core.models import SyncTypeEnum

from modules.integration.services import DataSyncService

bp = Blueprint('data_sync', __name__, url_prefix='/sync')

sync_service = DataSyncService()

@bp.route('/personal/scheduled', methods=['POST'])
@require_role('ADMIN')
def trigger_scheduled_personal_sync():
    try:
        report = sync_service.run_scheduled_personal_data_sync()
        return jsonify(asdict(report)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/personal/manual', methods=['POST'])
@require_role('ADMIN')
def trigger_manual_personal_sync():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    try:
        report = sync_service.run_manual_personal_data_sync(user_id)
        return jsonify(asdict(report)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/roles', methods=['POST'])
@require_role('ADMIN')
def trigger_role_sync():
    try:
        report = sync_service.run_scheduled_role_sync()
        return jsonify(asdict(report)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/status', methods=['GET'])
@require_role('ADMIN')
def get_sync_status():
    type_str = request.args.get('type')
    
    if not type_str:
        return jsonify({'error': 'Missing type parameter (PERSONAL or ROLE)'}), 400

    try:
        sync_type = SyncTypeEnum(type_str.upper())
        status = sync_service.get_latest_sync_status(sync_type)
        return jsonify(asdict(status)), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid sync type. Must be PERSONAL or ROLE'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500