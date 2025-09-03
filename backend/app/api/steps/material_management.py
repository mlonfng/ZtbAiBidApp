"""
资料管理 Step API
"""

from fastapi import APIRouter, Request, UploadFile, File, Form
from ...core.response import create_response, create_error_response
from ...services.material_management_service import MaterialManagementService
import time
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
material_service = MaterialManagementService()

@router.get("/projects/{project_id}/step/material-management/status")
async def get_material_status(project_id: str):
    try:
        status_result = await material_service.get_status(project_id)
        return create_response(True, "获取步骤状态成功", status_result)
    except Exception as e:
        return create_error_response(f"获取资料管理步骤状态失败: {str(e)}")

@router.post("/projects/{project_id}/step/material-management/execute")
async def execute_material_management(project_id: str, request: Request):
    try:
        body = await request.json()
        action = body.get("action", "organize")

        execute_result = await material_service.execute(project_id, action)
        return create_response(True, "资料管理任务已启动", execute_result)
    except Exception as e:
        return create_error_response(f"执行资料管理失败: {str(e)}")

@router.get("/projects/{project_id}/step/material-management/result")
async def get_material_result(project_id: str):
    try:
        result_data = await material_service.get_result(project_id)
        return create_response(True, "获取步骤结果成功", result_data)
    except Exception as e:
        return create_error_response(f"获取资料管理结果失败: {str(e)}")

# 添加文件上传API
@router.post("/projects/{project_id}/step/material-management/upload")
async def upload_material_file(
    project_id: str,
    category_id: str = Form(...),
    item_id: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...)
):
    """上传资料文件"""
    try:
        if not file.filename:
            return create_error_response("文件名不能为空")

        # 读取文件内容
        file_content = await file.read()

        # 调用服务层上传文件
        result = await material_service.upload_material(
            project_id=project_id,
            category_id=category_id,
            item_id=item_id,
            file_content=file_content,
            filename=file.filename,
            description=description
        )

        if result["success"]:
            return create_response(True, result["message"], result["file_info"])
        else:
            return create_error_response(result["error"])

    except Exception as e:
        logger.error(f"上传资料文件失败: {e}")
        return create_error_response(f"上传资料文件失败: {str(e)}")

# 添加获取资料分类API
@router.get("/projects/{project_id}/step/material-management/categories")
async def get_material_categories(project_id: str):
    """获取资料分类"""
    try:
        categories = material_service.material_categories
        return create_response(True, "获取资料分类成功", categories)
    except Exception as e:
        return create_error_response(f"获取资料分类失败: {str(e)}")
