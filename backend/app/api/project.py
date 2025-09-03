"""
��ĿAPIģ��
"""
from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Request
from ..core.response import APIResponse
from ..services.project_progress_service import ProjectProgressService
from ..services.project_service import ProjectService
from typing import List, Dict, Any, Optional
import os
import json
from pathlib import Path

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/")
async def get_projects():
    """��ȡ��Ŀ�б�"""
    try:
        # ģ����Ŀ����
        projects = [
            {
                "id": 1,
                "name": "ʾ����Ŀ",
                "status": "active",
                "created_at": "2025-01-01T00:00:00"
            }
        ]
        return APIResponse.success(projects, "��ȡ��Ŀ�б��ɹ�")
    except Exception as e:
        return APIResponse.server_error(f"��ȡ��Ŀ�б�ʧ��: {str(e)}")

@router.get("/status")
async def get_system_status():
    """��ȡϵͳ״̬"""
    try:
        status = {
            "status": "running",
            "version": "1.0.0",
            "modules": {
                "ai_service": "active",
                "validation_service": "active",
                "database": "active"
            }
        }
        return APIResponse.success(status, "ϵͳ״̬����")
    except Exception as e:
        return APIResponse.server_error(f"��ȡϵͳ״̬ʧ��: {str(e)}")

# 项目进展管理API（与主DB对齐）
# 使用与 ProjectService 相同的数据库路径，避免多库不一致
from pathlib import Path as _Path
_progress_db_path = (_Path(__file__).parent.parent.parent / "ztbai.db")
progress_service = ProjectProgressService(db_path=str(_progress_db_path))

@router.get("/{project_id}/progress")
async def get_project_progress(project_id: int):
    """获取项目进展状态"""
    try:
        result = progress_service.get_project_progress(project_id)
        if result["success"]:
            return APIResponse.success(result["data"], "获取项目进展成功")
        else:
            # 数据库或服务内部错误一律按500返回，便于前端区分
            return APIResponse.error(result["message"], code=500)
    except Exception as e:
        return APIResponse.error(f"获取项目进展失败: {str(e)}", code=500)

@router.put("/{project_id}/progress/{step_key}")
async def update_step_progress(project_id: int, step_key: str,
                             status: str = None, progress: int = None,
                             data: Dict[str, Any] = None):
    """更新步骤进展"""
    try:
        result = progress_service.update_step_progress(
            project_id, step_key, status, progress, data
        )
        if result["success"]:
            return APIResponse.success(None, result["message"])
        else:
            return APIResponse.error(result["message"])
    except Exception as e:
        return APIResponse.server_error(f"更新步骤进展失败: {str(e)}")

@router.post("/{project_id}/progress/reset")
async def reset_project_progress(project_id: int):
    """重置项目进展"""
    try:
        result = progress_service.reset_project_progress(project_id)
        if result["success"]:
            return APIResponse.success(None, result["message"])
        else:
            return APIResponse.error(result["message"])
    except Exception as e:
        return APIResponse.server_error(f"重置项目进展失败: {str(e)}")

# 新增：项目配置和文件管理API

def get_project_path_by_id(project_id: str) -> Optional[str]:
    """根据项目ID获取项目路径"""
    try:
        import sqlite3

        # 数据库路径
        db_path = Path(__file__).parent.parent.parent / "ztbai.db"

        with sqlite3.connect(str(db_path)) as conn:
            conn.row_factory = sqlite3.Row  # 启用字典式访问
            cursor = conn.cursor()
            cursor.execute("SELECT project_path FROM projects WHERE id = ?", (project_id,))
            row = cursor.fetchone()

            if row and row['project_path']:
                project_path = row['project_path']
                print(f"✅ [API] 根据项目ID {project_id} 获取到路径: {project_path}")
                return project_path
            else:
                print(f"❌ [API] 项目ID {project_id} 不存在或路径为空，尝试回退查找")
                # 尝试回退查找
                return find_project_by_id_fallback(project_id)

    except Exception as e:
        print(f"❌ [API] 获取项目路径失败: {e}")
        # 尝试回退查找
        return find_project_by_id_fallback(project_id)

