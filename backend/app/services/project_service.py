"""
项目管理服务
提供项目创建、列表、删除等功能
"""

import os
import json
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import sqlite3
import logging

# 导入加密工具
try:
    from ..utils.encryption import AESEncryption, calculate_file_md5, sanitize_filename
except ImportError:
    try:
        # 尝试绝对导入
        from app.utils.encryption import AESEncryption, calculate_file_md5, sanitize_filename
    except ImportError:
        # 如果导入失败，创建简单的替代实现
        import hashlib
        import re
        from datetime import datetime

        class AESEncryption:
            def encrypt(self, text): return text
            def decrypt(self, text): return text

        def calculate_file_md5(file_path):
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()

        def safe_decode_filename(raw_filename):
            """安全解码文件名，处理中文编码问题"""
            print(f"🔍 [DEBUG] safe_decode_filename 被调用，输入: {repr(raw_filename)}, 类型: {type(raw_filename)}")
            try:
                # 如果已经是字符串，直接返回
                if isinstance(raw_filename, str):
                    print(f"🔍 [DEBUG] 输入是字符串，直接返回: {repr(raw_filename)}")
                    return raw_filename
                
                # 如果是字节类型，尝试解码
                if isinstance(raw_filename, bytes):
                    # 尝试UTF-8解码
                    try:
                        return raw_filename.decode('utf-8')
                    except UnicodeDecodeError:
                        try:
                            # 尝试GBK解码（Windows系统默认）
                            return raw_filename.decode('gbk')
                        except UnicodeDecodeError:
                            try:
                                # 尝试使用chardet检测编码
                                import chardet
                                detected = chardet.detect(raw_filename)
                                if detected['encoding']:
                                    return raw_filename.decode(detected['encoding'])
                            except:
                                pass
                            # 如果所有方法都失败，使用安全文件名
                            return "bid_document"
                
                # 其他类型转换为字符串
                return str(raw_filename)
                
            except Exception as e:
                logger.warning(f"文件名解码失败: {e}")
                return "bid_document"

        def sanitize_filename(filename):
            # 首先安全解码文件名
            decoded_filename = safe_decode_filename(filename)
            
            # 按照用户要求的命名规范实现
            name_without_ext = decoded_filename.rsplit('.', 1)[0] if '.' in decoded_filename else decoded_filename
            
            # 替换特殊字符为下划线，保留中文字符
            sanitized = re.sub(r'[^\w\u4e00-\u9fff]', '_', name_without_ext)
            sanitized = re.sub(r'_+', '_', sanitized).strip('_') or "project"
            
            # 添加时间戳
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            return f"{sanitized}_{timestamp}"

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProjectService:
    """项目管理服务"""
    
    def __init__(self, db_path: str = "ztbai.db", projects_root: str = None):
        """
        初始化项目服务

        Args:
            db_path: 数据库文件路径
            projects_root: 项目根目录，如果为None则自动检测
        """
        if projects_root is None:
            # 自动检测项目根目录
            current_dir = Path.cwd()
            if current_dir.name == "backend":
                # 如果在backend目录下运行，使用上级目录的ZtbBidPro
                projects_root = "../ZtbBidPro"
            else:
                # 否则使用当前目录的ZtbBidPro
                projects_root = "./ZtbBidPro"

        self.db_path = Path(db_path)
        self.projects_root = Path(projects_root)
        self.projects_root.mkdir(exist_ok=True)
        
        # 初始化数据库
        self._init_database()
        
        logger.info(f"项目服务初始化完成 - 数据库: {self.db_path}, 项目根目录: {self.projects_root}")
    
    def _init_database(self):
        """初始化数据库表"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 创建项目表
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS projects (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        bid_file_name TEXT,
                        user_phone TEXT,
                        service_mode TEXT DEFAULT 'standard',
                        status TEXT DEFAULT 'active',
                        project_path TEXT,
                        description TEXT,
                        current_step VARCHAR(50) DEFAULT 'service-mode',
                        progress_data TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')

                # 检查并添加 file_md5 列
                cursor.execute("PRAGMA table_info(projects)")
                columns = [info[1] for info in cursor.fetchall()]
                if 'file_md5' not in columns:
                    cursor.execute('ALTER TABLE projects ADD COLUMN file_md5 TEXT')

                
                # 创建项目文件表
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS project_files (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        project_id TEXT,
                        file_name TEXT,
                        file_path TEXT,
                        file_type TEXT,
                        file_size INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (project_id) REFERENCES projects (id)
                    )
                ''')
                
                conn.commit()
                logger.info("数据库表初始化完成")
                
        except Exception as e:
            logger.error(f"初始化数据库失败: {e}")
            raise
    
    async def create_project(self, file: Any, user_phone: str = "") -> Dict[str, Any]:
        """
        通过上传招标文件创建新项目 (异步版本)

        Args:
            file: FastAPI的UploadFile对象
            user_phone: 用户手机号

        Returns:
            项目创建结果
        """
        temp_dir = Path("./temp_uploads")
        temp_dir.mkdir(exist_ok=True)
        temp_file_path = temp_dir / f"{uuid.uuid4()}_{file.filename}"

        try:
            # 异步保存上传的文件到临时位置
            with open(temp_file_path, "wb") as buffer:
                content = await file.read()  # async read
                buffer.write(content)

            bid_file_path = str(temp_file_path)
            original_filename = file.filename

            # --- 原有的同步逻辑开始 ---
            # 1. 安全解码和生成项目目录名
            safe_filename = safe_decode_filename(original_filename)
            project_dir_name = sanitize_filename(safe_filename)
            
            logger.info(f"原始文件名: {repr(original_filename)}")
            logger.info(f"安全解码后: {repr(safe_filename)}")
            logger.info(f"项目目录名: {project_dir_name}")

            # 创建项目目录
            project_dir = self.projects_root / project_dir_name
            project_dir.mkdir(parents=True, exist_ok=True)

            # 2. 复制招标文件到项目目录下
            target_bid_file = project_dir / original_filename
            shutil.copy2(bid_file_path, target_bid_file)

            # 3. 计算文件MD5并加密
            file_md5 = calculate_file_md5(bid_file_path)
            encryptor = AESEncryption()
            encrypted_md5 = encryptor.encrypt(file_md5)

            # 4. 创建 ZtbAiConfig.Ztbai 配置文件
            current_time = datetime.now().isoformat()
            config_data = {
                "project_name": project_dir_name,
                "bid_file_name": safe_filename,  # 使用安全解码后的文件名
                "original_filename": original_filename,  # 保存原始文件名用于调试
                "created_time": current_time,
                "modified_time": current_time,
                "file_md5_encrypted": encrypted_md5,
                "user_phone": user_phone,
                "service_mode": "standard",
                "status": "active"
            }

            config_file = project_dir / "ZtbAiConfig.Ztbai"
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(config_data, f, indent=2, ensure_ascii=False)

            # 5. 创建 README.md 文档
            readme_content = self._create_readme_content(project_dir_name, original_filename, current_time)
            readme_file = project_dir / "README.md"
            with open(readme_file, 'w', encoding='utf-8') as f:
                f.write(readme_content)

            # 6. 创建日志文档
            log_content = self._create_log_content(project_dir_name, current_time)
            log_file = project_dir / "project_log.md"
            with open(log_file, 'w', encoding='utf-8') as f:
                f.write(log_content)

            # 7. 保存到数据库
            project_id = self._save_to_database(
                project_dir_name, safe_filename, file_md5,
                user_phone, str(project_dir), target_bid_file
            )

            logger.info(f"项目创建成功: {project_id} - {project_dir_name}")

            return {
                "success": True,
                "project_id": str(project_id),
                "project_name": project_dir_name,
                "project_path": str(project_dir),
                "bid_file_name": original_filename,
                "message": "项目创建成功"
            }

        except Exception as e:
            logger.error(f"创建项目失败: {e}", exc_info=True)
            return {
                "success": False,
                "message": f"创建项目失败: {str(e)}"
            }
        finally:
            # 清理临时文件
            if temp_file_path.exists():
                os.remove(temp_file_path)

    def _create_readme_content(self, project_name: str, bid_file_name: str, created_time: str) -> str:
        """创建README.md内容"""
        return f"""# {project_name}

