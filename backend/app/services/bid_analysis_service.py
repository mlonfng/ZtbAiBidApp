import time
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import uuid
import asyncio
import logging
import traceback

from Agent.base.agent_manager import AgentManager
from Agent.base.base_agent import AgentConfig
from app.core.response import create_error_response
from app.shared_state import analysis_tasks
from backend.app.utils import (
    find_bid_file_in_project,
    save_analysis_results,
    upsert_task_record,
    get_project_path_by_id,
)
from ..core.repository import StepProgressRepository, ProjectRepository

logger = logging.getLogger(__name__)

AGENT_AVAILABLE = True

# 快速模式开关（用于开发和测试环境）
FAST_MODE = os.getenv("ZTBAI_FAST_MODE", "false").lower() == "true"

# 快速模式开关（用于开发和测试环境）
FAST_MODE = os.getenv("ZTBAI_FAST_MODE", "false").lower() == "true"

class BidAnalysisService:
    def __init__(self, agent_manager: AgentManager):
        self.agent_manager = agent_manager
        self.step_repo = StepProgressRepository()
        self.project_repo = ProjectRepository()

        # 预初始化Agent配置（避免每次请求重新创建）
        self._analysis_config = None
        self._strategy_config = None
        self._agents_initialized = False

        # Final diagnostic: log the state of agent_manager at creation time.
        log_path = "g:/ZtbAiBidApp_202507210900/service_init.log"
        with open(log_path, "a", encoding="utf-8") as f:
            timestamp = datetime.now().isoformat()
            status = "VALID" if agent_manager else "NONE"
            f.write(f"[{timestamp}] BidAnalysisService initialized. AgentManager status: {status}\n")

    def _ensure_agents_initialized(self):
        """确保Agent配置已初始化（延迟初始化）"""
        if not self._agents_initialized and self.agent_manager:
            try:
                # 预创建Agent配置
                self._analysis_config = AgentConfig(
                    name="bid_analysis_agent",
                    agent_type="BidAnalysisAgent",
                    config={"analysis": {"type": "comprehensive", "detailed": True}}
                )
                self._strategy_config = AgentConfig(
                    name="bid_strategy_agent",
                    agent_type="BidStrategyAgent",
                    config={"strategy": {"type": "comprehensive", "detailed": True}}
                )
                self._agents_initialized = True
                logger.info("Agent配置预初始化完成")
            except Exception as e:
                logger.error(f"Agent配置初始化失败: {e}")
                self._agents_initialized = False

    def _ensure_agents_initialized(self):
        """确保Agent配置已初始化"""
        if not self._agents_initialized and self.agent_manager:
            try:
                self._analysis_config = AgentConfig(
                    name="bid_analysis_agent",
                    agent_type="BidAnalysisAgent",
                    config={"analysis": {"type": "comprehensive", "detailed": True}}
                )
                self._strategy_config = AgentConfig(
                    name="bid_strategy_agent",
                    agent_type="BidStrategyAgent",
                    config={"strategy": {"type": "comprehensive", "detailed": True}}
                )
                self._agents_initialized = True
                logger.info("Agent配置预初始化完成")
            except Exception as e:
                logger.error(f"Agent配置初始化失败: {e}")
                self._agents_initialized = False

    async def get_status(self, project_id: str) -> Dict[str, Any]:
        # 优先从数据库获取状态
        try:
            # 尝试将project_id转换为整数（数据库中是INTEGER类型）
            project_id_int = int(project_id)
            db_status = self.step_repo.get_step_progress(str(project_id_int), "bid-analysis")
        except (ValueError, TypeError):
            db_status = None
        if db_status:
            return {
                "status": db_status["status"],
                "progress": db_status["progress"],
                "task_id": db_status.get("task_id"),
                "error_message": db_status.get("error_message")
            }

        # 回退到内存状态（兼容性）
        latest_task = None
        for task_id, task in analysis_tasks.items():
            if task.get("project_id") == project_id:
                if latest_task is None or task.get("start_time") > latest_task.get("start_time"):
                    latest_task = task

        if latest_task:
            return {
                "status": latest_task.get("status", "unknown"),
                "progress": latest_task.get("progress", 0),
                "task_id": latest_task.get("id")
            }
        else:
            return {"status": "not_started", "progress": 0}

    async def get_result(self, project_id: str) -> Dict[str, Any]:
        latest_task = None
        for task_id, task in analysis_tasks.items():
            if task.get("project_id") == project_id and task.get("status") == "completed":
                if latest_task is None or task.get("start_time") > latest_task.get("start_time"):
                    latest_task = task

        if latest_task and latest_task.get("result"):
            return {
                "status": "completed",
                "result": latest_task.get("result")
            }
        else:
            return {"status": "not_found", "result": "No completed analysis task found."}

    async def execute(self, project_id: str, analysis_type: str, idempotency_key: Optional[str] = None, trace_id: Optional[str] = None) -> Dict[str, Any]:
        # 预初始化Agent配置以减少延迟
        self._ensure_agents_initialized()

        # 检查是否已有运行中的任务（幂等性）
        if idempotency_key:
            for task_id, task in analysis_tasks.items():
                if (task.get("project_id") == project_id and
                    task.get("idempotency_key") == idempotency_key and
                    task.get("status") in ["pending", "in_progress"]):
                    logger.info(f"返回已存在的任务: {task_id}")
                    return {"task_id": task_id, "status": task.get("status", "running")}

        # 创建新任务
        task_id = str(uuid.uuid4())
        task = {
            "id": task_id,
            "project_id": project_id,
            "status": "in_progress",  # 立即设置为进行中
            "progress": 0,
            "start_time": datetime.now().isoformat(),
            "idempotency_key": idempotency_key,
            "trace_id": trace_id
        }
        analysis_tasks[task_id] = task

        # 更新数据库状态
        try:
            project_id_int = int(project_id)
            self.step_repo.update_step_progress(
                project_id=str(project_id_int),
                step_key="bid-analysis",
                step_name="招标文件分析",
                status="in_progress",
                progress=0,
                task_id=task_id
            )
        except (ValueError, TypeError):
            logger.warning(f"无法将project_id转换为整数: {project_id}")

        def _handle_task_result(background_task: asyncio.Task) -> None:
            """处理后台任务完成回调"""
            try:
                background_task.result()  # 这会重新抛出异常（如果有的话）
                logger.info(f"后台分析任务 {task_id} 成功完成")
            except Exception as e:
                logger.error(f"后台分析任务 {task_id} 失败: {e}", exc_info=True)
                # 更新任务状态为失败
                if task_id in analysis_tasks:
                    analysis_tasks[task_id]["status"] = "failed"
                    analysis_tasks[task_id]["error_message"] = str(e)
                    try:
                        project_id_int = int(project_id)
                        self.step_repo.update_step_progress(
                            project_id=str(project_id_int),
                            step_key="bid-analysis",
                            step_name="招标文件分析",
                            status="error",
                            progress=0,
                            task_id=task_id,
                            error_message=str(e)
                        )
                    except (ValueError, TypeError):
                        logger.warning(f"无法将project_id转换为整数: {project_id}")

        # 启动后台任务（不等待完成）
        loop = asyncio.get_running_loop()
        background_task = loop.create_task(self.execute_analysis_task(task_id, project_id, analysis_type))
        background_task.add_done_callback(_handle_task_result)

        # 不等待后台任务完成，立即返回

        # 立即返回任务信息
        logger.info(f"招标文件分析任务 {task_id} 已启动，项目ID: {project_id}")
        return {
            "task_id": task_id,
            "status": "running",
            "project_id": project_id,
            "analysis_type": analysis_type
        }

    async def execute_analysis_task(self, task_id: str, project_id: str, analysis_type: str):
        try:
            task = analysis_tasks[task_id]

            # 快速模式：使用模拟结果，立即完成
            if FAST_MODE:
                logger.info(f"快速模式：使用模拟结果完成任务 {task_id}")
                result = await self.execute_fast_mode(task_id, project_id, analysis_type, task)
            elif AGENT_AVAILABLE and self.agent_manager:
                result = await self.execute_with_agent(task_id, project_id, analysis_type, task)
            else:
                task["status"] = "failed"
                task["error_message"] = "Agent system is unavailable"
                # We must raise an exception here to make sure the callback catches it.
                raise Exception(task["error_message"])

            if result:
                task["result"] = result
            else:
                # This is the silent failure point. The agent task returned a falsy value without raising an exception.
                task["status"] = "failed"
                task["error_message"] = "Agent execution resulted in an empty or invalid result."
                # We must raise an exception here to make sure the callback catches it.
                raise Exception(task["error_message"])
        except Exception as e:
            task["status"] = "failed"
            task["error"] = str(e)
            with open("g:/ZtbAiBidApp_202507210900/failure_point.log", "a") as f:
                f.write(f"[execute_analysis_task] failed at {datetime.now().isoformat()}: {str(e)}\n")
            raise e

    async def execute_fast_mode(self, task_id: str, project_id: str, analysis_type: str, task: dict):
        """快速模式：使用模拟数据快速完成任务"""
        try:
            logger.info(f"快速模式执行开始: 任务ID {task_id}")

            # 模拟进度更新
            task["progress"] = 20
            try:
                project_id_int = int(project_id)
                self.step_repo.update_step_progress(
                    project_id=str(project_id_int),
                    step_key="bid-analysis",
                    step_name="招标文件分析",
                    status="in_progress",
                    progress=20,
                    task_id=task_id
                )
            except (ValueError, TypeError):
                logger.warning(f"无法将project_id转换为整数: {project_id}")

            # 模拟短暂处理时间
            await asyncio.sleep(0.5)

            task["progress"] = 50
            try:
                project_id_int = int(project_id)
                self.step_repo.update_step_progress(
                    project_id=str(project_id_int),
                    step_key="bid-analysis",
                    step_name="招标文件分析",
                    status="in_progress",
                    progress=50,
                    task_id=task_id
                )
            except (ValueError, TypeError):
                pass

            await asyncio.sleep(0.5)

            # 创建模拟结果
            mock_result = {
                "analysis_result": {
                    "basic_info": {
                        "project_name": "模拟项目分析",
                        "analysis_type": analysis_type,
                        "created_at": datetime.now().isoformat()
                    },
                    "evaluation_criteria": ["技术方案", "商务报价", "企业资质"],
                    "technical_requirements": ["符合国家标准", "具备相关资质", "提供技术方案"]
                },
                "strategy_result": {
                    "by": "fast_mode",
                    "length": 500,
                    "strategy_points": ["重点突出技术优势", "合理控制成本", "展示企业实力"]
                },
                "report_path": f"ZtbBidPro/mock_project_{project_id}/招标文件分析报告.md",
                "strategy_path": f"ZtbBidPro/mock_project_{project_id}/投标文件制作策略.md"
            }

            task["progress"] = 90
            try:
                project_id_int = int(project_id)
                self.step_repo.update_step_progress(
                    project_id=str(project_id_int),
                    step_key="bid-analysis",
                    step_name="招标文件分析",
                    status="in_progress",
                    progress=90,
                    task_id=task_id
                )
            except (ValueError, TypeError):
                pass

            await asyncio.sleep(0.2)

            # 完成任务
            task["status"] = "completed"
            task["progress"] = 100
            task["end_time"] = datetime.now().isoformat()

            try:
                project_id_int = int(project_id)
                self.step_repo.update_step_progress(
                    project_id=str(project_id_int),
                    step_key="bid-analysis",
                    step_name="招标文件分析",
                    status="completed",
                    progress=100,
                    task_id=task_id
                )
            except (ValueError, TypeError):
                pass

            logger.info(f"快速模式执行完成: 任务ID {task_id}")
            return mock_result

        except Exception as e:
            task["status"] = "failed"
            task["error_message"] = f"快速模式执行失败: {str(e)}"
            logger.error(f"快速模式执行失败: {e}")
            raise e

    async def execute_with_agent(self, task_id: str, project_id: str, analysis_type: str, task: dict):
        try:
            # 确保Agent配置已初始化
            self._ensure_agents_initialized()

            project_path = get_project_path_by_id(project_id)
            if not project_path:
                raise Exception(f"Project path for project ID {project_id} not found")

            project_dir = Path(project_path)
            if not project_dir.exists():
                raise Exception(f"Project directory does not exist: {project_path}")

            bid_file = find_bid_file_in_project(project_dir)
            if not bid_file:
                raise Exception(f"Bid file not found in project directory: {project_path}")

            # 使用预初始化的Agent配置，避免重复创建
            if not self._analysis_config:
                raise Exception("Analysis agent configuration not initialized")

            analysis_agent = self.agent_manager.create_agent(self._analysis_config)
            analysis_input = {"file_path": str(bid_file), "project_id": project_id, "project_path": str(project_dir), "analysis_type": analysis_type}

            task["progress"] = 20
            upsert_task_record(project_id, "bid-analysis", task_id, "in_progress", 20)
            analysis_result = await self.agent_manager.run_agent("bid_analysis_agent", analysis_input)
            task["progress"] = 50
            upsert_task_record(project_id, "bid-analysis", task_id, "in_progress", 50)

            if not analysis_result.success:
                # This is a critical failure point. We must set the task status AND raise an exception.
                task["status"] = "failed"
                task["error_message"] = f"Analysis Agent failed: {analysis_result.error}"
                raise Exception(task["error_message"])

            # 使用预初始化的策略Agent配置
            if not self._strategy_config:
                raise Exception("Strategy agent configuration not initialized")

            strategy_agent = self.agent_manager.create_agent(self._strategy_config)
            strategy_input = {"analysis_result": analysis_result.data.get("analysis_result", {}), "project_id": project_id, "project_path": str(project_dir)}

            task["progress"] = 70
            upsert_task_record(project_id, "bid-analysis", task_id, "in_progress", 70)
            strategy_result = await self.agent_manager.run_agent("bid_strategy_agent", strategy_input)
            task["progress"] = 90
            upsert_task_record(project_id, "bid-analysis", task_id, "in_progress", 90)

            combined_result = {
                "analysis_result": analysis_result.data.get("analysis_result", {}),
                "strategy_result": strategy_result.data.get("strategy_result", {}) if strategy_result.success else {},
                "report_path": analysis_result.data.get("report_path", ""),
                "strategy_path": strategy_result.data.get("strategy_path", "") if strategy_result.success else "",
            }

            task["progress"] = 95
            save_result = await save_analysis_results(project_id, combined_result)
            if not (save_result and save_result.get("success")):
                raise Exception(save_result.get("message") if isinstance(save_result, dict) else "Failed to save analysis results")

            task["status"] = "completed"
            task["progress"] = 100
            task["end_time"] = datetime.now().isoformat()
            upsert_task_record(project_id, "bid-analysis", task_id, "completed", 100)

            return combined_result
        except Exception as e:
            task["status"] = "failed"
            task["error_message"] = str(e)
            with open("g:/ZtbAiBidApp_202507210900/failure_point.log", "a") as f:
                f.write(f"[execute_with_agent] failed at {datetime.now().isoformat()}: {str(e)}\n")
            raise e

