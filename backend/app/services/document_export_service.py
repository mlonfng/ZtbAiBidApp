"""
文档导出服务层
"""

import os
import json
import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
import shutil

logger = logging.getLogger(__name__)

class DocumentExportService:
    """文档导出服务"""

    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ztbai.db")
        # 导出文件存储目录
        self.export_root = Path(__file__).parent.parent.parent / "static" / "exports"
        self.export_root.mkdir(parents=True, exist_ok=True)

    async def get_status(self, project_id: str) -> Dict[str, Any]:
        """获取文档导出状态"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT status, progress, result_data, updated_at 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ?
            """, (project_id, "document-export"))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                status, progress, result_data, updated_at = result
                return {
                    "project_id": project_id,
                    "step_key": "document-export",
                    "status": status,
                    "progress": progress,
                    "updated_at": updated_at,
                    "has_result": result_data is not None
                }
            else:
                return {
                    "project_id": project_id,
                    "step_key": "document-export",
                    "status": "pending",
                    "progress": 0
                }
        except Exception as e:
            logger.error(f"获取文档导出状态失败: {str(e)}")
            return {
                "project_id": project_id,
                "step_key": "document-export",
                "status": "error",
                "progress": 0,
                "error": str(e)
            }

    async def execute(self, project_id: str, export_format: str = "docx", sections: List[str] = None) -> Dict[str, Any]:
        """执行文档导出"""
        try:
            if sections is None:
                sections = []
            
            # 更新状态为进行中
            await self._update_step_progress(project_id, "in_progress", 10)
            
            # 获取项目信息
            project_info = await self._get_project_info(project_id)
            if not project_info:
                raise Exception(f"项目 {project_id} 不存在")
            
            # 获取生成的内容
            content_data = await self._get_content_data(project_id)
            await self._update_step_progress(project_id, "in_progress", 30)
            
            # 获取格式配置
            format_config = await self._get_format_config(project_id)
            await self._update_step_progress(project_id, "in_progress", 50)
            
            # 生成文档
            exported_files = await self._export_documents(project_id, project_info, content_data, format_config, export_format, sections)
            await self._update_step_progress(project_id, "in_progress", 90)
            
            result_data = {
                "files": exported_files,
                "exported_at": datetime.now().isoformat(),
                "export_format": export_format,
                "total_files": len(exported_files)
            }
            
            # 更新状态为完成
            await self._update_step_progress(project_id, "completed", 100, result_data)
            
            logger.info(f"项目 {project_id} 文档导出完成，生成 {len(exported_files)} 个文件")
            return result_data
            
        except Exception as e:
            logger.error(f"文档导出执行失败: {str(e)}")
            await self._update_step_progress(project_id, "error", 0, {"error": str(e)})
            raise e

    async def get_result(self, project_id: str) -> Dict[str, Any]:
        """获取文档导出结果"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT result_data, status, updated_at 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ?
            """, (project_id, "document-export"))
            
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
                    "files": [],
                    "exported_at": None,
                    "export_format": "docx",
                    "total_files": 0
                }
        except Exception as e:
            logger.error(f"获取文档导出结果失败: {str(e)}")
            raise e

    async def _get_project_info(self, project_id: str) -> Optional[Dict[str, Any]]:
        """获取项目信息"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT name, project_path, bid_file_name, created_at
                FROM projects 
                WHERE id = ?
            """, (project_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                name, project_path, bid_file_name, created_at = result
                return {
                    "project_id": project_id,
                    "name": name,
                    "project_path": project_path,
                    "bid_file_name": bid_file_name,
                    "created_at": created_at
                }
            return None
        except Exception as e:
            logger.error(f"获取项目信息失败: {str(e)}")
            return None

    async def _get_content_data(self, project_id: str) -> Dict[str, Any]:
        """获取生成的内容数据"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 获取内容生成结果
            cursor.execute("""
                SELECT result_data 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ? AND status = 'completed'
            """, (project_id, "content-generation"))
            
            result = cursor.fetchone()
            conn.close()
            
            if result and result[0]:
                return json.loads(result[0])
            else:
                return {"sections": [], "total_sections": 0}
        except Exception as e:
            logger.error(f"获取内容数据失败: {str(e)}")
            return {"sections": [], "total_sections": 0}

    async def _get_format_config(self, project_id: str) -> Dict[str, Any]:
        """获取格式配置"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 获取格式配置结果
            cursor.execute("""
                SELECT result_data 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ? AND status = 'completed'
            """, (project_id, "format-config"))
            
            result = cursor.fetchone()
            conn.close()
            
            if result and result[0]:
                return json.loads(result[0])
            else:
                return {"config": {}, "template_key": "standard"}
        except Exception as e:
            logger.error(f"获取格式配置失败: {str(e)}")
            return {"config": {}, "template_key": "standard"}

    async def _export_documents(self, project_id: str, project_info: Dict[str, Any], 
                               content_data: Dict[str, Any], format_config: Dict[str, Any],
                               export_format: str, sections: List[str]) -> List[Dict[str, Any]]:
        """导出文档"""
        exported_files = []
        
        try:
            # 创建项目导出目录
            project_export_dir = self.export_root / project_id
            project_export_dir.mkdir(exist_ok=True)
            
            # 生成主文档
            main_doc = await self._generate_main_document(
                project_id, project_info, content_data, format_config, export_format, project_export_dir
            )
            exported_files.append(main_doc)
            
            # 生成章节文档（如果指定了特定章节）
            if sections:
                for section_id in sections:
                    section_doc = await self._generate_section_document(
                        project_id, section_id, content_data, format_config, export_format, project_export_dir
                    )
                    if section_doc:
                        exported_files.append(section_doc)
            
            # 生成附件文档
            attachments = await self._generate_attachments(
                project_id, project_info, content_data, project_export_dir
            )
            exported_files.extend(attachments)
            
            logger.info(f"文档导出完成，生成 {len(exported_files)} 个文件")
            return exported_files
            
        except Exception as e:
            logger.error(f"文档导出失败: {str(e)}")
            raise e

    async def _generate_main_document(self, project_id: str, project_info: Dict[str, Any],
                                    content_data: Dict[str, Any], format_config: Dict[str, Any],
                                    export_format: str, export_dir: Path) -> Dict[str, Any]:
        """生成主文档"""
        try:
            # 构建完整文档内容
            document_content = self._build_document_content(project_info, content_data, format_config)
            
            # 根据格式生成文件
            if export_format.lower() == "html":
                filename = f"投标文件_{project_info['name']}.html"
                file_path = export_dir / filename
                await self._save_html_document(file_path, document_content, format_config)
            elif export_format.lower() == "md":
                filename = f"投标文件_{project_info['name']}.md"
                file_path = export_dir / filename
                await self._save_markdown_document(file_path, document_content)
            else:
                # 默认生成HTML文档
                filename = f"投标文件_{project_info['name']}.html"
                file_path = export_dir / filename
                await self._save_html_document(file_path, document_content, format_config)
            
            # 计算文件大小
            file_size = file_path.stat().st_size if file_path.exists() else 0
            
            return {
                "filename": filename,
                "format": export_format,
                "url": f"/static/exports/{project_id}/{filename}",
                "size": file_size,
                "path": str(file_path),
                "type": "main_document"
            }
            
        except Exception as e:
            logger.error(f"生成主文档失败: {str(e)}")
            raise e

    async def _generate_section_document(self, project_id: str, section_id: str,
                                       content_data: Dict[str, Any], format_config: Dict[str, Any],
                                       export_format: str, export_dir: Path) -> Optional[Dict[str, Any]]:
        """生成章节文档"""
        try:
            # 查找指定章节
            sections = content_data.get("sections", [])
            target_section = None
            for section in sections:
                if section.get("section_id") == section_id:
                    target_section = section
                    break
            
            if not target_section:
                logger.warning(f"未找到章节 {section_id}")
                return None
            
            # 生成章节内容
            section_content = f"""
# {target_section.get('title', '未命名章节')}

{target_section.get('content', '无内容')}
"""
            
            filename = f"章节_{target_section.get('title', section_id)}.{export_format}"
            file_path = export_dir / filename
            
            if export_format.lower() == "html":
                await self._save_html_document(file_path, section_content, format_config)
            else:
                await self._save_markdown_document(file_path, section_content)
            
            file_size = file_path.stat().st_size if file_path.exists() else 0
            
            return {
                "filename": filename,
                "format": export_format,
                "url": f"/static/exports/{project_id}/{filename}",
                "size": file_size,
                "path": str(file_path),
                "type": "section_document",
                "section_id": section_id
            }
            
        except Exception as e:
            logger.error(f"生成章节文档失败: {str(e)}")
            return None

    async def _generate_attachments(self, project_id: str, project_info: Dict[str, Any],
                                  content_data: Dict[str, Any], export_dir: Path) -> List[Dict[str, Any]]:
        """生成附件文档"""
        attachments = []
        
        try:
            # 生成目录文档
            toc_file = await self._generate_table_of_contents(project_id, content_data, export_dir)
            if toc_file:
                attachments.append(toc_file)
            
            # 复制项目相关文件
            project_path = Path(project_info.get("project_path", ""))
            if project_path.exists():
                # 复制原始招标文件
                bid_file_name = project_info.get("bid_file_name")
                if bid_file_name:
                    original_file = project_path / bid_file_name
                    if original_file.exists():
                        copied_file = export_dir / f"原始招标文件_{bid_file_name}"
                        shutil.copy2(original_file, copied_file)
                        
                        attachments.append({
                            "filename": f"原始招标文件_{bid_file_name}",
                            "format": original_file.suffix[1:] if original_file.suffix else "unknown",
                            "url": f"/static/exports/{project_id}/原始招标文件_{bid_file_name}",
                            "size": copied_file.stat().st_size,
                            "path": str(copied_file),
                            "type": "attachment"
                        })
            
            return attachments
            
        except Exception as e:
            logger.error(f"生成附件失败: {str(e)}")
            return []

    async def _generate_table_of_contents(self, project_id: str, content_data: Dict[str, Any], 
                                        export_dir: Path) -> Optional[Dict[str, Any]]:
        """生成目录文档"""
        try:
            sections = content_data.get("sections", [])
            
            toc_content = "# 投标文件目录\n\n"
            for i, section in enumerate(sections, 1):
                title = section.get("title", f"章节 {i}")
                toc_content += f"{i}. {title}\n"
            
            filename = "投标文件目录.md"
            file_path = export_dir / filename
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(toc_content)
            
            return {
                "filename": filename,
                "format": "md",
                "url": f"/static/exports/{project_id}/{filename}",
                "size": file_path.stat().st_size,
                "path": str(file_path),
                "type": "table_of_contents"
            }
            
        except Exception as e:
            logger.error(f"生成目录失败: {str(e)}")
            return None

    def _build_document_content(self, project_info: Dict[str, Any], content_data: Dict[str, Any], 
                               format_config: Dict[str, Any]) -> str:
        """构建完整文档内容"""
        content = f"""# {project_info.get('name', '投标文件')}

## 项目概述

- **项目名称**: {project_info.get('name', '未知项目')}
- **招标文件**: {project_info.get('bid_file_name', '未知文件')}
- **创建时间**: {project_info.get('created_at', '未知时间')}
- **文档生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

"""
        
        # 添加各章节内容
        sections = content_data.get("sections", [])
        for section in sections:
            title = section.get("title", "未命名章节")
            section_content = section.get("content", "无内容")
            
            content += f"\n## {title}\n\n{section_content}\n\n---\n\n"
        
        return content

    async def _save_html_document(self, file_path: Path, content: str, format_config: Dict[str, Any]):
        """保存HTML文档"""
        try:
            # 获取配置信息
            config = format_config.get("config", {})
            font_family = config.get("font_family", "宋体")
            font_size = config.get("font_size", 12)
            line_height = config.get("line_height", 1.5)
            
            # 将Markdown转换为HTML（简单实现）
            html_content = content.replace('\n', '<br>\n')
            html_content = html_content.replace('# ', '<h1>').replace('\n', '</h1>\n', 1)
            html_content = html_content.replace('## ', '<h2>').replace('\n', '</h2>\n')
            html_content = html_content.replace('---', '<hr>')
            
            html_template = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>投标文件</title>
    <style>
        body {{
            font-family: '{font_family}';
            font-size: {font_size}pt;
            line-height: {line_height};
            margin: 2cm;
            color: #333;
        }}
        h1 {{
            text-align: center;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #34495e;
            margin-top: 2em;
            margin-bottom: 1em;
        }}
        hr {{
            border: none;
            border-top: 1px solid #bdc3c7;
            margin: 2em 0;
        }}
        p {{
            text-indent: 2em;
            margin-bottom: 1em;
        }}
    </style>
</head>
<body>
{html_content}
</body>
</html>"""
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(html_template)
            
            logger.info(f"HTML文档已保存: {file_path}")
            
        except Exception as e:
            logger.error(f"保存HTML文档失败: {str(e)}")
            raise e

    async def _save_markdown_document(self, file_path: Path, content: str):
        """保存Markdown文档"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"Markdown文档已保存: {file_path}")
            
        except Exception as e:
            logger.error(f"保存Markdown文档失败: {str(e)}")
            raise e

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
            """, (project_id, "document-export", status, progress, result_json, datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"更新步骤进度失败: {str(e)}")
