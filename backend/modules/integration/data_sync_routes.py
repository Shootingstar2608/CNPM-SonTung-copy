from flask import Blueprint, request, jsonify
from core.security import require_role
from core.models import SyncTypeEnum

from modules.integration.services import DataSyncService, SchedulerService

bp = Blueprint('data_sync', __name__, url_prefix='/sync')

sync_service = DataSyncService()
scheduler_service = SchedulerService()

@bp.route('/personal/scheduled', methods=['POST'])
@require_role('ADMIN')
def trigger_scheduled_personal_sync():
    try:
        report = sync_service.run_scheduled_personal_data_sync()
        return jsonify(report.to_dict()), 200
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
        return jsonify(report.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/roles', methods=['POST'])
@require_role('ADMIN')
def trigger_role_sync():
    try:
        report = sync_service.run_scheduled_role_sync()
        return jsonify(report.to_dict()), 200
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
        return jsonify(status.to_dict()), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid sync type. Must be PERSONAL or ROLE'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    
@bp.route('/scheduler/config', methods=['POST'])
@require_role('ADMIN')
def update_scheduler_config():
    """
    Cập nhật cấu hình Scheduler đa năng.
    Body mẫu:
    1. Theo ngày: { "schedule_type": "DAILY", "run_time": "23:30" }
    2. Theo tuần: { "schedule_type": "WEEKLY", "run_time": "09:00", "day_value": "mon" }
    3. Theo phút: { "schedule_type": "INTERVAL", "interval_minutes": 30 }
    """
    data = request.get_json()
    
    # Validate sơ bộ
    sch_type = data.get('schedule_type')
    if sch_type and sch_type not in ['INTERVAL', 'DAILY', 'WEEKLY', 'MONTHLY']:
        return jsonify({'error': 'Loại lịch không hợp lệ'}), 400
        
    scheduler_service.update_config(data)
    
    # Lấy lại config mới nhất để trả về
    new_conf = scheduler_service.get_config()
    return jsonify({
        'message': 'Cập nhật cấu hình thành công',
        'config': new_conf.to_dict()
    }), 200