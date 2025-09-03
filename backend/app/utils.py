"""
Utility functions for the ZtbAi API server.
"""
from pathlib import Path
from typing import Optional

import os
from typing import Dict, Any

def find_bid_file_in_project(project_dir: Path) -> Optional[Path]:
    """在项目目录中查找招标文件"""
    # 支持的文件扩展名
    supported_extensions = ['.pdf', '.docx', '.doc', '.txt']

    # 招标文件关键词
    bid_keywords = ['招标', '投标', '采购', '公告', 'tender', 'bid']

    for file_path in project_dir.rglob('*'):
        if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
            # 检查文件名是否包含招标相关关键词
            filename_lower = file_path.name.lower()
            if any(keyword in filename_lower for keyword in bid_keywords):
                return file_path

    # 如果没找到关键词匹配的文件，返回第一个支持的文件
    for file_path in project_dir.rglob('*'):
        if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
            return file_path

    return None


from datetime import datetime
from app.core.response import create_response, create_error_response

async def save_analysis_results(project_id: str, combined_result):
    """保存分析结果到项目目录（严格使用Agent产物，不做模板覆写）"""
    try:
        print(f"🔄 [API] 开始保存分析结果，项目ID: {project_id}")

        # 统一通过项目ID解析路径，避免环境错位
        
        project_path = get_project_path_by_id(project_id)
        if not project_path:
            print(f"❌ [API] 未找到项目路径，项目ID: {project_id}")
            return create_error_response(f"未找到项目ID {project_id} 的路径，无法保存分析文件")

        project_dir = Path(project_path)
        if not project_dir.exists():
            print(f"❌ [API] 项目目录不存在: {project_path}")
            return create_error_response(f"项目目录不存在: {project_path}")

        # 从combined_result中读取Agent生成的文件路径
        analysis_path = combined_result.get('analysis_path') or combined_result.get('report_path')
        strategy_path = combined_result.get('strategy_path')

        # 校验Agent产物是否存在
        missing = []
        if not analysis_path or not Path(analysis_path).exists():
            missing.append('招标文件分析报告.md')
        if not strategy_path or not Path(strategy_path).exists():
            missing.append('投标文件制作策略.md')

        if missing:
            msg = f"Agent未生成文件或文件不存在: {', '.join(missing)}"
            print(f"❌ [API] {msg}")
            return create_error_response(msg)

        # 不再进行任何模板生成或覆写，直接确认Agent产物
        generation_results = {
            'report': {'success': True, 'path': str(analysis_path)},
            'strategy': {'success': True, 'path': str(strategy_path)}
        }

        # 更新项目配置文件仅登记现有文件
        try:
            print(f"🔄 [API] 开始更新项目配置文件...")
            await update_project_config_file(project_dir, generation_results, combined_result)
            print(f"✅ [API] 项目配置文件已更新")
        except Exception as e:
            print(f"⚠️ [API] 更新项目配置文件失败: {e}")

        print(f"✅ [API] 分析结果已保存到项目目录: {project_path}")
        return create_response(True, "保存分析结果成功", {
            'files_generated': {
                'report': generation_results.get('report', {}),
                'strategy': generation_results.get('strategy', {}),
                'config_updated': True
            },
            'project_path': project_path,
            'generation_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })

    except Exception as e:
        print(f"❌ [API] 保存分析结果失败: {e}")
        return None

import json

async def update_project_config_file(project_dir: Path, generation_results: dict, combined_result: dict):
    """更新项目配置文件（ZtbAiConfig.Ztbai）"""
    try:
        # 从combined_result中提取analysis_result
        analysis_result = combined_result.get("analysis_result", {})

        config_file = project_dir / "ZtbAiConfig.Ztbai"

        # 读取现有配置
        config_data = {}
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    config_content = f.read().strip()
                    if config_content:
                        config_data = json.loads(config_content)
            except (json.JSONDecodeError, Exception) as e:
                print(f"⚠️ [API] 读取现有配置文件失败，将创建新配置: {e}")
                config_data = {}

        # 确保基本结构存在
        if 'analysis_files' not in config_data:
            config_data['analysis_files'] = []
        if 'project_info' not in config_data:
            config_data['project_info'] = {}
        if 'last_updated' not in config_data:
            config_data['last_updated'] = None

        # 添加新的分析文件记录
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # 生成的文件信息
        new_files = []

        print(f"🔍 [API] 检查generation_results: {generation_results}")

        if generation_results.get('report', {}).get('success'):
            report_path = generation_results['report']['path']
            print(f"📄 [API] 找到报告文件: {report_path}")
            new_files.append({
                'file_name': '招标文件分析报告.md',
                'file_path': report_path,
                'file_type': 'analysis_report',
                'generated_time': current_time,
                'file_size': Path(report_path).stat().st_size if Path(report_path).exists() else 0,
                'description': '基于AI分析生成的招标文件分析报告'
            })
        else:
            print(f"⚠️ [API] 报告文件生成失败或不存在: {generation_results.get('report', {})}")

        if generation_results.get('strategy', {}).get('success'):
            strategy_path = generation_results['strategy']['path']
            print(f"📄 [API] 找到策略文件: {strategy_path}")
            new_files.append({
                'file_name': '投标文件制作策略.md',
                'file_path': strategy_path,
                'file_type': 'strategy_document',
                'generated_time': current_time,
                'file_size': Path(strategy_path).stat().st_size if Path(strategy_path).exists() else 0,
                'description': '基于分析结果生成的投标文件制作策略'
            })
        else:
            print(f"⚠️ [API] 策略文件生成失败或不存在: {generation_results.get('strategy', {})}")

        print(f"📋 [API] 准备添加 {len(new_files)} 个文件记录")

        # 添加到配置中（避免重复记录）
        existing_files = {f.get('file_name', '') for f in config_data['analysis_files']}
        for new_file in new_files:
            if new_file['file_name'] not in existing_files:
                config_data['analysis_files'].append(new_file)
                print(f"📄 [API] 添加新文件记录: {new_file['file_name']}")
            else:
                # 更新现有记录
                for i, existing_file in enumerate(config_data['analysis_files']):
                    if existing_file.get('file_name') == new_file['file_name']:
                        config_data['analysis_files'][i] = new_file
                        print(f"🔄 [API] 更新文件记录: {new_file['file_name']}")
                        break

        # 更新项目信息
        if analysis_result and 'basic_info' in analysis_result:
            basic_info = analysis_result['basic_info']
            config_data['project_info'].update({
                'project_name': basic_info.get('project_name', ''),
                'tender_unit': basic_info.get('tender_unit', ''),
                'project_number': basic_info.get('project_number', ''),
                'last_analysis_time': current_time,
                'analysis_type': 'comprehensive'
            })

        # 更新时间戳
        config_data['last_updated'] = current_time

        # 保存配置文件
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2, ensure_ascii=False)

        print(f"✅ [API] 项目配置文件已更新: {config_file}")
        print(f"📄 [API] 新增文件记录: {len(new_files)} 个")

    except Exception as e:
        print(f"❌ [API] 更新项目配置文件失败: {e}")
        import traceback
        traceback.print_exc()
        raise


def get_project_path_by_id(project_id: str) -> Optional[str]:
    """根据项目ID获取项目路径"""
    try:
        print(f"🔍 [PATH_RESOLVER] 根据项目ID获取路径: {project_id}")

        # 连接数据库获取项目信息
        import sqlite3
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ztbai.db")
        print(f"🔍 [PATH_RESOLVER] 数据库路径: {db_path}")

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 查询项目信息
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()

        if project:
            project_path = project['project_path']
            print(f"✅ [PATH_RESOLVER] 从数据库获取到项目路径: {project_path}")
            conn.close()
            return project_path
        else:
            print(f"❌ [PATH_RESOLVER] 数据库中未找到项目ID: {project_id}")
            # 尝试从ZtbBidPro目录查找匹配的项目
            fallback_path = None  # find_project_by_id_fallback(project_id)
            if fallback_path:
                print(f"✅ [PATH_RESOLVER] 从目录查找到项目路径: {fallback_path}")
                conn.close()
                return fallback_path
            conn.close()
            return None

    except Exception as e:
        print(f"❌ [PATH_RESOLVER] 获取项目路径失败: {e}")
        import traceback
        print(f"❌ [PATH_RESOLVER] 错误堆栈: {traceback.format_exc()}")
        return None

def upsert_task_record(project_id: str, step_key: str, task_id: str, status: str, progress: int = 0, payload: Optional[Dict[str, Any]] = None, error: Optional[str] = None):
    try:
        import sqlite3, json
        now = datetime.now().isoformat()
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ztbai.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        # 读取已有
        cursor.execute("SELECT id, started_at FROM tasks WHERE project_id=? AND step_key=? AND task_id=? ORDER BY id DESC LIMIT 1", (project_id, step_key, task_id))
        row = cursor.fetchone()
        started_at = row[1] if row else (now if status == "in_progress" else None)
        completed_at = now if status == "completed" else None
        cancelled_at = now if status == "cancelled" else None
        payload_txt = json.dumps(payload, ensure_ascii=False) if payload else None
        idk = None
        try:
            idk = payload.get("idempotency_key") if payload else None
        except Exception:
            idk = None
        # 插入一条快照记录（保留历史）
        cursor.execute(
            """
            INSERT INTO tasks (task_id, project_id, step_key, status, progress, payload, error, started_at, updated_at, completed_at, cancelled_at, idempotency_key)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (task_id, project_id, step_key, status, int(progress or 0), payload_txt, error, started_at, now, completed_at, cancelled_at, idk)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ 写入任务记录失败: {e}")

def api_log_step_event(step_key: str, project_id: str, event: str,
                        task_id: Optional[str] = None,
                        idempotency_key: Optional[str] = None,
                        status: Optional[str] = None,
                        progress: Optional[int] = None,
                        extra: Optional[Dict[str, Any]] = None) -> None:
    try:
        from core.logging_config import get_api_logger
        api_logger = get_api_logger()
        fields = {
            "event_type": "step_event",
            "step_key": step_key,
            "project_id": project_id,
            "event": event,
        }
        if task_id is not None:
            fields["task_id"] = task_id
        if idempotency_key is not None:
            fields["idempotency_key"] = idempotency_key
        if status is not None:
            fields["status"] = status
        if progress is not None:
            fields["progress"] = progress
        if extra:
            fields.update(extra)
        api_logger.logger.info(f"step_event {step_key} {event}", extra={"extra_fields": fields})
    except Exception:
        pass

async def update_project_progress_internal(project_id: str, step_key: str, step_name: str, status: str, progress: int):
    pass


import json





import json





async def update_project_config_file(project_dir: Path, generation_results: dict, combined_result: dict):
    """更新项目配置文件（ZtbAiConfig.Ztbai）"""
    try:
        # 从combined_result中提取analysis_result
        analysis_result = combined_result.get("analysis_result", {})

        config_file = project_dir / "ZtbAiConfig.Ztbai"

        # 读取现有配置
        config_data = {}
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    config_content = f.read().strip()
                    if config_content:
                        config_data = json.loads(config_content)
            except (json.JSONDecodeError, Exception) as e:
                print(f"⚠️ [API] 读取现有配置文件失败，将创建新配置: {e}")
                config_data = {}

        # 确保基本结构存在
        if 'analysis_files' not in config_data:
            config_data['analysis_files'] = []
        if 'project_info' not in config_data:
            config_data['project_info'] = {}
        if 'last_updated' not in config_data:
            config_data['last_updated'] = None

        # 添加新的分析文件记录
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # 生成的文件信息
        new_files = []

        print(f"🔍 [API] 检查generation_results: {generation_results}")

        if generation_results.get('report', {}).get('success'):
            report_path = generation_results['report']['path']
            print(f"📄 [API] 找到报告文件: {report_path}")
            new_files.append({
                'file_name': '招标文件分析报告.md',
                'file_path': report_path,
                'file_type': 'analysis_report',
                'generated_time': current_time,
                'file_size': Path(report_path).stat().st_size if Path(report_path).exists() else 0,
                'description': '基于AI分析生成的招标文件分析报告'
            })
        else:
            print(f"⚠️ [API] 报告文件生成失败或不存在: {generation_results.get('report', {})}")

        if generation_results.get('strategy', {}).get('success'):
            strategy_path = generation_results['strategy']['path']
            print(f"📄 [API] 找到策略文件: {strategy_path}")
            new_files.append({
                'file_name': '投标文件制作策略.md',
                'file_path': strategy_path,
                'file_type': 'strategy_document',
                'generated_time': current_time,
                'file_size': Path(strategy_path).stat().st_size if Path(strategy_path).exists() else 0,
                'description': '基于分析结果生成的投标文件制作策略'
            })
        else:
            print(f"⚠️ [API] 策略文件生成失败或不存在: {generation_results.get('strategy', {})}")

        print(f"📋 [API] 准备添加 {len(new_files)} 个文件记录")

        # 添加到配置中（避免重复记录）
        existing_files = {f.get('file_name', '') for f in config_data['analysis_files']}
        for new_file in new_files:
            if new_file['file_name'] not in existing_files:
                config_data['analysis_files'].append(new_file)
                print(f"📄 [API] 添加新文件记录: {new_file['file_name']}")
            else:
                # 更新现有记录
                for i, existing_file in enumerate(config_data['analysis_files']):
                    if existing_file.get('file_name') == new_file['file_name']:
                        config_data['analysis_files'][i] = new_file
                        print(f"🔄 [API] 更新文件记录: {new_file['file_name']}")
                        break

        # 更新项目信息
        if analysis_result and 'basic_info' in analysis_result:
            basic_info = analysis_result['basic_info']
            config_data['project_info'].update({
                'project_name': basic_info.get('project_name', ''),
                'tender_unit': basic_info.get('tender_unit', ''),
                'project_number': basic_info.get('project_number', ''),
                'last_analysis_time': current_time,
                'analysis_type': 'comprehensive'
            })

        # 更新时间戳
        config_data['last_updated'] = current_time

        # 保存配置文件
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2, ensure_ascii=False)

        print(f"✅ [API] 项目配置文件已更新: {config_file}")
        print(f"📄 [API] 新增文件记录: {len(new_files)} 个")

    except Exception as e:
        print(f"❌ [API] 更新项目配置文件失败: {e}")
        import traceback
        traceback.print_exc()

def insert_step_result_record(project_id: str, step_key: str, data_obj: Dict[str, Any]):
    try:
        import sqlite3, json
        now = datetime.now().isoformat()
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ztbai.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO step_results (project_id, step_key, result_json, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (project_id, step_key, json.dumps(data_obj, ensure_ascii=False), now)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ 写入步骤结果失败: {e}")

        raise





"""
加密工具类
提供AES-256-GCM加密功能
"""

import base64
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os


class AESEncryption:
    """AES-256-GCM加密工具类"""

    def __init__(self, password: str = "My060322@"):
        """
        初始化加密器

        Args:
            password: 加密密码
        """
        self.password = password.encode('utf-8')

    def _derive_key(self, salt: bytes) -> bytes:
        """
        从密码派生密钥

        Args:
            salt: 盐值

        Returns:
            派生的密钥
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # AES-256需要32字节密钥
            salt=salt,
            iterations=100000,
        )
        return kdf.derive(self.password)

    def encrypt(self, plaintext: str) -> str:
        """
        加密文本

        Args:
            plaintext: 明文

        Returns:
            加密后的base64编码字符串
        """
        try:
            # 生成随机盐值和nonce
            salt = os.urandom(16)
            nonce = os.urandom(12)  # GCM模式推荐12字节nonce

            # 派生密钥
            key = self._derive_key(salt)

            # 创建AESGCM实例
            aesgcm = AESGCM(key)

            # 加密
            ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)

            # 组合：salt + nonce + ciphertext
            encrypted_data = salt + nonce + ciphertext

            # 返回base64编码
            return base64.b64encode(encrypted_data).decode('utf-8')

        except Exception as e:
            raise Exception(f"加密失败: {str(e)}")

    def decrypt(self, encrypted_text: str) -> str:
        """
        解密文本

        Args:
            encrypted_text: 加密的base64编码字符串

        Returns:
            解密后的明文
        """
        try:
            # base64解码
            encrypted_data = base64.b64decode(encrypted_text.encode('utf-8'))

            # 分离组件
            salt = encrypted_data[:16]
            nonce = encrypted_data[16:28]
            ciphertext = encrypted_data[28:]

            # 派生密钥
            key = self._derive_key(salt)

            # 创建AESGCM实例
            aesgcm = AESGCM(key)

            # 解密
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)

            return plaintext.decode('utf-8')

        except Exception as e:
            raise Exception(f"解密失败: {str(e)}")


