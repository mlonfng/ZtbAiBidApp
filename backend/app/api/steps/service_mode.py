"""
服务模式选择 Step API
符合统一规范v3的标准实现
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import time
import logging

from backend.app.core.response import create_response, create_error_response
from backend.app.services.service_mode_service import ServiceModeService

router = APIRouter()
logger = logging.getLogger(__name__)

# 请求模型
class ServiceModeExecuteRequest(BaseModel):
    mode: str  # "ai"|"free"|"manual"|"ai_intelligent"|"standard"

# 初始化服务
service_mode_service = ServiceModeService()

@router.get("/projects/{project_id}/step/service-mode/status")
async def get_service_mode_status(project_id: str):
    """Step API: 获取服务模式选择步骤状态"""
    try:
        start_time = time.time()
        
        # 调用服务层获取状态
        status_result = await service_mode_service.get_status(project_id)
        
        # 记录日志
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "服务模式状态查询完成",
            extra={
                "project_id": project_id,
                "step_key": "service-mode",
                "action": "status",
                "duration_ms": duration_ms,
                "status": status_result.get("status", "unknown")
            }
        )
        
        return create_response(True, "获取步骤状态成功", status_result)
        
    except Exception as e:
        logger.error(
            "获取服务模式状态失败",
            extra={
                "project_id": project_id,
                "step_key": "service-mode", 
                "action": "status",
                "error": str(e)
            }
        )
        return create_error_response(f"获取服务模式步骤状态失败: {str(e)}")

@router.post("/projects/{project_id}/step/service-mode/execute")
async def execute_service_mode(project_id: str, request: Request):
    """Step API: 执行服务模式选择"""
    try:
        start_time = time.time()
        body = await request.json()
        
        # 参数验证
        mode = body.get("mode")
        if not mode:
            return create_error_response("缺少必要参数: mode", code=400)
            
        valid_modes = ["ai", "free", "manual", "ai_intelligent", "standard"]
        if mode not in valid_modes:
            return create_error_response(f"无效的服务模式: {mode}", code=400)
        
        # 获取幂等键和追踪ID
        idempotency_key = request.headers.get("Idempotency-Key")
        trace_id = request.headers.get("X-Trace-Id") or f"trace-{project_id}-{int(time.time() * 1000)}"
        
        # 调用服务层执行
        execute_result = await service_mode_service.execute(
            project_id=project_id,
            mode=mode,
            idempotency_key=idempotency_key,
            trace_id=trace_id
        )
        
        # 记录日志
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "服务模式设置完成",
            extra={
                "project_id": project_id,
                "step_key": "service-mode",
                "action": "execute", 
                "duration_ms": duration_ms,
                "mode": mode,
                "trace_id": trace_id
            }
        )
        
        return create_response(True, "服务模式设置成功", execute_result)
        
    except Exception as e:
        logger.error(
            "执行服务模式设置失败",
            extra={
                "project_id": project_id,
                "step_key": "service-mode",
                "action": "execute",
                "error": str(e)
            }
        )
        return create_error_response(f"应用服务模式失败: {str(e)}")

@router.get("/projects/{project_id}/step/service-mode/result")
async def get_service_mode_result(project_id: str):
    """Step API: 获取服务模式选择结果"""
    try:
        start_time = time.time()
        
        # 调用服务层获取结果
        result_data = await service_mode_service.get_result(project_id)
        
        # 记录日志
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "服务模式结果获取完成",
            extra={
                "project_id": project_id,
                "step_key": "service-mode",
                "action": "result",
                "duration_ms": duration_ms
            }
        )
        
        return create_response(True, "获取步骤结果成功", result_data)
        
    except Exception as e:
        logger.error(
            "获取服务模式结果失败",
            extra={
                "project_id": project_id,
                "step_key": "service-mode",
                "action": "result", 
                "error": str(e)
            }
        )
        return create_error_response(f"获取服务模式步骤结果失败: {str(e)}")