def find_project_by_id_fallback(project_id: str) -> Optional[str]:
    """当数据库查找失败时，从目录结构查找项目"""
    try:
        print(f"🔍 [FALLBACK] 尝试从目录查找项目ID: {project_id}")

        # 获取当前脚本目录
        current_dir = Path(__file__).parent.parent.parent

        # 查找ZtbBidPro目录
        ztb_bid_pro_dir = current_dir / "ZtbBidPro"
        if not ztb_bid_pro_dir.exists():
            ztb_bid_pro_dir = current_dir.parent / "ZtbBidPro"

        if ztb_bid_pro_dir.exists():
            print(f"🔍 [FALLBACK] 在ZtbBidPro目录中查找: {ztb_bid_pro_dir}")

            # 遍历所有子目录
            for project_dir in ztb_bid_pro_dir.iterdir():
                if project_dir.is_dir():
                    # 检查目录名是否包含项目ID或匹配模式
                    if (project_id in project_dir.name or
                        project_dir.name.endswith(f"_{project_id}") or
                        project_dir.name.startswith(f"{project_id}_")):
                        print(f"✅ [FALLBACK] 找到匹配的项目目录: {project_dir}")
                        return str(project_dir)

            # 如果没有找到精确匹配，尝试查找最新的项目目录
            project_dirs = [d for d in ztb_bid_pro_dir.iterdir() if d.is_dir()]
            if project_dirs:
                # 按修改时间排序，取最新的
                latest_dir = max(project_dirs, key=lambda x: x.stat().st_mtime)
                print(f"✅ [FALLBACK] 使用最新的项目目录: {latest_dir}")
                return str(latest_dir)

        print(f"❌ [FALLBACK] 未找到项目目录")
        return None

    except Exception as e:
        print(f"❌ [FALLBACK] 目录查找失败: {e}")
        return None

def get_current_project_path() -> Optional[str]:
    """获取当前项目路径（向后兼容）"""
    # 首先尝试从环境变量获取
    project_path = os.environ.get('CURRENT_PROJECT_PATH')
    if project_path:
        return project_path

    # 如果环境变量没有，从环境变量文件读取
    try:
        env_file = Path("current_project_env.json")
        if env_file.exists():
            with open(env_file, 'r', encoding='utf-8') as f:
                env_data = json.load(f)

            current_project = env_data.get('current_project', {})
            project_path = current_project.get('project_path')

            if project_path:
                # 设置环境变量以便后续使用
                os.environ['CURRENT_PROJECT_PATH'] = project_path
                return project_path
    except Exception as e:
        print(f"读取项目环境文件失败: {e}")

    return None

@router.get("/{project_id}/config")
async def get_project_config(project_id: str):
    """获取项目配置信息"""
    try:
        print(f"🔍 [API] 获取项目配置，项目ID: {project_id}")

        # 使用新的基于项目ID的路径获取函数
        project_path = get_project_path_by_id(project_id)
        print(f"🔍 [API] 项目路径: {project_path}")

        if not project_path:
            print(f"❌ [API] 未找到项目ID {project_id} 的路径")
            return APIResponse.error("未找到项目路径")

        config_file = Path(project_path) / "ZtbAiConfig.Ztbai"
        print(f"🔍 [API] 配置文件路径: {config_file}")
        print(f"🔍 [API] 配置文件存在: {config_file.exists()}")

        if not config_file.exists():
            print("❌ [API] 项目配置文件不存在")
            return APIResponse.error("项目配置文件不存在")

        with open(config_file, 'r', encoding='utf-8') as f:
            config_data = json.load(f)

        # 附加项目路径，方便前端打开目录
        config_data['project_path'] = project_path

        print(f"✅ [API] 项目配置加载成功: {config_data.get('project_name', '未知项目')}")
        return APIResponse.success(config_data, "获取项目配置成功")
    except Exception as e:
        print(f"❌ [API] 获取项目配置失败: {str(e)}")
        return APIResponse.server_error(f"获取项目配置失败: {str(e)}")

@router.get("/{project_id}/files")
async def get_project_files(project_id: str):
    """获取项目目录下的文件列表"""
    try:
        print(f"🔍 [API] 获取项目文件列表，项目ID: {project_id}")

        # 使用新的基于项目ID的路径获取函数
        project_path = get_project_path_by_id(project_id)
        if not project_path:
            print(f"❌ [API] 未找到项目ID {project_id} 的路径")
            return APIResponse.error("未找到项目路径")

        project_dir = Path(project_path)
        if not project_dir.exists():
            print(f"❌ [API] 项目目录不存在: {project_dir}")
            return APIResponse.error("项目目录不存在")

        files = []
        for file_path in project_dir.iterdir():
            if file_path.is_file():
                file_info = {
                    "name": file_path.name,
                    "size": file_path.stat().st_size,
                    "modified_time": file_path.stat().st_mtime,
                    "extension": file_path.suffix.lower(),
                    "is_analysis_report": file_path.name in ["招标文件分析报告.md", "投标文件制作策略.md"]
                }
                files.append(file_info)

        print(f"✅ [API] 获取到 {len(files)} 个文件")
        return APIResponse.success(files, "获取文件列表成功")
    except Exception as e:
        print(f"❌ [API] 获取文件列表失败: {e}")
        return APIResponse.server_error(f"获取文件列表失败: {str(e)}")

