"""
项目进展管理服务
"""
import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

class ProjectProgressService:
    def __init__(self, db_path: str = None):
        if db_path is None:
            # 默认数据库路径
            db_path = Path(__file__).parent.parent.parent / "data" / "projects.db"
        self.db_path = str(db_path)
        self._init_database()

    def _ensure_default_steps(self, cursor: sqlite3.Cursor, project_id: int):
        """为指定项目确保存在默认8个步骤（幂等）"""
        steps = [
            ('service-mode', '服务模式选择'),
            ('bid-analysis', '招标文件分析'),
            ('file-formatting', '投标文件初始化'),
            ('material-management', '资料管理'),
            ('framework-generation', '框架生成'),
            ('content-generation', '内容生成'),
            ('format-config', '格式配置'),
            ('document-export', '文档导出'),
        ]
        for step_key, step_name in steps:
            try:
                cursor.execute(
                    "INSERT OR IGNORE INTO project_progress (project_id, step_key, step_name, status) VALUES (?, ?, ?, 'pending')",
                    (project_id, step_key, step_name)
                )
            except Exception:
                # 旧表结构异常时忽略，后续调用者会继续处理
                pass

    def _init_database(self):
        """初始化数据库表（幂等、安全）"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                # 启用外键以支持 ON DELETE CASCADE（即使我们后面也会手动删除）
                cursor.execute("PRAGMA foreign_keys=ON")

                # 1) 创建 project_progress 表（如不存在）
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS project_progress (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        project_id INTEGER NOT NULL,
                        step_key VARCHAR(50) NOT NULL,
                        step_name VARCHAR(100) NOT NULL,
                        status VARCHAR(20) NOT NULL DEFAULT 'pending',
                        progress INTEGER DEFAULT 0,
                        started_at DATETIME,
                        completed_at DATETIME,
                        data TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
                        UNIQUE(project_id, step_key)
                    )
                ''')

                # 1.1) 对已存在的旧表进行缺列补齐（幂等迁移）
                cursor.execute("PRAGMA table_info(project_progress)")
                existing_cols = {row[1] for row in cursor.fetchall()}
                expected_cols = {
                    'step_key': "ALTER TABLE project_progress ADD COLUMN step_key VARCHAR(50)",
                    'step_name': "ALTER TABLE project_progress ADD COLUMN step_name VARCHAR(100)",
                    'status': "ALTER TABLE project_progress ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'",
                    'progress': "ALTER TABLE project_progress ADD COLUMN progress INTEGER DEFAULT 0",
                    'started_at': "ALTER TABLE project_progress ADD COLUMN started_at DATETIME",
                    'completed_at': "ALTER TABLE project_progress ADD COLUMN completed_at DATETIME",
                    'data': "ALTER TABLE project_progress ADD COLUMN data TEXT",
                    'created_at': "ALTER TABLE project_progress ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
                    'updated_at': "ALTER TABLE project_progress ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"
                }
                for col, ddl in expected_cols.items():
                    if col not in existing_cols:
                        try:
                            cursor.execute(ddl)
                        except Exception:
                            # 某些SQLite版本对带有DEFAULT的ADD COLUMN不兼容，忽略非致命错误
                            pass

                # 1.1.b) 重新获取列信息，确保后续索引创建基于最新结构
                cursor.execute("PRAGMA table_info(project_progress)")
                existing_cols = {row[1] for row in cursor.fetchall()}

                # 1.2) 对新增但为空的关键列做最小填充（避免排序/索引报错）
                try:
                    if 'step_key' in existing_cols:
                        cursor.execute("UPDATE project_progress SET step_key = COALESCE(step_key, 'unknown')")
                    if 'step_name' in existing_cols:
                        cursor.execute("UPDATE project_progress SET step_name = COALESCE(step_name, '未知步骤')")
                except Exception:
                    pass

                # 2) 为 projects 表补充所需列（仅当缺失时）
                cursor.execute("PRAGMA table_info(projects)")
                project_cols = {row[1] for row in cursor.fetchall()}
                if 'current_step' not in project_cols:
                    cursor.execute("ALTER TABLE projects ADD COLUMN current_step VARCHAR(50) DEFAULT 'service-mode'")
                if 'progress_data' not in project_cols:
                    cursor.execute("ALTER TABLE projects ADD COLUMN progress_data TEXT")

                # 3) 创建索引（如不存在）
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_project_progress_project_id ON project_progress(project_id)")
                if 'status' in existing_cols:
                    try:
                        cursor.execute("CREATE INDEX IF NOT EXISTS idx_project_progress_status ON project_progress(status)")
                    except Exception:
                        pass
                if 'step_key' in existing_cols:
                    try:
                        cursor.execute("CREATE INDEX IF NOT EXISTS idx_project_progress_step_key ON project_progress(step_key)")
                    except Exception:
                        pass
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_projects_current_step ON projects(current_step)")

                # 4) 为现有项目初始化默认步骤（幂等）
                try:
                    cursor.execute("SELECT id FROM projects")
                    project_ids = [row[0] for row in cursor.fetchall()]
                except Exception:
                    project_ids = []
                for pid in project_ids:
                    self._ensure_default_steps(cursor, pid)

                conn.commit()
        except Exception as e:
            print(f"初始化项目进展数据库失败: {e}")
    
    def get_project_progress(self, project_id: int) -> Dict[str, Any]:
        """获取项目进展状态"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # 获取项目基本信息
                cursor.execute('''
                    SELECT current_step, progress_data, status
                    FROM projects
                    WHERE id = ?
                ''', (project_id,))

                project_row = cursor.fetchone()
                if not project_row:
                    return {"success": False, "message": "项目不存在", "code": 404}

                current_step, progress_data, project_status = project_row

                # 确保该项目的默认步骤已存在（幂等）
                cursor.execute("SELECT COUNT(1) FROM project_progress WHERE project_id = ?", (project_id,))
                count = cursor.fetchone()[0]
                if not count:
                    self._ensure_default_steps(cursor, project_id)
                    conn.commit()

                # 获取所有步骤进展
                cursor.execute('''
                    SELECT step_key, step_name, status, progress, started_at, completed_at, data
                    FROM project_progress
                    WHERE project_id = ?
                    ORDER BY
                        CASE step_key
                            WHEN 'service-mode' THEN 1
                            WHEN 'bid-analysis' THEN 2
                            WHEN 'file-formatting' THEN 3
                            WHEN 'material-management' THEN 4
                            WHEN 'framework-generation' THEN 5
                            WHEN 'content-generation' THEN 6
                            WHEN 'format-config' THEN 7
                            WHEN 'document-export' THEN 8
                            ELSE 9
                        END
                ''', (project_id,))

                steps = []
                for row in cursor.fetchall():
                    step_data = {
                        "step_key": row[0],
                        "step_name": row[1],
                        "status": row[2],
                        "progress": row[3],
                        "started_at": row[4],
                        "completed_at": row[5],
                        "data": json.loads(row[6]) if row[6] else {}
                    }
                    steps.append(step_data)

                # 计算总体进度
                total_progress = sum(step["progress"] for step in steps) / len(steps) if steps else 0

                # 确定下一步
                next_step = self._determine_next_step(steps)

                return {
                    "success": True,
                    "data": {
                        "project_id": project_id,
                        "current_step": current_step or "service-mode",
                        "next_step": next_step,
                        "total_progress": round(total_progress, 1),
                        "project_status": project_status,
                        "steps": steps,
                        "progress_data": json.loads(progress_data) if progress_data else {}
                    }
                }

        except Exception as e:
            return {"success": False, "message": f"获取项目进展失败: {str(e)}", "code": 500}

    def update_step_progress(self, project_id: int, step_key: str, 
                           status: str = None, progress: int = None, 
                           data: Dict = None) -> Dict[str, Any]:
        """更新步骤进展"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 构建更新语句
                update_fields = []
                update_values = []
                
                if status is not None:
                    update_fields.append("status = ?")
                    update_values.append(status)
                    
                    # 如果状态变为进行中，设置开始时间
                    if status == 'in_progress':
                        update_fields.append("started_at = ?")
                        update_values.append(datetime.now().isoformat())
                    
                    # 如果状态变为完成，设置完成时间和100%进度
                    elif status == 'completed':
                        update_fields.append("completed_at = ?")
                        update_fields.append("progress = ?")
                        update_values.extend([datetime.now().isoformat(), 100])
                
                if progress is not None:
                    update_fields.append("progress = ?")
                    update_values.append(progress)
                
                if data is not None:
                    update_fields.append("data = ?")
                    update_values.append(json.dumps(data, ensure_ascii=False))
                
                update_fields.append("updated_at = ?")
                update_values.append(datetime.now().isoformat())
                
                # 执行更新
                update_values.extend([project_id, step_key])
                cursor.execute(f'''
                    UPDATE project_progress 
                    SET {", ".join(update_fields)}
                    WHERE project_id = ? AND step_key = ?
                ''', update_values)
                
                # 更新项目当前步骤
                if status == 'completed':
                    next_step = self._get_next_step_key(step_key)
                    if next_step:
                        cursor.execute('''
                            UPDATE projects 
                            SET current_step = ?, updated_at = ?
                            WHERE id = ?
                        ''', (next_step, datetime.now().isoformat(), project_id))
                
                conn.commit()
                
                return {"success": True, "message": "步骤进展更新成功"}
                
        except Exception as e:
            return {"success": False, "message": f"更新步骤进展失败: {str(e)}"}
    
    def _determine_next_step(self, steps: List[Dict]) -> Optional[str]:
        """确定下一步应该执行的步骤"""
        for step in steps:
            if step["status"] in ["pending", "in_progress"]:
                return step["step_key"]
        return None
    
    def _get_next_step_key(self, current_step: str) -> Optional[str]:
        """获取下一步的key"""
        step_order = [
            'service-mode', 'bid-analysis', 'file-formatting',
            'material-management', 'framework-generation', 
            'content-generation', 'format-config', 'document-export'
        ]
        
        try:
            current_index = step_order.index(current_step)
            if current_index < len(step_order) - 1:
                return step_order[current_index + 1]
        except ValueError:
            pass
        
        return None
    
    def reset_project_progress(self, project_id: int) -> Dict[str, Any]:
        """重置项目进展"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 重置所有步骤状态
                cursor.execute('''
                    UPDATE project_progress 
                    SET status = 'pending', progress = 0, 
                        started_at = NULL, completed_at = NULL,
                        updated_at = ?
                    WHERE project_id = ?
                ''', (datetime.now().isoformat(), project_id))
                
                # 重置项目当前步骤
                cursor.execute('''
                    UPDATE projects 
                    SET current_step = 'service-mode', updated_at = ?
                    WHERE id = ?
                ''', (datetime.now().isoformat(), project_id))
                
                conn.commit()
                
                return {"success": True, "message": "项目进展重置成功"}
                
        except Exception as e:
            return {"success": False, "message": f"重置项目进展失败: {str(e)}"}