## 项目信息

- **项目名称**: {project_name}
- **招标文件**: {bid_file_name}
- **创建时间**: {created_time}
- **项目状态**: 活跃

## 目录结构

```
{project_name}/
├── {bid_file_name}           # 原始招标文件
├── ZtbAiConfig.Ztbai        # 项目配置文件
├── README.md                # 项目说明文档
├── project_log.md           # 项目日志
└── 生成文件/                # AI生成的文件将保存在此
```

## 使用说明

1. **招标文件分析**: 使用AI智能分析招标文件要求
2. **投标文件生成**: 根据分析结果生成投标文件框架
3. **内容编辑**: 在生成的框架基础上编辑具体内容
4. **格式化输出**: 生成符合要求的最终投标文件

## 注意事项

- 请勿删除或修改配置文件 `ZtbAiConfig.Ztbai`
- 所有操作都会记录在日志文件中
- 建议定期备份项目文件

## 技术支持

如有问题请联系技术支持团队。
"""

    def _create_log_content(self, project_name: str, created_time: str) -> str:
        """创建日志文档内容"""
        return f"""# {project_name} - 项目日志

## 项目创建

- **时间**: {created_time}
- **操作**: 项目初始化
- **状态**: 成功
- **描述**: 项目创建完成，包含招标文件、配置文件和说明文档