@router.get("/{project_id}/files/{filename}")
async def get_file_content(project_id: str, filename: str):
    """读取项目目录下的文件内容"""
    try:
        print(f"🔍 [API] 读取文件内容，项目ID: {project_id}, 文件名: {filename}")

        # 使用新的基于项目ID的路径获取函数
        project_path = get_project_path_by_id(project_id)
        if not project_path:
            print(f"❌ [API] 未找到项目ID {project_id} 的路径")
            return APIResponse.error("未找到项目路径")

        file_path = Path(project_path) / filename
        print(f"🔍 [API] 文件完整路径: {file_path}")

        if not file_path.exists():
            print(f"❌ [API] 文件不存在: {file_path}")
            return APIResponse.error("文件不存在")

        # 安全检查：确保文件在项目目录内
        if not str(file_path.resolve()).startswith(str(Path(project_path).resolve())):
            print(f"❌ [API] 文件路径不安全: {file_path}")
            return APIResponse.error("文件路径不安全")

        # 根据文件类型读取内容
        if file_path.suffix.lower() in ['.md', '.txt', '.json']:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                print(f"✅ [API] 成功读取文件内容，大小: {len(content)} 字符")
                return APIResponse.success({
                    "filename": filename,
                    "content": content,
                    "size": len(content),
                    "type": "text"
                }, "读取文件内容成功")
            except UnicodeDecodeError:
                # 尝试其他编码
                with open(file_path, 'r', encoding='gbk') as f:
                    content = f.read()
                print(f"✅ [API] 使用GBK编码成功读取文件内容")
                return APIResponse.success({
                    "filename": filename,
                    "content": content,
                    "size": len(content),
                    "type": "text"
                }, "读取文件内容成功")
        else:
            print(f"❌ [API] 不支持的文件类型: {file_path.suffix}")
            return APIResponse.error("不支持的文件类型")
    except Exception as e:
        print(f"❌ [API] 读取文件内容失败: {e}")
        return APIResponse.server_error(f"读取文件内容失败: {str(e)}")

@router.get("/{project_id}/analysis-status")
async def get_analysis_status(project_id: str):
    """检查分析状态（是否已生成报告文件）"""
    try:
        print(f"🔍 [API] 获取分析状态，项目ID: {project_id}")

        # 使用项目ID获取项目路径
        project_path = get_project_path_by_id(project_id)
        print(f"🔍 [API] 项目路径: {project_path}")

        if not project_path:
            print(f"❌ [API] 未找到项目ID {project_id} 对应的项目路径")
            # 返回默认状态而不是错误，符合前端期望
            return APIResponse.success({
                "analysis_completed": False,
                "has_analysis_report": False,
                "has_strategy_report": False,
                "report_files": []
            }, "项目路径未找到，返回默认状态")

        project_dir = Path(project_path)
        print(f"🔍 [API] 项目目录: {project_dir}")
        print(f"🔍 [API] 项目目录存在: {project_dir.exists()}")

        if not project_dir.exists():
            print("❌ [API] 项目目录不存在")
            # 返回默认状态而不是错误
            return APIResponse.success({
                "analysis_completed": False,
                "has_analysis_report": False,
                "has_strategy_report": False,
                "report_files": []
            }, "项目目录不存在，返回默认状态")

        # 检查分析报告文件是否存在
        analysis_report = project_dir / "招标文件分析报告.md"
        strategy_report = project_dir / "投标文件制作策略.md"

        print(f"🔍 [API] 分析报告文件: {analysis_report}")
        print(f"🔍 [API] 分析报告存在: {analysis_report.exists()}")
        print(f"🔍 [API] 策略报告文件: {strategy_report}")
        print(f"🔍 [API] 策略报告存在: {strategy_report.exists()}")

        status = {
            "has_analysis_report": analysis_report.exists(),
            "has_strategy_report": strategy_report.exists(),
            "analysis_completed": analysis_report.exists() and strategy_report.exists(),
            "report_files": []
        }

        if analysis_report.exists():
            status["report_files"].append({
                "name": "招标文件分析报告.md",
                "size": analysis_report.stat().st_size,
                "modified_time": analysis_report.stat().st_mtime
            })

        if strategy_report.exists():
            status["report_files"].append({
                "name": "投标文件制作策略.md",
                "size": strategy_report.stat().st_size,
                "modified_time": strategy_report.stat().st_mtime
            })

        print(f"✅ [API] 分析状态: {status}")
        return APIResponse.success(status, "获取分析状态成功")
    except Exception as e:
        print(f"❌ [API] 获取分析状态失败: {str(e)}")
        return APIResponse.server_error(f"获取分析状态失败: {str(e)}")


