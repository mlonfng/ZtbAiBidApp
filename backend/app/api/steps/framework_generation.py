"""
框架生成 Step API
"""

from fastapi import APIRouter, Request
from ...core.response import create_response, create_error_response
from ...services.framework_generation_service import FrameworkGenerationService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
framework_service = FrameworkGenerationService()

@router.get("/projects/{project_id}/step/framework-generation/status")
async def get_framework_status(project_id: str):
    try:
        status_result = await framework_service.get_status(project_id)
        return create_response(True, "获取步骤状态成功", status_result)
    except Exception as e:
        return create_error_response(f"获取框架生成步骤状态失败: {str(e)}")

@router.post("/projects/{project_id}/step/framework-generation/execute")
async def execute_framework_generation(project_id: str, request: Request):
    try:
        body = await request.json()
        framework_type = body.get("framework_type", "standard")
        template_id = body.get("template_id")
        
        execute_result = await framework_service.execute(project_id, framework_type, template_id)
        return create_response(True, "框架生成任务已启动", execute_result)
    except Exception as e:
        return create_error_response(f"执行框架生成失败: {str(e)}")

@router.get("/projects/{project_id}/step/framework-generation/result")
async def get_framework_result(project_id: str):
    try:
        result_data = await framework_service.get_result(project_id)
        return create_response(True, "获取步骤结果成功", result_data)
    except Exception as e:
        return create_error_response(f"获取框架生成结果失败: {str(e)}")
