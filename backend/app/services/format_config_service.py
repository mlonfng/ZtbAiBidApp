"""
格式配置服务层
"""

import os
import json
import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class FormatConfigService:
    """格式配置服务"""

    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ztbai.db")
        self.config_templates = {
            "standard": {
                "template_name": "标准模板",
                "font_family": "宋体",
                "font_size": 12,
                "line_height": 1.5,
                "margin_top": 2.54,
                "margin_bottom": 2.54,
                "margin_left": 3.17,
                "margin_right": 3.17
            },
            "professional": {
                "template_name": "专业模板",
                "font_family": "微软雅黑",
                "font_size": 11,
                "line_height": 1.6,
                "margin_top": 2.0,
                "margin_bottom": 2.0,
                "margin_left": 2.5,
                "margin_right": 2.5
            }
        }

    async def get_status(self, project_id: str) -> Dict[str, Any]:
        """获取格式配置状态"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT status, progress, result_data, updated_at 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ?
            """, (project_id, "format-config"))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                status, progress, result_data, updated_at = result
                return {
                    "project_id": project_id,
                    "step_key": "format-config",
                    "status": status,
                    "progress": progress,
                    "updated_at": updated_at,
                    "has_result": result_data is not None
                }
            else:
                return {
                    "project_id": project_id,
                    "step_key": "format-config",
                    "status": "pending",
                    "progress": 0
                }
        except Exception as e:
            logger.error(f"获取格式配置状态失败: {str(e)}")
            return {
                "project_id": project_id,
                "step_key": "format-config",
                "status": "error",
                "progress": 0,
                "error": str(e)
            }

    async def execute(self, project_id: str, template_type: str = "standard", 
                     custom_config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """执行格式配置"""
        try:
            # 更新状态为进行中
            await self._update_step_progress(project_id, "in_progress", 20)
            
            # 获取项目信息
            project_info = await self._get_project_info(project_id)
            if not project_info:
                raise Exception(f"项目 {project_id} 不存在")
            
            # 生成格式配置
            config_data = await self._generate_format_config(template_type, custom_config)
            
            # 更新进度
            await self._update_step_progress(project_id, "in_progress", 60)
            
            # 保存配置到文件
            config_file = await self._save_format_config(project_id, config_data, project_info["project_path"])
            
            # 生成CSS样式文件
            css_file = await self._generate_css_file(project_id, config_data, project_info["project_path"])
            
            result_data = {
                "template_key": template_type,
                "config_file": config_file,
                "css_file": css_file,
                "config": config_data,
                "applied_at": datetime.now().isoformat()
            }
            
            # 更新状态为完成
            await self._update_step_progress(project_id, "completed", 100, result_data)
            
            logger.info(f"项目 {project_id} 格式配置完成")
            return result_data
            
        except Exception as e:
            logger.error(f"格式配置执行失败: {str(e)}")
            await self._update_step_progress(project_id, "error", 0)
            raise e

    async def get_result(self, project_id: str) -> Dict[str, Any]:
        """获取格式配置结果"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT result_data, status, updated_at 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ?
            """, (project_id, "format-config"))
            
            result = cursor.fetchone()
            conn.close()
            
            if result and result[0]:
                result_data, status, updated_at = result
                return {
                    **json.loads(result_data),
                    "status": status,
                    "updated_at": updated_at
                }
            else:
                return {
                    "template_key": "default",
                    "config_file": None,
                    "css_file": None,
                    "config": {}
                }
        except Exception as e:
            logger.error(f"获取格式配置结果失败: {str(e)}")
            raise e

    async def _generate_format_config(self, template_type: str, custom_config: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """生成格式配置"""
        # 获取基础模板配置
        base_config = self.config_templates.get(template_type, self.config_templates["standard"])
        
        # 合并自定义配置
        if custom_config:
            config_data = {**base_config, **custom_config}
        else:
            config_data = base_config.copy()
        
        # 添加元数据
        config_data.update({
            "template_type": template_type,
            "created_at": datetime.now().isoformat(),
            "version": "1.0"
        })
        
        return config_data

    async def _save_format_config(self, project_id: str, config_data: Dict[str, Any], project_path: str) -> str:
        """保存格式配置到文件"""
        try:
            project_dir = Path(project_path)
            config_dir = project_dir / "format_config"
            config_dir.mkdir(exist_ok=True)
            
            # 保存配置文件
            config_file = config_dir / "document_format.json"
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(config_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"格式配置已保存到: {config_file}")
            return str(config_file)
            
        except Exception as e:
            logger.error(f"保存格式配置失败: {str(e)}")
            return ""

    async def _generate_css_file(self, project_id: str, config_data: Dict[str, Any], project_path: str) -> str:
        """生成CSS样式文件"""
        try:
            project_dir = Path(project_path)
            config_dir = project_dir / "format_config"
            config_dir.mkdir(exist_ok=True)
            
            # 生成CSS内容
            css_content = f"""
/* 文档样式配置 */
body {{
    font-family: '{config_data.get('font_family', '宋体')}';
    font-size: {config_data.get('font_size', 12)}pt;
    line-height: {config_data.get('line_height', 1.5)};
    margin: {config_data.get('margin_top', 2.54)}cm {config_data.get('margin_right', 3.17)}cm {config_data.get('margin_bottom', 2.54)}cm {config_data.get('margin_left', 3.17)}cm;
}}

h1 {{
    font-size: {int(config_data.get('font_size', 12)) + 4}pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 1em;
}}

h2 {{
    font-size: {int(config_data.get('font_size', 12)) + 2}pt;
    font-weight: bold;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
}}

h3 {{
    font-size: {int(config_data.get('font_size', 12)) + 1}pt;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
}}

p {{
    margin-bottom: 0.5em;
    text-indent: 2em;
}}

table {{
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
}}

th, td {{
    border: 1px solid #000;
    padding: 0.5em;
    text-align: left;
}}

th {{
    background-color: #f0f0f0;
    font-weight: bold;
}}
"""
            
            # 保存CSS文件
            css_file = config_dir / "document_style.css"
            with open(css_file, 'w', encoding='utf-8') as f:
                f.write(css_content)
            
            logger.info(f"CSS样式文件已生成: {css_file}")
            return str(css_file)
            
        except Exception as e:
            logger.error(f"生成CSS文件失败: {str(e)}")
            return ""

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
            """, (project_id, "format-config", status, progress, result_json, datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"更新步骤进度失败: {str(e)}")
