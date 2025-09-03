"""
数据访问层基础Repository模式
实现业务逻辑与数据库操作的分离
"""

import sqlite3
import os
from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
from datetime import datetime
import json


class BaseRepository(ABC):
    """基础Repository抽象类"""
    
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ztbai.db")
        self.db_path = db_path
    
    def get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def execute_query(self, query: str, params: tuple = ()) -> List[sqlite3.Row]:
        """执行查询并返回结果"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchall()
    
    def execute_single(self, query: str, params: tuple = ()) -> Optional[sqlite3.Row]:
        """执行查询并返回单个结果"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchone()
    
    def execute_update(self, query: str, params: tuple = ()) -> int:
        """执行更新操作并返回影响的行数"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.rowcount


class ProjectRepository(BaseRepository):
    """项目数据访问层"""
    
    def get_project_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取项目信息"""
        row = self.execute_single(
            "SELECT * FROM projects WHERE id = ?",
            (project_id,)
        )
        return dict(row) if row else None
    
    def get_project_path_by_id(self, project_id: str) -> Optional[str]:
        """根据项目ID获取项目路径"""
        row = self.execute_single(
            "SELECT project_path FROM projects WHERE id = ?",
            (project_id,)
        )
        return row['project_path'] if row and row['project_path'] else None


class StepProgressRepository(BaseRepository):
    """步骤进度数据访问层"""
    
    def get_step_progress(self, project_id: str, step_key: str) -> Optional[Dict[str, Any]]:
        """获取步骤进度"""
        row = self.execute_single("""
            SELECT status, progress, started_at, completed_at, updated_at, task_id, error_message
            FROM project_step_progress
            WHERE project_id = ? AND step_key = ?
        """, (project_id, step_key))
        
        if not row:
            return None
        
        # 不再使用data字段，因为表中没有这个列
        
        return {
            "project_id": project_id,
            "step_key": step_key,
            "status": row['status'] or "pending",
            "progress": row['progress'] or 0,
            "started_at": row['started_at'],
            "completed_at": row['completed_at'],
            "updated_at": row['updated_at'],
            "task_id": row['task_id'] if 'task_id' in row.keys() else None,
            "error_message": row['error_message'] if 'error_message' in row.keys() else None
        }
    
    def update_step_progress(self, project_id: str, step_key: str, step_name: str,
                           status: str, progress: int, data: Optional[Dict[str, Any]] = None,
                           task_id: Optional[str] = None, error_message: Optional[str] = None) -> bool:
        """更新步骤进度"""
        try:
            now = datetime.now().isoformat()
            data_json = json.dumps(data) if data else None
            
            # 使用 INSERT OR REPLACE 确保记录存在
            self.execute_update("""
                INSERT OR REPLACE INTO project_step_progress
                (project_id, step_key, step_name, status, progress, started_at, completed_at, updated_at, task_id, error_message)
                VALUES (?, ?, ?, ?, ?,
                        COALESCE((SELECT started_at FROM project_step_progress WHERE project_id = ? AND step_key = ?), ?),
                        CASE WHEN ? = 'completed' THEN ? ELSE NULL END,
                        ?, ?, ?)
            """, (
                project_id, step_key, step_name, status, progress,
                project_id, step_key, now,  # started_at logic
                status, now,  # completed_at logic
                now, task_id, error_message
            ))
            
            return True
            
        except Exception as e:
            print(f"更新步骤进度失败: {e}")
            return False


class ConfigRepository(BaseRepository):
    """配置数据访问层"""
    
    def get_project_config(self, project_path: str) -> Optional[Dict[str, Any]]:
        """获取项目配置"""
        try:
            from pathlib import Path
            config_file = Path(project_path) / "ZtbAiConfig.Ztbai"
            
            if config_file.exists():
                with open(config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            
            return None
            
        except Exception as e:
            print(f"读取项目配置失败: {e}")
            return None
    
    def save_project_config(self, project_path: str, config: Dict[str, Any]) -> bool:
        """保存项目配置"""
        try:
            from pathlib import Path
            config_file = Path(project_path) / "ZtbAiConfig.Ztbai"
            
            # 更新修改时间
            config['modified_time'] = datetime.now().isoformat()
            
            # 保存配置
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            return True
            
        except Exception as e:
            print(f"保存项目配置失败: {e}")
            return False
    
    def update_service_mode(self, project_path: str, mode: str) -> bool:
        """更新服务模式"""
        try:
            # 读取现有配置
            config = self.get_project_config(project_path) or {}
            
            # 更新服务模式
            config['service_mode'] = mode
            config['service_mode_updated_at'] = datetime.now().isoformat()
            
            # 保存配置
            return self.save_project_config(project_path, config)
            
        except Exception as e:
            print(f"更新服务模式失败: {e}")
            return False


# 通用Repository类（向后兼容）
class Repository:
    """通用Repository类，整合各种数据访问功能"""
    
    def __init__(self, db_path: Optional[str] = None):
        self.project_repo = ProjectRepository(db_path)
        self.step_repo = StepProgressRepository(db_path)
        self.config_repo = ConfigRepository(db_path)
    
    def get_project_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        """获取项目信息"""
        return self.project_repo.get_project_by_id(project_id)
    
    def get_project_path(self, project_id: str) -> Optional[str]:
        """获取项目路径"""
        return self.project_repo.get_project_path_by_id(project_id)
    
    def get_step_progress(self, project_id: str, step_key: str) -> Optional[Dict[str, Any]]:
        """获取步骤进度"""
        return self.step_repo.get_step_progress(project_id, step_key)
    
    def update_step_progress(self, project_id: str, step_key: str, step_name: str,
                           status: str, progress: int, data: Optional[Dict[str, Any]] = None,
                           task_id: Optional[str] = None, error_message: Optional[str] = None) -> bool:
        """更新步骤进度"""
        return self.step_repo.update_step_progress(project_id, step_key, step_name, status, progress, data, task_id, error_message)
    
    def get_project_config(self, project_path: str) -> Optional[Dict[str, Any]]:
        """获取项目配置"""
        return self.config_repo.get_project_config(project_path)
    
    def save_project_config(self, project_path: str, config: Dict[str, Any]) -> bool:
        """保存项目配置"""
        return self.config_repo.save_project_config(project_path, config)
