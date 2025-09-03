"""
内容生成服务层
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
from Agent.generation.technical_content_agent import TechnicalContentAgent
from Agent.generation.commercial_content_agent import CommercialContentAgent
from ..core.repository import Repository

logger = logging.getLogger(__name__)

class ContentGenerationService:
    """内容生成服务"""

    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ztbai.db")
        self.repository = Repository()
        self.agent_manager = AgentManager()
        self._register_agents()

    def _register_agents(self):
        """注册Agent"""
        self.agent_manager.register_agent_class(TechnicalContentAgent, "technical_content")
        self.agent_manager.register_agent_class(CommercialContentAgent, "commercial_content")

    async def get_status(self, project_id: str) -> Dict[str, Any]:
        """获取内容生成状态"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT status, progress, result_data, updated_at 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ?
            """, (project_id, "content-generation"))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                status, progress, result_data, updated_at = result
                return {
                    "project_id": project_id,
                    "step_key": "content-generation",
                    "status": status,
                    "progress": progress,
                    "updated_at": updated_at,
                    "has_result": result_data is not None
                }
            else:
                return {
                    "project_id": project_id,
                    "step_key": "content-generation",
                    "status": "pending",
                    "progress": 0
                }
        except Exception as e:
            logger.error(f"获取内容生成状态失败: {str(e)}")
            return {
                "project_id": project_id,
                "step_key": "content-generation",
                "status": "error",
                "progress": 0,
                "error": str(e)
            }

    async def execute(self, project_id: str, chapter_key: str = None, section_keys: List[str] = None) -> Dict[str, Any]:
        """执行内容生成"""
        try:
            # 更新状态为进行中
            await self._update_step_progress(project_id, "in_progress", 10)
            
            # 获取项目信息
            project_info = await self._get_project_info(project_id)
            if not project_info:
                raise Exception(f"项目 {project_id} 不存在")
            
            # 获取框架数据
            framework_data = await self._get_framework_data(project_id)
            
            # 获取分析数据
            analysis_data = await self._get_analysis_data(project_id)
            
            # 获取资料数据
            material_data = await self._get_material_data(project_id)
            
            # 更新进度
            await self._update_step_progress(project_id, "in_progress", 30)
            
            # 如果指定了章节，只生成该章节内容
            if chapter_key:
                chapters_to_generate = [chapter_key]
            elif section_keys:
                chapters_to_generate = section_keys
            else:
                # 从框架数据获取所有章节
                chapters_to_generate = []
                if framework_data and "sections" in framework_data:
                    sections = framework_data["sections"]
                    # 使用section_id和section_name组合来避免重复
                    for i, section in enumerate(sections):
                        section_id = section.get("section_id")
                        section_name = section.get("section_name", "")
                        if section_id:
                            # 创建唯一标识符
                            unique_id = f"{section_id}_{hash(section_name) & 0xFFFFFFFF}"
                            chapters_to_generate.append(unique_id)
                            print(f"DEBUG: Added section {i+1}: {unique_id} - {section_name[:20]}")
                
                # 如果没有框架数据，使用默认章节
                if not chapters_to_generate:
                    chapters_to_generate = ["technical_proposal", "commercial_proposal", "qualification"]
            
            generated_sections = []
            total_chapters = len(chapters_to_generate)
            print(f"DEBUG: Generating {total_chapters} chapters: {chapters_to_generate}")
            
            for i, chapter_key in enumerate(chapters_to_generate):
                try:
                    # 生成章节内容
                    section_result = await self._generate_chapter_content(
                        project_id, chapter_key, project_info, analysis_data, material_data, framework_data
                    )
                    
                    if section_result:
                        generated_sections.append(section_result)
                    
                    # 更新进度
                    progress = 30 + int((i + 1) / total_chapters * 60)
                    await self._update_step_progress(project_id, "in_progress", progress)
                    
                except Exception as e:
                    logger.error(f"生成章节 {chapter_key} 内容失败: {str(e)}")
                    generated_sections.append({
                        "key": chapter_key,
                        "status": "error",
                        "error": str(e)
                    })
            
            # 保存生成结果
            result_data = {
                "sections": generated_sections,
                "summary": f"已生成 {len([s for s in generated_sections if s.get('status') == 'completed'])} 个章节内容",
                "total_sections": len(generated_sections),
                "success_count": len([s for s in generated_sections if s.get('status') == 'completed']),
                "error_count": len([s for s in generated_sections if s.get('status') == 'error'])
            }
            
            # 更新状态为完成
            await self._update_step_progress(project_id, "completed", 100, result_data)
            
            logger.info(f"项目 {project_id} 内容生成完成")
            return result_data
            
        except Exception as e:
            logger.error(f"内容生成执行失败: {str(e)}")
            await self._update_step_progress(project_id, "error", 0)
            raise e

    async def get_result(self, project_id: str) -> Dict[str, Any]:
        """获取内容生成结果"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT result_data, status, updated_at 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ?
            """, (project_id, "content-generation"))
            
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
                    "sections": [],
                    "summary": "暂无生成内容",
                    "total_sections": 0,
                    "success_count": 0,
                    "error_count": 0
                }
        except Exception as e:
            logger.error(f"获取内容生成结果失败: {str(e)}")
            raise e

    async def _generate_chapter_content(self, project_id: str, chapter_key: str, project_info: Dict, 
                                      analysis_data: Dict, material_data: Dict, framework_data: Dict) -> Dict[str, Any]:
        """生成单个章节内容"""
        try:
            # 提取原始section_id（去除哈希后缀）
            original_section_id = chapter_key
            if "_" in chapter_key and chapter_key.count("_") > 1:
                # 格式: section_一_123456789 -> section_一
                parts = chapter_key.split("_")
                original_section_id = "_".join(parts[:-1])
            
            # 获取框架中的Agent分配信息
            assigned_agent_type = None
            section_name = original_section_id
            if framework_data and "sections" in framework_data:
                sections = framework_data["sections"]
                for section in sections:
                    section_id = section.get("section_id")
                    section_name_val = section.get("section_name", "")
                    # 匹配section_id和section_name组合
                    unique_id = f"{section_id}_{hash(section_name_val) & 0xFFFFFFFF}"
                    if unique_id == chapter_key:
                        agent_req = section.get("agent_requirements", {})
                        assigned_agent_type = agent_req.get("primary_agent")
                        section_name = section_name_val
                        break
            
            # 根据分配的Agent类型选择内容生成Agent
            agent_type_mapping = {
                "bid_technical_agent": "technical_content",
                "bid_commercial_agent": "commercial_content", 
                "bid_cover_agent": "commercial_content",
                "bid_financial_agent": "commercial_content",
                "bid_general_agent": "technical_content",
                "bid_legal_agent": "commercial_content",
                "bid_marketing_agent": "commercial_content",
                "bid_qualification_agent": "commercial_content",
                "bid_risk_agent": "technical_content",
                "bid_strategy_agent": "technical_content"
            }
            
            if assigned_agent_type and assigned_agent_type in agent_type_mapping:
                agent_type = agent_type_mapping[assigned_agent_type]
            elif chapter_key in ["technical_proposal", "technical_specification", "implementation_plan"]:
                agent_type = "technical_content"
            elif chapter_key in ["commercial_proposal", "pricing", "qualification"]:
                agent_type = "commercial_content"
            else:
                agent_type = "technical_content"  # 默认使用技术内容Agent
            
            # 创建Agent配置
            agent_config = AgentConfig(
                name=f"内容生成Agent_{project_id}_{chapter_key}",
                agent_type=agent_type,
                description=f"投标文件内容生成Agent - {chapter_key}",
                config={
                    "chapter_key": chapter_key,
                    "ai_service": await self._get_ai_service_config()
                }
            )
            
            # 创建输入数据
            input_data = {
                "project_id": project_id,
                "section_id": chapter_key,  # Agent期望的字段名
                "chapter_key": chapter_key,  # 保持兼容性
                "project_path": project_info.get("project_path"),
                "analysis_data": analysis_data,
                "materials_data": material_data,  # Agent期望的字段名
                "material_data": material_data,   # 保持兼容性
                "framework_config": framework_data,  # Agent期望的字段名
                "framework_data": framework_data,    # 保持兼容性
                "service_mode": project_info.get("service_mode", "free")
            }
            
            # 执行内容生成
            agent = self.agent_manager.create_agent(agent_config)
            result = await agent.execute(input_data)
            
            if result.success:
                # 保存生成的内容到文件
                content_file = await self._save_chapter_content(
                    project_id, chapter_key, result.data.get("content", {}), project_info["project_path"]
                )
                
                return {
                    "key": chapter_key,
                    "status": "completed",
                    "content_file": content_file,
                    "word_count": len(str(result.data.get("content", {}))),
                    "generated_at": datetime.now().isoformat()
                }
            else:
                return {
                    "key": chapter_key,
                    "status": "error",
                    "error": result.error
                }
                
        except Exception as e:
            logger.error(f"生成章节 {chapter_key} 内容失败: {str(e)}")
            return {
                "key": chapter_key,
                "status": "error",
                "error": str(e)
            }

    async def _save_chapter_content(self, project_id: str, chapter_key: str, content_data: Dict[str, Any], project_path: str) -> str:
        """保存章节内容到文件"""
        try:
            project_dir = Path(project_path)
            content_dir = project_dir / "bid_content"
            content_dir.mkdir(exist_ok=True)
            
            # 生成文件名
            content_file = content_dir / f"{chapter_key}.md"
            
            # 写入内容 - 处理Agent返回的blocks结构
            with open(content_file, 'w', encoding='utf-8') as f:
                f.write(f"# {content_data.get('section_name', chapter_key)}\n\n")
                f.write(f"**生成类型**: {content_data.get('generation_type', 'ai')}  \n")
                f.write(f"**生成时间**: {content_data.get('generated_time', '')}\n\n")
                
                # 处理各个内容块
                blocks = content_data.get("blocks", {})
                for block_id, block_data in blocks.items():
                    block_name = block_data.get("block_name", block_id)
                    block_type = block_data.get("block_type", "text")
                    block_content = block_data.get("content", "")
                    
                    f.write(f"## {block_name}\n\n")
                    
                    if block_type == "table" and isinstance(block_content, dict):
                        # 处理表格数据
                        f.write(self._convert_table_to_markdown(block_content))
                    else:
                        # 处理文本内容
                        f.write(f"{block_content}\n\n")
            
            logger.info(f"章节内容已保存到: {content_file}")
            return str(content_file)
            
        except Exception as e:
            logger.error(f"保存章节内容失败: {str(e)}")
            return ""

    def _convert_table_to_markdown(self, table_data: Dict[str, Any]) -> str:
        """将表格数据转换为Markdown格式"""
        try:
            if not isinstance(table_data, dict):
                return str(table_data)
            
            headers = table_data.get("headers", [])
            rows = table_data.get("rows", [])
            
            if not headers or not rows:
                return str(table_data)
            
            # 创建表头
            markdown = "| " + " | ".join(headers) + " |\n"
            markdown += "| " + " | ".join(["---"] * len(headers)) + " |\n"
            
            # 添加表格行
            for row in rows:
                if isinstance(row, dict):
                    # 字典格式的行
                    row_values = [str(row.get(header, "")) for header in headers]
                    markdown += "| " + " | ".join(row_values) + " |\n"
                elif isinstance(row, list):
                    # 列表格式的行
                    markdown += "| " + " | ".join([str(cell) for cell in row]) + " |\n"
                else:
                    markdown += f"| {str(row)} |\n"
            
            return markdown + "\n"
            
        except Exception as e:
            logger.error(f"转换表格到Markdown失败: {str(e)}")
            return str(table_data)

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
            
            # 检查所有项目用于调试
            cursor.execute('SELECT id, name, project_path FROM projects')
            all_projects = cursor.fetchall()
            print(f"DEBUG: All projects in DB: {all_projects}")
            
            conn.close()
            
            if result:
                project_name, project_path, service_mode, created_at = result
                print(f"DEBUG: Found project {project_id}: {project_name}, path: {project_path}")
                return {
                    "project_id": project_id,
                    "project_name": project_name,
                    "project_path": project_path,
                    "service_mode": service_mode,
                    "created_at": created_at
                }
            else:
                print(f"DEBUG: Project {project_id} not found in database")
            return None
        except Exception as e:
            logger.error(f"获取项目信息失败: {str(e)}")
            return None

    async def _get_framework_data(self, project_id: str) -> Dict[str, Any]:
        """获取框架数据"""
        try:
            # 首先尝试从数据库获取框架数据
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT result_data 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ? AND status = 'completed'
            """, (project_id, "framework-generation"))
            
            result = cursor.fetchone()
            conn.close()
            
            if result and result[0]:
                db_framework_data = json.loads(result[0])
                print(f"DEBUG: Found framework data in database for project {project_id}")
                print(f"DEBUG: Database framework keys: {list(db_framework_data.keys())}")
                
                # 如果数据库中有框架数据，但只有基本框架，尝试从配置文件获取完整框架
                if (db_framework_data.get("framework", {}).get("sections", []) and 
                    len(db_framework_data["framework"]["sections"]) < 10):
                    
                    print(f"DEBUG: Database has only {len(db_framework_data['framework']['sections'])} sections, trying config file")
                    
                    # 获取项目路径
                    project_info = await self._get_project_info(project_id)
                    if project_info and "project_path" in project_info:
                        project_path = project_info["project_path"]
                        framework_config_path = os.path.join(project_path, "投标文件框架配置.json")
                        
                        if os.path.exists(framework_config_path):
                            with open(framework_config_path, 'r', encoding='utf-8') as f:
                                file_framework_data = json.load(f)
                            
                            # 合并文件框架数据到数据库框架数据
                            if "sections" in file_framework_data:
                                db_framework_data["framework"]["sections"] = file_framework_data["sections"]
                                print(f"DEBUG: Merged {len(file_framework_data['sections'])} sections from config file")
                            
                            return db_framework_data
                else:
                    print(f"DEBUG: Using database framework data with {len(db_framework_data.get('framework', {}).get('sections', []))} sections")
                
                return db_framework_data
            else:
                print(f"DEBUG: No framework data found in database for project {project_id}")
            
            # 如果数据库中没有框架数据，尝试从配置文件获取
            project_info = await self._get_project_info(project_id)
            if project_info and "project_path" in project_info:
                project_path = project_info["project_path"]
                framework_config_path = os.path.join(project_path, "投标文件框架配置.json")
                
                print(f"DEBUG: Looking for framework config at: {framework_config_path}")
                print(f"DEBUG: Config file exists: {os.path.exists(framework_config_path)}")
                
                if os.path.exists(framework_config_path):
                    with open(framework_config_path, 'r', encoding='utf-8') as f:
                        file_framework_data = json.load(f)
                    
                    print(f"DEBUG: Framework config keys: {list(file_framework_data.keys())}")
                    if "sections" in file_framework_data:
                        print(f"DEBUG: Number of sections in config: {len(file_framework_data['sections'])}")
                    
                    # 直接返回配置文件数据（新格式）
                    return file_framework_data
            
            return {}
        except Exception as e:
            logger.error(f"获取框架数据失败: {str(e)}")
            return {}

    async def _get_analysis_data(self, project_id: str) -> Dict[str, Any]:
        """获取招标文件分析数据"""
        try:
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

    async def _get_material_data(self, project_id: str) -> Dict[str, Any]:
        """获取资料管理数据"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT result_data 
                FROM step_progress 
                WHERE project_id = ? AND step_key = ? AND status = 'completed'
            """, (project_id, "material-management"))
            
            result = cursor.fetchone()
            conn.close()
            
            if result and result[0]:
                return json.loads(result[0])
            return {}
        except Exception as e:
            logger.error(f"获取资料数据失败: {str(e)}")
            return {}

    async def _get_ai_service_config(self) -> Dict[str, Any]:
        """获取AI服务配置"""
        return {
            "provider": "deepseek",
            "model": "deepseek-chat",
            "temperature": 0.7
        }

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
            """, (project_id, "content-generation", status, progress, result_json, datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"更新步骤进度失败: {str(e)}")
