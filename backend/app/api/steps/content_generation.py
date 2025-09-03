"""
内容生成 Step API
"""

from fastapi import APIRouter, Request
from ...core.response import create_response, create_error_response
from ...services.content_generation_service import ContentGenerationService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
content_service = ContentGenerationService()

@router.get("/projects/{project_id}/step/content-generation/status")
async def get_content_status(project_id: str):
    try:
        status_result = await content_service.get_status(project_id)
        return create_response(True, "获取步骤状态成功", status_result)
    except Exception as e:
        return create_error_response(f"获取内容生成步骤状态失败: {str(e)}")

@router.post("/projects/{project_id}/step/content-generation/execute")
async def execute_content_generation(project_id: str, request: Request):
    try:
        body = await request.json()
        sections = body.get("sections", [])
        
        execute_result = await content_service.execute(project_id, sections)
        return create_response(True, "内容生成任务已启动", execute_result)
    except Exception as e:
        return create_error_response(f"执行内容生成失败: {str(e)}")

@router.get("/projects/{project_id}/step/content-generation/result")
async def get_content_result(project_id: str):
    try:
        result_data = await content_service.get_result(project_id)
        return create_response(True, "获取步骤结果成功", result_data)
    except Exception as e:
        return create_error_response(f"获取内容生成结果失败: {str(e)}")
