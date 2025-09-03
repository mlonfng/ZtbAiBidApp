"""
资料管理服务层
"""

import os
import json
import sqlite3
import shutil
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# 快速模式开关
FAST_MODE = os.getenv("ZTBAI_FAST_MODE", "false").lower() == "true"

class MaterialManagementService:
    """资料管理服务"""

    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ztbai.db")
        self.base_project_path = Path("ZtbBidPro")
        self.base_project_path.mkdir(exist_ok=True)

        # 资料分类定义
        self.material_categories = {
            "qualification": {
                "name": "企业资质",
                "items": {
                    "business_license": "营业执照",
                    "qualification_cert": "资质证书",
                    "safety_cert": "安全生产许可证",
                    "tax_cert": "税务登记证"
                }
            },
            "performance": {
                "name": "业绩证明",
                "items": {
                    "project_contract": "项目合同",
                    "completion_cert": "竣工证书",
                    "client_reference": "客户证明",
                    "award_cert": "获奖证书"
                }
            },
            "financial": {
                "name": "财务证明",
                "items": {
                    "financial_report": "财务报表",
                    "bank_credit": "银行资信证明",
                    "audit_report": "审计报告",
                    "tax_payment": "纳税证明"
                }
            },
            "technical": {
                "name": "技术资料",
                "items": {
                    "tech_proposal": "技术方案",
                    "product_spec": "产品说明书",
                    "tech_drawing": "技术图纸",
                    "patent_cert": "专利证书"
                }
            }
        }

    async def get_status(self, project_id: str) -> Dict[str, Any]:
        """获取资料管理状态"""
        try:
            project_path = await self._get_project_path(project_id)
            if not project_path:
                return {
                    "project_id": project_id,
                    "step_key": "material-management",
                    "status": "pending",
                    "progress": 0
                }

            # 检查资料管理目录
            material_dir = project_path / "materials"
            if not material_dir.exists():
                return {
                    "project_id": project_id,
                    "step_key": "material-management",
                    "status": "pending",
                    "progress": 0
                }

            # 统计已上传的资料
            uploaded_files = list(material_dir.rglob("*"))
            uploaded_count = len([f for f in uploaded_files if f.is_file()])

            # 计算进度（假设需要至少10个文件）
            progress = min(uploaded_count * 10, 100)
            status = "completed" if progress >= 100 else "in_progress" if progress > 0 else "pending"

            return {
                "project_id": project_id,
                "step_key": "material-management",
                "status": status,
                "progress": progress,
                "uploaded_count": uploaded_count
            }

        except Exception as e:
            logger.error(f"获取资料管理状态失败: {e}")
            return {
                "project_id": project_id,
                "step_key": "material-management",
                "status": "error",
                "progress": 0,
                "error": str(e)
            }

    async def execute(self, project_id: str, action: str = "organize") -> Dict[str, Any]:
        """执行资料管理任务"""
        try:
            # 快速模式：使用模拟数据
            if FAST_MODE:
                logger.info(f"快速模式：资料管理任务 {project_id}")
                await self._update_step_progress(project_id, "in_progress", 20)

                # 模拟处理时间
                import asyncio
                await asyncio.sleep(0.3)
                await self._update_step_progress(project_id, "in_progress", 60)

                await asyncio.sleep(0.2)
                await self._update_step_progress(project_id, "completed", 100)

                return {
                    "action": action,
                    "status": "completed",
                    "materials_count": 8,  # 模拟已上传8个文件
                    "categories_count": len(self.material_categories),
                    "checklist_items": 16,  # 模拟16个清单项
                    "fast_mode": True
                }

            # 正常模式
            await self._update_step_progress(project_id, "in_progress", 10)

            project_path = await self._get_project_path(project_id)
            if not project_path:
                raise Exception(f"项目路径不存在: {project_id}")

            # 创建资料管理目录结构
            await self._create_material_directories(project_path)
            await self._update_step_progress(project_id, "in_progress", 30)

            # 分析现有资料
            materials = await self._analyze_existing_materials(project_path)
            await self._update_step_progress(project_id, "in_progress", 60)

            # 生成资料清单
            checklist = await self._generate_material_checklist(project_path)
            await self._update_step_progress(project_id, "in_progress", 80)

            # 保存资料管理配置
            await self._save_material_config(project_path, materials, checklist)
            await self._update_step_progress(project_id, "completed", 100)

            return {
                "action": action,
                "status": "completed",
                "materials_count": len(materials),
                "categories_count": len(self.material_categories),
                "checklist_items": len(checklist)
            }

        except Exception as e:
            logger.error(f"执行资料管理失败: {e}")
            await self._update_step_progress(project_id, "error", 0)
            raise e

    async def get_result(self, project_id: str) -> Dict[str, Any]:
        """获取资料管理结果"""
        try:
            # 快速模式：返回模拟数据
            if FAST_MODE:
                return {
                    "materials": [
                        {
                            "filename": "营业执照.pdf",
                            "category_id": "qualification",
                            "category_name": "企业资质",
                            "file_size": 1024000,
                            "upload_time": datetime.now().isoformat(),
                            "description": "企业营业执照"
                        },
                        {
                            "filename": "资质证书.pdf",
                            "category_id": "qualification",
                            "category_name": "企业资质",
                            "file_size": 2048000,
                            "upload_time": datetime.now().isoformat(),
                            "description": "企业资质证书"
                        },
                        {
                            "filename": "项目合同.pdf",
                            "category_id": "performance",
                            "category_name": "业绩证明",
                            "file_size": 3072000,
                            "upload_time": datetime.now().isoformat(),
                            "description": "重要项目合同"
                        }
                    ],
                    "categories": [
                        {
                            "category_id": cat_id,
                            "category_name": cat_info["name"],
                            "items": cat_info["items"]
                        }
                        for cat_id, cat_info in self.material_categories.items()
                    ],
                    "checklist": [
                        {
                            "category_id": "qualification",
                            "category_name": "企业资质",
                            "items": [
                                {"item_id": "business_license", "item_name": "营业执照", "uploaded": True, "required": True},
                                {"item_id": "qualification_cert", "item_name": "资质证书", "uploaded": True, "required": True}
                            ]
                        },
                        {
                            "category_id": "performance",
                            "category_name": "业绩证明",
                            "items": [
                                {"item_id": "project_contract", "item_name": "项目合同", "uploaded": True, "required": True},
                                {"item_id": "completion_cert", "item_name": "竣工证书", "uploaded": False, "required": True}
                            ]
                        }
                    ],
                    "fast_mode": True
                }

            # 正常模式
            project_path = await self._get_project_path(project_id)
            if not project_path:
                return {
                    "materials": [],
                    "categories": [],
                    "checklist": []
                }

            # 读取资料管理配置
            config_file = project_path / "materials" / "material_config.json"
            if config_file.exists():
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                return config

            # 如果没有配置文件，返回基础结构
            return {
                "materials": await self._get_uploaded_materials(project_path),
                "categories": list(self.material_categories.keys()),
                "checklist": await self._generate_material_checklist(project_path)
            }

        except Exception as e:
            logger.error(f"获取资料管理结果失败: {e}")
            return {
                "materials": [],
                "categories": [],
                "checklist": [],
                "error": str(e)
            }

    async def upload_material(self, project_id: str, category_id: str, item_id: str,
                            file_content: bytes, filename: str, description: str = "") -> Dict[str, Any]:
        """上传资料文件"""
        try:
            project_path = await self._get_project_path(project_id)
            if not project_path:
                return {"success": False, "error": f"项目不存在: {project_id}"}

            # 创建资料目录
            material_dir = project_path / "materials" / category_id
            material_dir.mkdir(parents=True, exist_ok=True)

            # 保存文件
            file_path = material_dir / filename
            with open(file_path, 'wb') as f:
                f.write(file_content)

            # 记录文件信息
            file_info = {
                "filename": filename,
                "category_id": category_id,
                "item_id": item_id,
                "file_path": str(file_path),
                "file_size": len(file_content),
                "upload_time": datetime.now().isoformat(),
                "description": description
            }

            # 更新资料记录
            await self._add_material_record(project_path, file_info)

            return {
                "success": True,
                "file_info": file_info,
                "message": f"文件 {filename} 上传成功"
            }

        except Exception as e:
            logger.error(f"上传资料文件失败: {e}")
            return {"success": False, "error": str(e)}

    # 辅助方法
    async def _get_project_path(self, project_id: str) -> Optional[Path]:
        """获取项目路径"""
        try:
            # 查询数据库获取项目信息
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT project_path FROM projects WHERE id = ?", (project_id,))
                result = cursor.fetchone()

                if result:
                    return Path(result[0])

                # 如果数据库中没有，尝试从ZtbBidPro目录查找
                for project_dir in self.base_project_path.iterdir():
                    if project_dir.is_dir() and project_id in project_dir.name:
                        return project_dir

                return None

        except Exception as e:
            logger.error(f"获取项目路径失败: {e}")
            return None

    async def _create_material_directories(self, project_path: Path):
        """创建资料管理目录结构"""
        material_base = project_path / "materials"
        material_base.mkdir(exist_ok=True)

        # 为每个分类创建目录
        for category_id in self.material_categories:
            category_dir = material_base / category_id
            category_dir.mkdir(exist_ok=True)

    async def _analyze_existing_materials(self, project_path: Path) -> List[Dict[str, Any]]:
        """分析现有资料"""
        materials = []
        material_dir = project_path / "materials"

        if not material_dir.exists():
            return materials

        for category_dir in material_dir.iterdir():
            if category_dir.is_dir():
                category_id = category_dir.name
                for file_path in category_dir.iterdir():
                    if file_path.is_file():
                        materials.append({
                            "filename": file_path.name,
                            "category_id": category_id,
                            "category_name": self.material_categories.get(category_id, {}).get("name", category_id),
                            "file_path": str(file_path),
                            "file_size": file_path.stat().st_size,
                            "upload_time": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                        })

        return materials

    async def _generate_material_checklist(self, project_path: Path) -> List[Dict[str, Any]]:
        """生成资料清单"""
        checklist = []

        for category_id, category_info in self.material_categories.items():
            category_item = {
                "category_id": category_id,
                "category_name": category_info["name"],
                "items": []
            }

            for item_id, item_name in category_info["items"].items():
                # 检查是否已上传
                material_dir = project_path / "materials" / category_id
                uploaded = False
                if material_dir.exists():
                    uploaded = any(f.is_file() for f in material_dir.iterdir())

                category_item["items"].append({
                    "item_id": item_id,
                    "item_name": item_name,
                    "uploaded": uploaded,
                    "required": True  # 默认都是必需的
                })

            checklist.append(category_item)

        return checklist

    async def _save_material_config(self, project_path: Path, materials: List[Dict[str, Any]],
                                  checklist: List[Dict[str, Any]]):
        """保存资料管理配置"""
        config = {
            "materials": materials,
            "categories": [
                {
                    "category_id": cat_id,
                    "category_name": cat_info["name"],
                    "items": cat_info["items"]
                }
                for cat_id, cat_info in self.material_categories.items()
            ],
            "checklist": checklist,
            "last_updated": datetime.now().isoformat()
        }

        config_file = project_path / "materials" / "material_config.json"
        config_file.parent.mkdir(parents=True, exist_ok=True)

        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)

    async def _get_uploaded_materials(self, project_path: Path) -> List[Dict[str, Any]]:
        """获取已上传的资料列表"""
        return await self._analyze_existing_materials(project_path)

    async def _add_material_record(self, project_path: Path, file_info: Dict[str, Any]):
        """添加资料记录"""
        records_file = project_path / "materials" / "upload_records.json"

        # 读取现有记录
        records = []
        if records_file.exists():
            with open(records_file, 'r', encoding='utf-8') as f:
                records = json.load(f)

        # 添加新记录
        records.append(file_info)

        # 保存记录
        with open(records_file, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

    async def _update_step_progress(self, project_id: str, status: str, progress: int,
                                  data: Optional[Dict[str, Any]] = None):
        """更新步骤进度"""
        try:
            # 这里可以实现数据库更新逻辑
            # 目前先记录日志
            logger.info(f"项目 {project_id} 资料管理进度更新: {status} - {progress}%")
        except Exception as e:
            logger.error(f"更新步骤进度失败: {e}")
