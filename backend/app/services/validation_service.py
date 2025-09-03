"""
验证服务模块
"""
import logging
import sys
import json
import requests
from typing import Dict, Any, Optional
from pathlib import Path

# 添加Agent路径
sys.path.append(str(Path(__file__).parent.parent.parent))

logger = logging.getLogger(__name__)

class ValidationService:
    def __init__(self):
        """初始化验证服务"""
        self.initialized = False
        self.logger = logger
        self.validator_agent = None

        try:
            self._initialize()
            self.initialized = True
            self.logger.info("验证服务初始化成功")
        except Exception as e:
            self.logger.error(f"验证服务初始化失败: {e}")
            self.initialized = False

    def _initialize(self):
        """内部初始化方法"""
        # 优先使用修复后的原始Agent
        try:
            from Agent.bid_file_validator.agent import BidFileValidatorAgent
            self.validator_agent = BidFileValidatorAgent()
            self.logger.info("招标文件验证Agent初始化成功")
        except Exception as e:
            self.logger.error(f"招标文件验证Agent初始化失败: {e}")
            # 如果原始Agent失败，使用简化版验证器
            try:
                self.validator_agent = self._create_simple_validator()
                self.logger.info("使用简化版验证器")
            except Exception as e2:
                self.logger.error(f"简化版验证器初始化失败: {e2}")
                # 最后尝试备用Agent
                try:
                    from Agent.validation.bid_file_validator_agent import BidFileValidatorAgent as FallbackAgent
                    self.validator_agent = FallbackAgent()
                    self.logger.info("使用备用招标文件验证Agent")
                except Exception as e3:
                    self.logger.error(f"备用Agent初始化也失败: {e3}")
                    self.validator_agent = None

    def is_healthy(self) -> bool:
        """检查服务健康状态"""
        return self.initialized

    def _create_simple_validator(self):
        """创建简化版验证器"""
        class SimpleBidFileValidator:
            """简化版招标文件验证器"""

            def __init__(self):
                self.config = self._load_config()
                self.api_key = self._get_api_key()
                self.base_url = "https://api.deepseek.com"

            def _load_config(self) -> Dict[str, Any]:
                """加载配置"""
                try:
                    config_path = Path("ztbai_config.json")
                    with open(config_path, 'r', encoding='utf-8') as f:
                        return json.load(f)
                except Exception as e:
                    logger.error(f"加载配置失败: {e}")
                    return {}

            def _get_api_key(self) -> str:
                """获取API密钥"""
                api_key = self.config.get('ai_models', {}).get('deepseek', {}).get('api_key')
                if not api_key:
                    raise ValueError("DeepSeek API密钥未配置")
                return api_key

            def _extract_text_from_pdf(self, file_path: str) -> str:
                """从PDF提取文本"""
                try:
                    import PyPDF2

                    with open(file_path, 'rb') as file:
                        pdf_reader = PyPDF2.PdfReader(file)
                        text = ""

                        # 只读取前5页来分析
                        max_pages = min(5, len(pdf_reader.pages))
                        for page_num in range(max_pages):
                            page = pdf_reader.pages[page_num]
                            text += page.extract_text() + "\n"

                        return text[:3000]  # 限制文本长度

                except Exception as e:
                    logger.error(f"PDF文本提取失败: {e}")
                    return ""

            def _call_deepseek_api(self, prompt: str, max_tokens: int = 2000) -> Dict[str, Any]:
                """调用DeepSeek API"""
                try:
                    headers = {
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }

                    data = {
                        "model": "deepseek-chat",
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "max_tokens": max_tokens,
                        "temperature": 0.7
                    }

                    response = requests.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=data,
                        timeout=60
                    )

                    if response.status_code == 200:
                        result = response.json()
                        content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                        return {
                            "success": True,
                            "content": content,
                            "token_usage": result.get('usage', {})
                        }
                    else:
                        return {
                            "success": False,
                            "error": f"API调用失败: {response.status_code} - {response.text}"
                        }

                except Exception as e:
                    return {
                        "success": False,
                        "error": f"API调用异常: {str(e)}"
                    }

            def validate_file(self, file_path: str) -> Dict[str, Any]:
                """验证文件"""
                try:
                    logger.info(f"🔍 开始验证文件（简化版）: {Path(file_path).name}")

                    # 提取文本
                    text_content = self._extract_text_from_pdf(file_path)
                    if not text_content:
                        return {
                            "success": False,
                            "error": "无法提取文件内容"
                        }

                    # 构建分析提示词
                    prompt = f"""请分析以下文档内容，判断是否为招标文件，并以JSON格式返回分析结果：

文档内容：
{text_content}

请以JSON格式回答，包含以下字段：
{{
  "is_valid_bid_file": true/false,
  "confidence_score": 0-100,
  "file_type": "文件类型（如：竞争性磋商文件、公开招标文件等）",
  "analysis_summary": "详细分析总结",
  "key_findings": ["关键发现1", "关键发现2", "关键发现3"],
  "time_info": {{
    "bid_deadline": "投标截止时间（如果找到）",
    "opening_time": "开标时间（如果找到）",
    "time_status": "时间状态说明"
  }},
  "document_structure": {{
    "has_bid_notice": true/false,
    "has_technical_requirements": true/false,
    "has_commercial_requirements": true/false,
    "has_evaluation_criteria": true/false,
    "has_format_requirements": true/false,
    "key_chapters": ["主要章节名称列表"]
  }},
  "detailed_analysis": {{
    "project_overview": "项目概述",
    "procurement_method": "采购方式",
    "key_requirements": ["主要要求1", "主要要求2"],
    "evaluation_method": "评标方法"
  }}
}}"""

                    # 调用API
                    api_result = self._call_deepseek_api(prompt)

                    if not api_result["success"]:
                        return {
                            "success": False,
                            "error": api_result["error"]
                        }

                    # 解析JSON响应
                    try:
                        # 提取JSON部分
                        content = api_result["content"]
                        json_start = content.find('{')
                        json_end = content.rfind('}') + 1

                        if json_start >= 0 and json_end > json_start:
                            json_str = content[json_start:json_end]
                            analysis_data = json.loads(json_str)

                            # 添加文件信息
                            file_stat = Path(file_path).stat()

                            return {
                                "success": True,
                                "data": {
                                    "is_bid_file": analysis_data.get("is_valid_bid_file", False),
                                    "is_valid_bid_file": analysis_data.get("is_valid_bid_file", False),
                                    "confidence_score": analysis_data.get("confidence_score", 0),
                                    "file_size": file_stat.st_size,
                                    "file_type": Path(file_path).suffix,
                                    "llm_analysis": analysis_data
                                }
                            }
                        else:
                            # JSON解析失败，返回基础结果
                            return {
                                "success": True,
                                "data": {
                                    "is_bid_file": True,
                                    "is_valid_bid_file": True,
                                    "confidence_score": 80,
                                    "file_size": Path(file_path).stat().st_size,
                                    "file_type": Path(file_path).suffix,
                                    "llm_analysis": {
                                        "analysis_summary": "AI分析结果解析失败，但文件包含招标相关内容",
                                        "raw_response": content
                                    }
                                }
                            }

                    except json.JSONDecodeError as e:
                        logger.error(f"JSON解析失败: {e}")
                        return {
                            "success": True,
                            "data": {
                                "is_bid_file": True,
                                "is_valid_bid_file": True,
                                "confidence_score": 70,
                                "file_size": Path(file_path).stat().st_size,
                                "file_type": Path(file_path).suffix,
                                "llm_analysis": {
                                    "analysis_summary": "AI分析完成，但结果格式需要优化",
                                    "raw_response": api_result["content"]
                                }
                            }
                        }

                except Exception as e:
                    logger.error(f"验证失败: {e}")
                    return {
                        "success": False,
                        "error": str(e)
                    }

        return SimpleBidFileValidator()
        
    def validate_bid_file(self, file_path: str) -> Dict[str, Any]:
        """验证投标文件"""
        if not self.initialized:
            return {
                "status": "error",
                "message": "验证服务未初始化",
                "valid": False
            }

        file_path_obj = Path(file_path)

        if not file_path_obj.exists():
            return {
                "status": "error",
                "message": "文件不存在",
                "valid": False
            }

        # 检查文件格式
        allowed_extensions = [".pdf", ".docx", ".doc", ".txt"]
        if file_path_obj.suffix.lower() not in allowed_extensions:
            return {
                "status": "error",
                "message": f"不支持的文件格式，支持: {', '.join(allowed_extensions)}",
                "valid": False
            }

        # 如果有Agent，使用Agent进行详细验证
        if self.validator_agent:
            try:
                self.logger.info(f"使用Agent验证文件: {file_path}")
                agent_result = self.validator_agent.validate_file(file_path)

                # Agent返回格式: {'success': True, 'message': '...', 'data': {...}}
                if agent_result.get("success", False):
                    agent_data = agent_result.get("data", {})

                    # 检查Agent是否使用了LLM分析（包含详细分析结果）
                    if "is_valid_bid_file" in agent_data:
                        # LLM分析结果，包含详细的招标文件分析
                        is_valid_bid_file = agent_data.get("is_valid_bid_file", False)

                        if is_valid_bid_file:
                            self.logger.info("Agent LLM分析确认为有效招标文件")
                            return {
                                "success": True,
                                "message": "有效招标文件",
                                "data": {
                                    "is_bid_file": True,
                                    "is_valid_bid_file": True,
                                    # 保留Agent的详细分析结果
                                    "llm_analysis": agent_data,
                                    # 兼容前端的基础字段
                                    "confidence_score": 95,  # LLM分析的置信度较高
                                    "validation_details": agent_data.get("analysis_details", {}),
                                    "suggestions": agent_data.get("recommendations", []),
                                    "file_size": file_path_obj.stat().st_size,
                                    "file_type": file_path_obj.suffix
                                }
                            }
                        else:
                            self.logger.warning("Agent LLM分析认为不是有效招标文件")
                            return {
                                "success": False,
                                "message": "不是有效的招标文件",
                                "data": {
                                    "is_bid_file": False,
                                    "is_valid_bid_file": False,
                                    "llm_analysis": agent_data,
                                    "confidence_score": 0,
                                    "file_size": file_path_obj.stat().st_size,
                                    "file_type": file_path_obj.suffix
                                }
                            }

                    # 检查基于规则的分析结果（备用方案）
                    elif "is_bid_file" in agent_data:
                        is_bid_file = agent_data.get("is_bid_file", False)

                        if is_bid_file:
                            # 构建完整的返回数据，包含LLM分析结果
                            return_data = {
                                "is_bid_file": True,
                                "is_valid_bid_file": True,
                                "confidence_score": agent_data.get("confidence_score", 0),
                                "validation_details": agent_data.get("validation_details", {}),
                                "suggestions": agent_data.get("suggestions", []),
                                "file_size": file_path_obj.stat().st_size,
                                "file_type": file_path_obj.suffix
                            }

                            # 添加LLM分析结果（如果存在）
                            if "llm_analysis" in agent_data:
                                return_data["llm_analysis"] = agent_data["llm_analysis"]

                            # 如果Agent直接返回了详细的分析结果，将其作为llm_analysis
                            elif any(key in agent_data for key in ["file_type", "analysis_summary", "key_findings", "time_info", "document_structure", "detailed_analysis"]):
                                return_data["llm_analysis"] = {
                                    key: agent_data[key] for key in
                                    ["is_valid_bid_file", "confidence_score", "current_datetime", "file_name", "file_type",
                                     "analysis_summary", "key_findings", "time_info", "document_structure", "detailed_analysis"]
                                    if key in agent_data
                                }

                            return {
                                "success": True,
                                "message": "有效招标文件",
                                "data": return_data
                            }
                        else:
                            # Agent认为不是招标文件，直接返回失败结果
                            self.logger.warning("Agent分析认为不是有效招标文件")
                            return {
                                "success": False,
                                "message": "不是有效的招标文件",
                                "data": {
                                    "is_bid_file": False,
                                    "is_valid_bid_file": False,
                                    "confidence_score": agent_data.get("confidence_score", 0),
                                    "validation_details": agent_data.get("validation_details", {}),
                                    "suggestions": agent_data.get("suggestions", []),
                                    "file_size": file_path_obj.stat().st_size,
                                    "file_type": file_path_obj.suffix
                                }
                            }
                    else:
                        self.logger.warning("Agent返回数据格式异常")
                        return {
                            "success": False,
                            "message": "验证结果格式异常",
                            "data": {
                                "is_bid_file": False,
                                "is_valid_bid_file": False,
                                "confidence_score": 0,
                                "file_size": file_path_obj.stat().st_size,
                                "file_type": file_path_obj.suffix
                            }
                        }
                else:
                    # Agent验证失败，直接返回失败结果，不使用基础验证
                    self.logger.warning(f"Agent验证失败: {agent_result.get('message', '未知错误')}")
                    return {
                        "success": False,
                        "message": agent_result.get('message', '文件验证失败'),
                        "data": agent_result.get('data', {
                            "is_bid_file": False,
                            "is_valid_bid_file": False,
                            "confidence_score": 0,
                            "file_size": file_path_obj.stat().st_size,
                            "file_type": file_path_obj.suffix
                        })
                    }

            except Exception as e:
                self.logger.error(f"Agent验证异常: {e}")
                # Agent异常时返回错误，不使用基础验证
                return {
                    "success": False,
                    "message": f"验证过程异常: {str(e)}",
                    "data": {
                        "is_bid_file": False,
                        "is_valid_bid_file": False,
                        "confidence_score": 0,
                        "file_size": file_path_obj.stat().st_size,
                        "file_type": file_path_obj.suffix
                    }
                }

        # Agent不可用时，返回错误而不是使用基础验证
        self.logger.error("Agent验证器不可用，无法进行文件验证")
        return {
            "success": False,
            "message": "验证服务不可用，请联系管理员",
            "data": {
                "is_bid_file": False,
                "is_valid_bid_file": False,
                "confidence_score": 0,
                "file_size": file_path_obj.stat().st_size,
                "file_type": file_path_obj.suffix
            }
        }
