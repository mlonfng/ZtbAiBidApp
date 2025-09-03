"""
文件格式化 Step API
符合统一规范v3的标准实现
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import time
import logging

from ...core.response import create_response, create_error_response
from ...services.file_formatting_service import FileFormattingService

router = APIRouter()
logger = logging.getLogger(__name__)

# 请求模型
class FileFormattingExecuteRequest(BaseModel):
    sequence: Optional[List[str]] = ["detect", "clean", "extract", "html"]
    source_relative_path: Optional[str] = None

# 初始化服务
file_formatting_service = FileFormattingService()

@router.get("/projects/{project_id}/step/file-formatting/status")
async def get_file_formatting_status(project_id: str):
    """Step API: 获取文件格式化步骤状态"""
    try:
        start_time = time.time()
        
        # 调用服务层获取状态
        status_result = await file_formatting_service.get_status(project_id)
        
        # 记录日志
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "文件格式化状态查询完成",
            extra={
                "project_id": project_id,
                "step_key": "file-formatting",
                "action": "status",
                "duration_ms": duration_ms,
                "status": status_result.get("status", "unknown")
            }
        )
        
        return create_response(True, "获取步骤状态成功", status_result)
        
    except Exception as e:
        logger.error(
            "获取文件格式化状态失败",
            extra={
                "project_id": project_id,
                "step_key": "file-formatting", 
                "action": "status",
                "error": str(e)
            }
        )
        return create_error_response(f"获取文件格式化步骤状态失败: {str(e)}")

@router.post("/projects/{project_id}/step/file-formatting/execute")
async def execute_file_formatting(project_id: str, request: Request):
    """Step API: 执行文件格式化"""
    import asyncio
    import uuid
    
    try:
        start_time = time.time()
        body = await request.json()
        
        # 参数验证
        sequence = body.get("sequence", ["detect", "clean", "extract", "html"])
        source_relative_path = body.get("source_relative_path")
        
        valid_steps = ["detect", "clean", "extract", "html"]
        if not all(step in valid_steps for step in sequence):
            return create_error_response("无效的格式化步骤序列", code=400)
        
        # 获取幂等键和追踪ID
        idempotency_key = request.headers.get("Idempotency-Key")
        trace_id = request.headers.get("X-Trace-Id") or f"trace-{project_id}-{int(time.time() * 1000)}"
        task_id = str(uuid.uuid4())
        
        # 立即设置状态为in_progress并返回任务ID
        await file_formatting_service._update_step_progress(
            project_id, 
            "in_progress", 
            5, 
            {"task_id": task_id}
        )
        
        # 启动后台任务 - 不等待完成
        async def background_task():
            try:
                await file_formatting_service.execute(
                    project_id=project_id,
                    format_type="standard",
                    clean_pdf=True,
                    extract_text=True
                )
            except Exception as e:
                logger.error(f"后台任务执行失败: {e}")
                await file_formatting_service._update_step_progress(
                    project_id, 
                    "error", 
                    0, 
                    {"error": str(e), "task_id": task_id}
                )
        
        # 创建并启动后台任务，不等待完成
        asyncio.create_task(background_task())
        
        # 记录日志
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "文件格式化任务启动成功",
            extra={
                "project_id": project_id,
                "step_key": "file-formatting",
                "action": "execute", 
                "duration_ms": duration_ms,
                "sequence": sequence,
                "trace_id": trace_id,
                "task_id": task_id
            }
        )
        
        return create_response(True, "文件格式化任务已启动", {
            "task_id": task_id,
            "trace_id": trace_id,
            "status": "in_progress",
            "message": "任务已在后台启动，请使用status API查询进度"
        })
        
    except Exception as e:
        logger.error(
            "启动文件格式化任务失败",
            extra={
                "project_id": project_id,
                "step_key": "file-formatting",
                "action": "execute",
                "error": str(e)
            }
        )
        return create_error_response(f"启动文件格式化失败: {str(e)}")

@router.get("/projects/{project_id}/step/file-formatting/result")
async def get_file_formatting_result(project_id: str):
    """Step API: 获取文件格式化结果"""
    try:
        start_time = time.time()
        
        # 调用服务层获取结果
        result_data = await file_formatting_service.get_result(project_id)
        
        # 记录日志
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "文件格式化结果获取完成",
            extra={
                "project_id": project_id,
                "step_key": "file-formatting",
                "action": "result",
                "duration_ms": duration_ms
            }
        )
        
        return create_response(True, "获取文件格式化结果成功", result_data)
        
    except Exception as e:
        logger.error(
            "获取文件格式化结果失败",
            extra={
                "project_id": project_id,
                "step_key": "file-formatting",
                "action": "result", 
                "error": str(e)
            }
        )
        return create_error_response(f"获取文件格式化结果失败: {str(e)}")
