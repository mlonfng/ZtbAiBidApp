"""
招标文件分析 Step API
符合统一规范v3的标准实现
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import time
import logging

from ...core.response import create_response, create_error_response
from ...services.bid_analysis_service import BidAnalysisService

router = APIRouter()
logger = logging.getLogger(__name__)

# 请求模型
class BidAnalysisExecuteRequest(BaseModel):
    analysis_type: str = "comprehensive"  # "comprehensive"|"quick"

# 服务实例将由主应用在启动时注入
bid_analysis_service: Optional[BidAnalysisService] = None

def set_bid_analysis_service(service: BidAnalysisService):
    """注入BidAnalysisService实例"""
    global bid_analysis_service
    bid_analysis_service = service

@router.get("/projects/{project_id}/step/bid-analysis/status")
async def get_bid_analysis_status(project_id: str):
    """Step API: 获取招标文件分析步骤状态"""
    try:
        start_time = time.time()
        
        # 调用服务层获取状态
        status_result = await bid_analysis_service.get_status(project_id)
        
        # 记录日志
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "招标文件分析状态查询完成",
            extra={
                "project_id": project_id,
                "step_key": "bid-analysis",
                "action": "status",
                "duration_ms": duration_ms,
                "status": status_result.get("status", "unknown")
            }
        )
        
        return create_response(True, "获取步骤状态成功", status_result)
        
    except Exception as e:
        logger.error(
            "获取招标文件分析状态失败",
            extra={
                "project_id": project_id,
                "step_key": "bid-analysis", 
                "action": "status",
                "error": str(e)
            }
        )
        return create_error_response(f"获取招标文件分析步骤状态失败: {str(e)}")

@router.post("/projects/{project_id}/step/bid-analysis/execute")
async def execute_bid_analysis(project_id: str, request: Request):
    """Step API: 执行招标文件分析"""
    try:
        start_time = time.time()
        body = await request.json()
        
        # 参数验证
        analysis_type = body.get("analysis_type", "comprehensive")
        valid_types = ["comprehensive", "quick"]
        if analysis_type not in valid_types:
            return create_error_response(f"无效的分析类型: {analysis_type}", code=400)
        
        # 获取幂等键和追踪ID
        idempotency_key = request.headers.get("Idempotency-Key")
        trace_id = request.headers.get("X-Trace-Id") or f"trace-{project_id}-{int(time.time() * 1000)}"
        
        # 调用服务层执行
        execute_result = await bid_analysis_service.execute(
            project_id=project_id,
            analysis_type=analysis_type,
            idempotency_key=idempotency_key,
            trace_id=trace_id
        )
        
        # 记录日志
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "招标文件分析启动完成",
            extra={
                "project_id": project_id,
                "step_key": "bid-analysis",
                "action": "execute", 
                "duration_ms": duration_ms,
                "analysis_type": analysis_type,
                "trace_id": trace_id
            }
        )
        
        return create_response(True, "分析任务已启动", execute_result)
        
    except Exception as e:
        logger.error(
            "执行招标文件分析失败",
            extra={
                "project_id": project_id,
                "step_key": "bid-analysis",
                "action": "execute",
                "error": str(e)
            }
        )
        return create_error_response(f"启动招标文件分析失败: {str(e)}")

@router.get("/projects/{project_id}/step/bid-analysis/result")
async def get_bid_analysis_result(project_id: str):
    """Step API: 获取招标文件分析结果"""
    try:
        start_time = time.time()
        
        # 调用服务层获取结果
        result_data = await bid_analysis_service.get_result(project_id)
        
        # 记录日志
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "招标文件分析结果获取完成",
            extra={
                "project_id": project_id,
                "step_key": "bid-analysis",
                "action": "result",
                "duration_ms": duration_ms
            }
        )
        
        return create_response(True, "获取步骤结果成功", result_data)
        
    except Exception as e:
        logger.error(
            "获取招标文件分析结果失败",
            extra={
                "project_id": project_id,
                "step_key": "bid-analysis",
                "action": "result", 
                "error": str(e)
            }
        )
        return create_error_response(f"获取招标文件分析步骤结果失败: {str(e)}")