---

## 操作记录

*此处将记录项目的所有操作历史*

"""

    def _save_to_database(self, project_name: str, bid_file_name: str, file_md5: str,
                         user_phone: str, project_path: str, bid_file_path: Path) -> int:
        """保存项目信息到数据库"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # 插入项目记录
            cursor.execute('''
                INSERT INTO projects (name, bid_file_name, file_md5, user_phone, project_path, description)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                project_name,
                bid_file_name,
                file_md5,
                user_phone,
                project_path,
                f"基于招标文件 {bid_file_name} 创建的项目"
            ))

            # 获取项目ID
            project_id = cursor.lastrowid

            # 记录招标文件
            cursor.execute('''
                INSERT INTO project_files (project_id, file_name, file_path, file_type, file_size)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                str(project_id),
                bid_file_name,
                str(bid_file_path),
                'bid_file',
                bid_file_path.stat().st_size
            ))

            conn.commit()
            return project_id
    
    def get_project_list(self) -> Dict[str, Any]:
        """
        获取项目列表
        
        Returns:
            项目列表
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, name, bid_file_name, user_phone, service_mode, status, 
                           project_path, description, created_at, updated_at
                    FROM projects
                    ORDER BY created_at DESC
                ''')
                
                rows = cursor.fetchall()
                
                projects = []
                for row in rows:
                    project = {
                        "id": row[0],
                        "name": row[1],
                        "bid_file_name": row[2],
                        "user_phone": row[3],
                        "service_mode": row[4],
                        "status": row[5],
                        "project_path": row[6],
                        "description": row[7],
                        "created_at": row[8],
                        "updated_at": row[9]
                    }
                    projects.append(project)
                
                logger.info(f"获取项目列表成功，共 {len(projects)} 个项目")
                
                return {
                    "success": True,
                    "projects": projects,
                    "total": len(projects),
                    "message": "获取项目列表成功"
                }
                
        except Exception as e:
            logger.error(f"获取项目列表失败: {e}")
            return {
                "success": False,
                "message": f"获取项目列表失败: {str(e)}"
            }
    
    def get_project_details(self, project_id: str) -> Dict[str, Any]:
        """
        获取项目详情
        
        Args:
            project_id: 项目ID
            
        Returns:
            项目详情
        """
        try:
            # 将字符串ID转换为整数
            try:
                project_id_int = int(project_id)
            except ValueError:
                return {
                    "success": False,
                    "message": "无效的项目ID格式",
                    "project": {}
                }

            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, name, bid_file_name, user_phone, service_mode, status,
                           project_path, description, created_at, updated_at
                    FROM projects
                    WHERE id = ?
                ''', (project_id_int,))
                
                row = cursor.fetchone()
                if not row:
                    return {
                        "success": False,
                        "message": "项目不存在"
                    }
                
                project = {
                    "id": row[0],
                    "name": row[1],
                    "bid_file_name": row[2],
                    "user_phone": row[3],
                    "service_mode": row[4],
                    "status": row[5],
                    "project_path": row[6],
                    "description": row[7],
                    "created_at": row[8],
                    "updated_at": row[9]
                }
                
                # 获取项目文件列表
                cursor.execute('''
                    SELECT file_name, file_path, file_type, file_size, created_at
                    FROM project_files
                    WHERE project_id = ?
                    ORDER BY created_at DESC
                ''', (project_id,))
                
                files = []
                for file_row in cursor.fetchall():
                    files.append({
                        "file_name": file_row[0],
                        "file_path": file_row[1],
                        "file_type": file_row[2],
                        "file_size": file_row[3],
                        "created_at": file_row[4]
                    })
                
                project["files"] = files
                
                return {
                    "success": True,
                    "project": project,
                    "message": "获取项目详情成功"
                }
                
        except Exception as e:
            logger.error(f"获取项目详情失败: {e}")
            return {
                "success": False,
                "message": f"获取项目详情失败: {str(e)}"
            }
    
    def update_project(self, project_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        更新项目

        Args:
            project_id: 项目ID
            update_data: 更新数据

        Returns:
            更新结果
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # 构建更新SQL
                update_fields = []
                update_values = []

                # 支持的更新字段
                allowed_fields = ['name', 'description', 'status', 'user_phone', 'service_mode']

                for field in allowed_fields:
                    if field in update_data:
                        update_fields.append(f"{field} = ?")
                        update_values.append(update_data[field])

                if not update_fields:
                    return {
                        "success": False,
                        "message": "没有有效的更新字段"
                    }

                # 添加更新时间
                update_fields.append("updated_at = ?")
                update_values.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

                # 添加项目ID到参数列表
                update_values.append(project_id)

                # 执行更新
                sql = f"UPDATE projects SET {', '.join(update_fields)} WHERE id = ?"
                cursor.execute(sql, update_values)

                if cursor.rowcount == 0:
                    return {
                        "success": False,
                        "message": "项目不存在"
                    }

                # 获取更新后的项目信息
                cursor.execute('''
                    SELECT id, name, bid_file_name, user_phone, service_mode, status,
                           project_path, description, created_at, updated_at
                    FROM projects
                    WHERE id = ?
                ''', (project_id,))

                row = cursor.fetchone()
                if row:
                    project = {
                        "id": row[0],
                        "name": row[1],
                        "bid_file_name": row[2],
                        "user_phone": row[3],
                        "service_mode": row[4],
                        "status": row[5],
                        "project_path": row[6],
                        "description": row[7],
                        "created_at": row[8],
                        "updated_at": row[9]
                    }

                    logger.info(f"更新项目成功: {project_id}")

                    return {
                        "success": True,
                        "message": "更新项目成功",
                        "project": project
                    }
                else:
                    return {
                        "success": False,
                        "message": "获取更新后的项目信息失败"
                    }

        except Exception as e:
            logger.error(f"更新项目失败: {str(e)}")
            return {
                "success": False,
                "message": f"更新项目失败: {str(e)}"
            }

    def delete_project(self, project_id: str) -> Dict[str, Any]:
        """
        删除项目

        Args:
            project_id: 项目ID

        Returns:
            删除结果
        """
        logger.info(f"开始删除项目: {project_id}")

        try:
            # 将字符串ID转换为整数
            try:
                project_id_int = int(project_id)
                logger.debug(f"项目ID转换成功: {project_id} -> {project_id_int}")
            except ValueError:
                error_msg = f"无效的项目ID格式: {project_id}"
                logger.error(error_msg)
                return {
                    "success": False,
                    "message": error_msg
                }

            # 获取项目信息
            logger.debug(f"查询项目信息: {project_id_int}")
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT project_path, name FROM projects WHERE id = ?', (project_id_int,))
                row = cursor.fetchone()

                if not row:
                    error_msg = f"项目不存在: ID={project_id_int}"
                    logger.warning(error_msg)
                    return {
                        "success": False,
                        "message": "项目不存在"
                    }

                project_path, project_name = row
                logger.info(f"找到项目: {project_name} (路径: {project_path})")

                # 可选：创建项目备份（如果配置启用）
                backup_path = None
                try:
                    # 这里可以添加配置检查，决定是否创建备份
                    # 目前默认不创建备份，可以通过配置文件控制
                    create_backup = False  # 可以从配置文件读取

                    if create_backup and project_path and Path(project_path).exists():
                        backup_path = self._create_project_backup(project_path, project_name)
                        if backup_path:
                            logger.info(f"项目备份已创建: {backup_path}")
                        else:
                            logger.warning("项目备份创建失败，继续删除操作")
                except Exception as backup_error:
                    logger.warning(f"备份过程中发生错误，继续删除操作: {str(backup_error)}")

                # 删除项目目录
                directory_deleted = False
                if project_path:
                    project_path_obj = Path(project_path)

                    # 安全检查：确保路径在项目根目录下
                    try:
                        # 解析绝对路径
                        abs_project_path = project_path_obj.resolve()
                        abs_projects_root = self.projects_root.resolve()

                        # 检查是否在项目根目录下
                        if not str(abs_project_path).startswith(str(abs_projects_root)):
                            error_msg = f"安全检查失败：项目路径不在允许的目录范围内: {project_path}"
                            logger.error(error_msg)
                            return {
                                "success": False,
                                "message": "删除失败：项目路径不安全"
                            }
                    except Exception as path_error:
                        error_msg = f"路径解析失败: {project_path} - {str(path_error)}"
                        logger.error(error_msg)
                        return {
                            "success": False,
                            "message": "删除失败：项目路径无效"
                        }

                    if project_path_obj.exists():
                        # 检查是否为目录
                        if not project_path_obj.is_dir():
                            error_msg = f"项目路径不是目录: {project_path}"
                            logger.error(error_msg)
                            return {
                                "success": False,
                                "message": "删除失败：项目路径不是有效目录"
                            }

                        # 检查目录权限
                        try:
                            # 尝试在目录中创建临时文件来测试写权限
                            test_file = project_path_obj / ".delete_test"
                            test_file.touch()
                            test_file.unlink()
                            logger.debug(f"权限检查通过: {project_path}")
                        except PermissionError:
                            error_msg = f"权限检查失败：无法写入项目目录: {project_path}"
                            logger.error(error_msg)
                            return {
                                "success": False,
                                "message": "删除失败：无法访问项目目录，权限不足"
                            }
                        except Exception as perm_error:
                            logger.warning(f"权限检查异常，继续尝试删除: {str(perm_error)}")

                        # 记录目录内容（用于调试）
                        try:
                            dir_contents = list(project_path_obj.iterdir())
                            logger.debug(f"项目目录包含 {len(dir_contents)} 个文件/文件夹")
                        except Exception:
                            logger.debug("无法列出目录内容")

                        # 执行删除
                        try:
                            logger.info(f"开始删除项目目录: {project_path}")
                            shutil.rmtree(project_path)

                            # 验证删除是否成功
                            if project_path_obj.exists():
                                error_msg = f"删除验证失败：目录仍然存在: {project_path}"
                                logger.error(error_msg)
                                return {
                                    "success": False,
                                    "message": "删除失败：目录删除不完整"
                                }

                            directory_deleted = True
                            logger.info(f"项目目录删除成功: {project_path}")

                        except PermissionError as pe:
                            error_msg = f"删除项目目录失败，权限不足: {project_path} - {str(pe)}"
                            logger.error(error_msg)
                            return {
                                "success": False,
                                "message": f"删除失败：无法删除项目目录，权限不足"
                            }
                        except OSError as oe:
                            error_msg = f"删除项目目录失败，系统错误: {project_path} - {str(oe)}"
                            logger.error(error_msg)
                            return {
                                "success": False,
                                "message": f"删除失败：无法删除项目目录，系统错误"
                            }
                        except Exception as de:
                            error_msg = f"删除项目目录失败，未知错误: {project_path} - {str(de)}"
                            logger.error(error_msg)
                            return {
                                "success": False,
                                "message": f"删除失败：无法删除项目目录"
                            }
                    else:
                        logger.warning(f"项目目录不存在，跳过删除: {project_path}")
                else:
                    logger.warning(f"项目路径为空，跳过目录删除")

                # 从数据库删除项目记录
                logger.info(f"开始删除数据库记录: {project_id_int}")
                try:
                    # 删除项目文件记录（project_files.project_id 为 TEXT，使用字符串）
                    cursor.execute('DELETE FROM project_files WHERE project_id = ?', (str(project_id_int),))
                    files_deleted = cursor.rowcount
                    logger.debug(f"删除项目文件记录: {files_deleted} 条")

                    # 删除项目进展记录（使用 INTEGER ID）
                    try:
                        cursor.execute('DELETE FROM project_progress WHERE project_id = ?', (project_id_int,))
                        progress_deleted = cursor.rowcount
                    except sqlite3.Error as se:
                        # 如果表不存在或其他错误，记录警告但不阻塞整体删除
                        logger.warning(f"删除项目进展记录时出现问题（可能表不存在）: {str(se)}")
                        progress_deleted = 0

                    # 删除项目记录
                    cursor.execute('DELETE FROM projects WHERE id = ?', (project_id_int,))
                    projects_deleted = cursor.rowcount

                    if projects_deleted == 0:
                        logger.error(f"数据库中未找到项目记录: {project_id_int}")
                        return {
                            "success": False,
                            "message": "项目记录不存在"
                        }

                    conn.commit()
                    logger.info(f"数据库记录删除成功: 项目记录={projects_deleted}条, 文件记录={files_deleted}条, 进展记录={progress_deleted}条")

                except sqlite3.Error as se:
                    error_msg = f"删除数据库记录失败: {str(se)}"
                    logger.error(error_msg)
                    conn.rollback()
                    return {
                        "success": False,
                        "message": f"删除失败：数据库操作错误"
                    }

                success_msg = f"项目 '{project_name}' 删除成功"
                if directory_deleted:
                    success_msg += f"（包含项目目录）"

                logger.info(f"项目删除完成: {project_id} - {project_name}")

                return {
                    "success": True,
                    "message": success_msg
                }

        except Exception as e:
            error_msg = f"删除项目时发生未知错误: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "message": f"删除项目失败：系统错误"
            }
    
    def _create_project_backup(self, project_path: str, project_name: str) -> Optional[str]:
        """
        创建项目备份（可选功能）

        Args:
            project_path: 项目路径
            project_name: 项目名称

        Returns:
            备份路径，如果失败返回None
        """
        try:
            # 创建备份目录
            backup_root = self.projects_root.parent / "project_backups"
            backup_root.mkdir(exist_ok=True)

            # 生成备份文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"{project_name}_{timestamp}_backup"
            backup_path = backup_root / backup_name

            # 复制项目目录到备份位置
            shutil.copytree(project_path, backup_path)

            logger.info(f"项目备份创建成功: {backup_path}")
            return str(backup_path)

        except Exception as e:
            logger.warning(f"创建项目备份失败: {str(e)}")
            return None

    def get_health_status(self) -> Dict[str, Any]:
        """
        获取服务健康状态
        
        Returns:
            健康状态信息
        """
        try:
            # 检查数据库连接
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT COUNT(*) FROM projects')
                project_count = cursor.fetchone()[0]
            
            # 检查项目根目录
            projects_root_exists = self.projects_root.exists()
            
            return {
                "healthy": True,
                "database_connected": True,
                "projects_root_exists": projects_root_exists,
                "project_count": project_count,
                "projects_root": str(self.projects_root),
                "database_path": str(self.db_path)
            }
            
        except Exception as e:
            logger.error(f"获取健康状态失败: {e}")
            return {
                "healthy": False,
                "error": str(e)
            }

# 全局项目服务实例
project_service = None

def get_project_service() -> ProjectService:
    """获取项目服务实例"""
    global project_service
    if project_service is None:
        project_service = ProjectService()
    return project_service
