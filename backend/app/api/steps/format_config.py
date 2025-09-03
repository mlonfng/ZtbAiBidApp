"""
格式配置 Step API
"""

from fastapi import APIRouter, Request
from ...core.response import create_response, create_error_response
from ...services.format_config_service import FormatConfigService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
format_config_service = FormatConfigService()

@router.get("/projects/{project_id}/step/format-config/status")
async def get_format_config_status(project_id: str):
    try:
        status_result = await format_config_service.get_status(project_id)
        return create_response(True, "获取步骤状态成功", status_result)
    except Exception as e:
        return create_error_response(f"获取格式配置步骤状态失败: {str(e)}")

@router.post("/projects/{project_id}/step/format-config/execute")
async def execute_format_config(project_id: str, request: Request):
    try:
        body = await request.json()
        template_key = body.get("template_key", "standard")
        custom_config = body.get("custom_config", {})
        
        execute_result = await format_config_service.execute(project_id, template_key, custom_config)
        return create_response(True, "格式配置完成", execute_result)
    except Exception as e:
        return create_error_response(f"执行格式配置失败: {str(e)}")

@router.get("/projects/{project_id}/step/format-config/result")
async def get_format_config_result(project_id: str):
    try:
        result_data = await format_config_service.get_result(project_id)
        return create_response(True, "获取步骤结果成功", result_data)
    except Exception as e:
        return create_error_response(f"获取格式配置结果失败: {str(e)}")