from fastapi import UploadFile, File
from ..services.project_service import ProjectService

# Initialize ProjectService
# This assumes the ProjectService is stateless or that a new instance is acceptable for each call.
# If ProjectService has a state that needs to be shared, it should be initialized in new_api_server.py and injected.
project_service = ProjectService()

def fix_filename_encoding(filename: str) -> str:
    """
    修复文件名编码问题
    尝试多种编码方法来恢复正确的中文文件名
    """
    if not filename:
        return filename
    
    print(f"🔍 [编码修复] 开始修复文件名: {repr(filename)}")
    
    # 检查是否已经是正确的中文
    try:
        # 如果能正常显示中文字符，可能已经是正确的
        if any('\u4e00' <= char <= '\u9fff' for char in filename):
            print(f"✅ [编码修复] 文件名包含中文字符，可能已正确编码")
            return filename
    except:
        pass
    
    # 尝试多种编码修复方法
    encoding_combinations = [
        # (源编码, 目标编码)
        ('latin-1', 'utf-8'),
        ('cp1252', 'utf-8'),
        ('iso-8859-1', 'utf-8'),
        ('latin-1', 'gbk'),
        ('cp1252', 'gbk'),
        ('latin-1', 'gb2312'),
        ('cp1252', 'gb2312'),
    ]
    
    for source_enc, target_enc in encoding_combinations:
        try:
            # 尝试重新编码
            corrected = filename.encode(source_enc).decode(target_enc)
            
            # 检查是否包含中文字符
            if any('\u4e00' <= char <= '\u9fff' for char in corrected):
                print(f"✅ [编码修复] 成功使用 {source_enc}->{target_enc}: {repr(corrected)}")
                return corrected
                
        except (UnicodeDecodeError, UnicodeEncodeError, LookupError):
            continue
    
    # 如果所有方法都失败，尝试使用chardet检测
    try:
        import chardet
        
        # 将字符串转为字节再检测
        filename_bytes = filename.encode('latin-1')
        detected = chardet.detect(filename_bytes)
        
        if detected['encoding'] and detected['confidence'] > 0.7:
            corrected = filename_bytes.decode(detected['encoding'])
            print(f"✅ [chardet修复] 检测到编码 {detected['encoding']} (置信度: {detected['confidence']:.2f}): {repr(corrected)}")
            return corrected
            
    except Exception as e:
        print(f"⚠️ [chardet修复] chardet检测失败: {e}")
    
    print(f"⚠️ [编码修复] 所有修复方法都失败，使用原始文件名")
    return filename

@router.post("/create")
async def create_project(
    file: UploadFile = File(...),
    project_name: str = Form(...),
    user_phone: str = Form("")
):
    """Create a new project by uploading a bid file"""
    try:
        # 处理中文文件名编码问题
        original_filename = file.filename
        print(f"🔍 [FastAPI] 接收到的文件名: {repr(original_filename)}")
        
        # 使用增强的编码修复函数
        if original_filename:
            corrected_filename = fix_filename_encoding(original_filename)
            if corrected_filename != original_filename:
                print(f"✅ [编码修复] 文件名已修复: {repr(original_filename)} -> {repr(corrected_filename)}")
                file.filename = corrected_filename
            else:
                print(f"ℹ️ [编码修复] 文件名无需修复或修复失败: {repr(original_filename)}")
        
        # The ProjectService's create_project method is asynchronous
        result = await project_service.create_project(file, user_phone)
        
        # 如果创建成功，更新项目名称
        if result.get("success") and project_name:
            project_id = result.get("data", {}).get("id")
            if project_id:
                update_result = project_service.update_project_name(project_id, project_name)
                if update_result.get("success"):
                    result["data"]["name"] = project_name

        if result.get("success"):
            return APIResponse.success(result, result.get("message"))
        else:
            # Use a 400 Bad Request for client-side errors like invalid file types
            return APIResponse.error(result.get("message"), code=400)

    except Exception as e:
        # Log the full exception for debugging purposes
        # logger.error(f"Project creation failed: {e}", exc_info=True)
        return APIResponse.server_error(f"An unexpected error occurred: {str(e)}")