def calculate_file_md5(file_path: str) -> str:
    """
    计算文件MD5值

    Args:
        file_path: 文件路径

    Returns:
        MD5哈希值
    """
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def sanitize_filename(filename: str) -> str:
    """
    清理文件名，替换特殊字符
    按照用户要求的命名规范：
    原文件：中招润信项目@AAA.pdf
    规范后：中招润信项目_AAA_20250720_122622

    Args:
        filename: 原始文件名

    Returns:
        清理后的文件名
    """
    import re
    from datetime import datetime

    # 移除文件扩展名
    name_without_ext = filename.rsplit('.', 1)[0] if '.' in filename else filename

    # 替换特殊字符为下划线（包括@、空格、特殊符号等）
    # 保留中文字符、英文字母、数字，其他字符替换为下划线
    sanitized = re.sub(r'[\w\u4e00-\u9fff]', '_', name_without_ext)

    # 移除连续的下划线
    sanitized = re.sub(r'_+', '_', sanitized)

    # 移除开头和结尾的下划线
    sanitized = sanitized.strip('_')

    # 如果为空，使用默认名称
    if not sanitized:
        sanitized = "project"

    # 添加时间戳 YYYYMMDD_HHMMSS
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    final_name = f"{sanitized}_{timestamp}"

    return final_name
