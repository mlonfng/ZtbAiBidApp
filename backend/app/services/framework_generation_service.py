"""
框架生成服务层
"""

import os
import json
import sqlite3
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

# 导入Agent系统
from Agent.base.agent_manager import AgentManager
from Agent.base.base_agent import AgentConfig, AgentResult
from Agent.generation.bid_framework_agent import BidFrameworkAgent
from ..core.repository import Repository

logger = logging.getLogger(__name__)

class FrameworkGenerationService:
    """框架生成服务"""

    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ztbai.db")
        self.repository = Repository()
        self.agent_manager = AgentManager()
        self._register_agents()

    def _register_agents(self):
        """注册Agent"""
        self.agent_manager.register_agent_class(BidFrameworkAgent, "bid_framework")

    async def get_status(self, project_id: str) -> Dict[str, Any]:
        """获取框架生成状态"""
        try:
            # 从数据库获取实际状态
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT status, progress, result_data, updated_at 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ?
            """, (project_id, "framework-generation"))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                status, progress, result_data, updated_at = result
                return {
                    "project_id": project_id,
                    "step_key": "framework-generation",
                    "status": status,
                    "progress": progress,
                    "updated_at": updated_at,
                    "has_result": result_data is not None
                }
            else:
                return {
                    "project_id": project_id,
                    "step_key": "framework-generation",
                    "status": "pending",
                    "progress": 0
                }
        except Exception as e:
            logger.error(f"获取框架生成状态失败: {str(e)}")
            return {
                "project_id": project_id,
                "step_key": "framework-generation",
                "status": "error",
                "progress": 0,
                "error": str(e)
            }

    async def execute(self, project_id: str, framework_type: str = "standard", template_id: Optional[str] = None) -> Dict[str, Any]:
        """执行框架生成"""
        try:
            # 更新状态为进行中
            await self._update_step_progress(project_id, "in_progress", 10)
            
            # 获取项目信息和分析结果
            project_info = await self._get_project_info(project_id)
            if not project_info:
                raise Exception(f"项目 {project_id} 不存在")
            
            # 获取招标文件分析结果
            analysis_data = await self._get_analysis_data(project_id)
            
            # 更新进度
            await self._update_step_progress(project_id, "in_progress", 30)
            
            # 创建Agent配置
            agent_config = AgentConfig(
                name=f"框架生成Agent_{project_id}",
                agent_type="bid_framework",
                description="投标文件框架生成Agent",
                config={
                    "framework_type": framework_type,
                    "template_id": template_id,
                    "ai_service": await self._get_ai_service_config()
                }
            )
            
            # 创建输入数据
            input_data = {
                "project_id": project_id,
                "project_path": project_info.get("project_path"),
                "analysis_data": analysis_data,
                "service_mode": project_info.get("service_mode", "free"),
                "framework_type": framework_type,
                "template_id": template_id
            }
            
            # 更新进度
            await self._update_step_progress(project_id, "in_progress", 50)
            
            # 执行框架生成
            agent = self.agent_manager.create_agent(agent_config)
            result = await agent.execute(input_data)
            
            if not result.success:
                await self._update_step_progress(project_id, "error", 50)
                raise Exception(f"框架生成失败: {result.error}")
            
            # 保存结果
            framework_data = result.data
            await self._save_framework_result(project_id, framework_data)
            
            # 更新状态为完成
            await self._update_step_progress(project_id, "completed", 100, framework_data)
            
            logger.info(f"项目 {project_id} 框架生成完成")
            return {"framework": framework_data}
            
        except Exception as e:
            logger.error(f"框架生成执行失败: {str(e)}")
            await self._update_step_progress(project_id, "error", 0)
            raise e

    async def get_result(self, project_id: str) -> Dict[str, Any]:
        """获取框架生成结果"""
        try:
            # 从数据库获取结果
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT result_data, status, updated_at 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ?
            """, (project_id, "framework-generation"))
            
            result = cursor.fetchone()
            conn.close()
            
            if result and result[0]:
                result_data, status, updated_at = result
                return {
                    "framework": json.loads(result_data),
                    "status": status,
                    "updated_at": updated_at
                }
            else:
                # 如果没有结果，返回默认结构
                return {
                    "framework": {
                        "id": f"framework_{project_id}",
                        "type": "standard",
                        "chapters": [],
                        "status": "pending"
                    }
                }
        except Exception as e:
            logger.error(f"获取框架生成结果失败: {str(e)}")
            raise e

    async def _get_project_info(self, project_id: str) -> Optional[Dict[str, Any]]:
        """获取项目信息"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT name, project_path, service_mode, created_at
                FROM projects 
                WHERE id = ?
            """, (project_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                project_name, project_path, service_mode, created_at = result
                return {
                    "project_id": project_id,
                    "project_name": project_name,
                    "project_path": project_path,
                    "service_mode": service_mode,
                    "created_at": created_at
                }
            return None
        except Exception as e:
            logger.error(f"获取项目信息失败: {str(e)}")
            return None

    async def _get_analysis_data(self, project_id: str) -> Dict[str, Any]:
        """获取招标文件分析数据"""
        try:
            # 从step_progress表获取分析结果
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT result_data 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ? AND status = 'completed'
            """, (project_id, "bid-analysis"))
            
            result = cursor.fetchone()
            conn.close()
            
            if result and result[0]:
                return json.loads(result[0])
            return {}
        except Exception as e:
            logger.error(f"获取分析数据失败: {str(e)}")
            return {}

    async def _get_ai_service_config(self) -> Dict[str, Any]:
        """获取AI服务配置"""
        # 这里应该从配置文件或数据库获取AI配置
        return {
            "provider": "deepseek",
            "model": "deepseek-chat",
            "temperature": 0.7
        }

    async def _save_framework_result(self, project_id: str, framework_data: Dict[str, Any]) -> bool:
        """保存框架生成结果到文件"""
        try:
            # 获取项目路径
            project_info = await self._get_project_info(project_id)
            if not project_info:
                return False
            
            project_path = Path(project_info["project_path"])
            
            # 创建框架文件目录
            framework_dir = project_path / "bid_framework"
            framework_dir.mkdir(exist_ok=True)
            
            # 保存框架配置文件
            framework_file = framework_dir / "framework_config.json"
            with open(framework_file, 'w', encoding='utf-8') as f:
                json.dump(framework_data, f, ensure_ascii=False, indent=2)
            
            # 如果有章节结构，保存章节文件
            if "chapters" in framework_data and framework_data["chapters"]:
                for chapter in framework_data["chapters"]:
                    chapter_file = framework_dir / f"{chapter.get('key', 'chapter')}.md"
                    with open(chapter_file, 'w', encoding='utf-8') as f:
                        f.write(f"# {chapter.get('title', '章节标题')}\n\n")
                        f.write(f"## 章节描述\n{chapter.get('description', '')}\n\n")
                        f.write(f"## 内容要求\n{chapter.get('requirements', '')}\n\n")
            
            logger.info(f"框架结果已保存到: {framework_dir}")
            return True
            
        except Exception as e:
            logger.error(f"保存框架结果失败: {str(e)}")
            return False

    async def _update_step_progress(self, project_id: str, status: str, progress: int, data: Optional[Dict[str, Any]] = None):
        """更新步骤进度"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 创建表（如果不存在）
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS step_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id TEXT NOT NULL,
                    step_key TEXT NOT NULL,
                    status TEXT NOT NULL,
                    progress INTEGER DEFAULT 0,
                    result_data TEXT,
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(project_id, step_key)
                )
            """)
            
            result_json = json.dumps(data, ensure_ascii=False) if data else None
            
            cursor.execute("""
                INSERT OR REPLACE INTO step_progress 
                (project_id, step_key, status, progress, result_data, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (project_id, "framework-generation", status, progress, result_json, datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"更新步骤进度失败: {str(e)}")
