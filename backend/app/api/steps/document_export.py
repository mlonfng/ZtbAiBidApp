"""
文档导出 Step API
"""

from fastapi import APIRouter, Request
from ...core.response import create_response, create_error_response
from ...services.document_export_service import DocumentExportService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
document_export_service = DocumentExportService()

@router.get("/projects/{project_id}/step/document-export/status")
async def get_document_export_status(project_id: str):
    try:
        status_result = await document_export_service.get_status(project_id)
        return create_response(True, "获取步骤状态成功", status_result)
    except Exception as e:
        return create_error_response(f"获取文档导出步骤状态失败: {str(e)}")

@router.post("/projects/{project_id}/step/document-export/execute")
async def execute_document_export(project_id: str, request: Request):
    try:
        body = await request.json()
        export_format = body.get("export_format", "docx")
        sections = body.get("sections", [])
        
        execute_result = await document_export_service.execute(project_id, export_format, sections)
        return create_response(True, "文档导出任务已启动", execute_result)
    except Exception as e:
        return create_error_response(f"执行文档导出失败: {str(e)}")

@router.get("/projects/{project_id}/step/document-export/result")
async def get_document_export_result(project_id: str):
    try:
        result_data = await document_export_service.get_result(project_id)
        return create_response(True, "获取步骤结果成功", result_data)
    except Exception as e:
        return create_error_response(f"获取文档导出结果失败: {str(e)}")
