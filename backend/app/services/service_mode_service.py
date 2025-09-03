"""
服务模式选择服务层
实现业务逻辑与数据访问分离
"""

import os
import json
import time
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

from backend.app.core.repository import ProjectRepository, StepProgressRepository, ConfigRepository

class ServiceModeService:
    """服务模式选择服务 - 已重构为使用Repository模式"""

    def __init__(self):
        self.project_repo = ProjectRepository()
        self.progress_repo = StepProgressRepository()
        self.config_repo = ConfigRepository()

    async def get_status(self, project_id: str) -> Dict[str, Any]:
        """获取服务模式步骤状态"""
        try:
            progress = self.progress_repo.get_step_progress(project_id, "service-mode")
            if progress:
                progress["mode"] = progress.pop("data", {"mode": "free"})
                return progress
            else:
                # 默认状态
                return {
                    "project_id": project_id,
                    "step_key": "service-mode",
                    "status": "pending",
                    "progress": 0,
                    "mode": {"mode": "free"}
                }
        except Exception as e:
            raise Exception(f"获取服务模式状态失败: {str(e)}")

    async def execute(self, project_id: str, mode: str, idempotency_key: Optional[str] = None,
                     trace_id: Optional[str] = None) -> Dict[str, Any]:
        """执行服务模式设置"""
        try:
            # 更新步骤进度为进行中
            await self._update_step_progress(project_id, "in_progress", 0)

            # 应用服务模式到项目配置
            success = await self._apply_mode_to_project_config(project_id, mode)

            if success:
                # 更新步骤进度为完成
                mode_data = {"mode": mode, "applied_at": datetime.now().isoformat()}
                await self._update_step_progress(project_id, "completed", 100, mode_data)

                return {
                    "project_id": project_id,
                    "mode": mode,
                    "saved_to_config": True,
                    "applied_at": mode_data["applied_at"]
                }
            else:
                # 更新步骤进度为错误
                await self._update_step_progress(project_id, "error", 0)
                raise Exception("应用服务模式到项目配置失败")

        except Exception as e:
            # 确保错误状态被记录
            await self._update_step_progress(project_id, "error", 0)
            raise Exception(f"执行服务模式设置失败: {str(e)}")

    async def get_result(self, project_id: str) -> Dict[str, Any]:
        """获取服务模式选择结果"""
        try:
            # 从项目配置文件读取当前模式
            mode_info = await self._get_service_mode_from_project_config(project_id)

            return {
                "project_id": project_id,
                "step_key": "service-mode",
                "result": mode_info if isinstance(mode_info, dict) else {"mode": mode_info or "free"}
            }

        except Exception as e:
            raise Exception(f"获取服务模式结果失败: {str(e)}")

    async def _update_step_progress(self, project_id: str, status: str, progress: int,
                                   data: Optional[Dict[str, Any]] = None):
        """使用Repository更新步骤进度"""
        self.progress_repo.update_step_progress(
            project_id, "service-mode", "服务模式选择", status, progress, data
        )

    async def _apply_mode_to_project_config(self, project_id: str, mode: str) -> bool:
        """使用Repository应用服务模式到项目配置文件"""
        try:
            project_path = self.project_repo.get_project_path_by_id(project_id)
            if not project_path:
                return False

            return self.config_repo.update_service_mode(project_path, mode)

        except Exception as e:
            print(f"应用服务模式到项目配置失败: {e}")
            return False

    async def _get_service_mode_from_project_config(self, project_id: str) -> Optional[Dict[str, Any]]:
        """使用Repository从项目配置文件获取服务模式"""
        try:
            project_path = self.project_repo.get_project_path_by_id(project_id)
            if not project_path:
                return {"mode": "free"}

            config = self.config_repo.get_project_config(project_path)
            if config:
                mode = config.get('service_mode', 'free')
                applied_at = config.get('service_mode_updated_at')
                return {"mode": mode, "applied_at": applied_at}

            return {"mode": "free"}

        except Exception as e:
            print(f"从项目配置获取服务模式失败: {e}")
            return {"mode": "free"}
