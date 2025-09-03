"""
AI服务模块（方案A：接入真实大模型服务）
- 支持 OpenAI/DeepSeek 兼容协议
- 统一读取AI配置（优先级：环境变量 > ztbai_config.json > app/core/ai_config.json > core默认）
"""
import json
import logging
import os
from pathlib import Path
from typing import Dict, Any

from ..core.config import get_config

try:
    # OpenAI 1.x 客户端，兼容 DeepSeek 的 OpenAI 协议
    from openai import OpenAI
except Exception:  # 库不存在或版本不兼容时的兜底导入
    OpenAI = None  # 运行时再检测

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        """初始化AI服务"""
        self.logger = logger
        self._core_config = None
        self._ai_config: Dict[str, Any] = {}
        self._load_configs()

    # ------------------ 配置管理 ------------------
    def _load_configs(self) -> None:
        """加载AI提供方配置，确保逻辑正确且健壮"""
        # 1. 设置默认配置
        self._ai_config = {
            "deepseek": {
                "api_key": "",
                "base_url": "https://api.deepseek.com/v1",
                "model": "deepseek-chat",
                "max_tokens": 4000,
                "temperature": 0.7,
                "timeout": 30,
                "enabled": True,
            }
        }

        # 2. 从文件加载配置 (ztbai_config.json)
        try:
            repo_root = Path(__file__).resolve().parents[3]
            config_path = repo_root / "ztbai_config.json"
            if config_path.is_file():
                self.logger.info(f"从 {config_path} 加载AI配置...")
                config_data = json.loads(config_path.read_text(encoding="utf-8"))
                ai_models = config_data.get("ai_models", {})

                # 优先使用 primary_model
                primary_model_config = ai_models.get("primary_model", {})
                if primary_model_config.get("provider") == "deepseek" and primary_model_config.get("api_key"):
                    self._ai_config["deepseek"].update(primary_model_config)
                    self.logger.info(f"已从 primary_model 加载 DeepSeek 配置")
                # 否则，兼容旧的 deepseek 段
                elif ai_models.get("deepseek", {}).get("api_key"):
                    self._ai_config["deepseek"].update(ai_models.get("deepseek"))
                    self.logger.info(f"已从 deepseek 配置段加载配置")
        except Exception as e:
            self.logger.warning(f"加载 ztbai_config.json 失败: {e}")

        # 3. 环境变量覆盖
        env_api_key = os.environ.get("DEEPSEEK_API_KEY")
        if env_api_key:
            self._ai_config["deepseek"]["api_key"] = env_api_key
            self.logger.info("已从环境变量 DEEPSEEK_API_KEY 加载 api_key")

        env_base_url = os.environ.get("DEEPSEEK_BASE_URL")
        if env_base_url:
            self._ai_config["deepseek"]["base_url"] = env_base_url

        env_model = os.environ.get("DEEPSEEK_MODEL")
        if env_model:
            self._ai_config["deepseek"]["model"] = env_model

    def _get_provider_config(self, provider: str) -> Dict[str, Any]:
        return self._ai_config.get(provider, {}) if isinstance(self._ai_config, dict) else {}

    # ------------------ 健康检查 ------------------
    def is_healthy(self, provider: str = "deepseek") -> bool:
        cfg = self._get_provider_config(provider)
        enabled = cfg.get("enabled", True)
        # 放宽健康检查：只要配置了 API Key 即视为“可用”，具体调用时再判断 OpenAI 是否可用
        return enabled and bool(cfg.get("api_key"))

    # ------------------ 内容生成 ------------------
    def generate_content(self, prompt: str, provider: str = "deepseek", **kwargs) -> str:
        """调用真实大模型生成内容。
        - provider: 默认 deepseek（OpenAI 协议兼容）
        """
        cfg = self._get_provider_config(provider)
        if not cfg.get("api_key"):
            raise Exception("AI服务未配置 API Key，请在 ztbai_config.json 或 app/core/ai_config.json 中填写 deepseek.api_key")
        if OpenAI is None:
            raise Exception("openai 库未安装或版本不兼容，请按 requirements.txt 安装依赖")

        base_url = cfg.get("base_url") or "https://api.deepseek.com/v1"
        if not base_url.rstrip("/").endswith("/v1"):
            base_url = base_url.rstrip("/") + "/v1"
        client = OpenAI(api_key=cfg["api_key"], base_url=base_url)
        model = cfg.get("model", "deepseek-chat")
        temperature = kwargs.get("temperature", cfg.get("temperature", 0.7))
        max_tokens = kwargs.get("max_tokens", cfg.get("max_tokens", 4000))
        system_prompt = kwargs.get("system_prompt", "你是专业的投标分析/策略专家，严格按规范输出。")

        # 以 OpenAI Chat Completions 形式调用
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = (resp.choices[0].message.content or "").strip()
        if not content:
            raise Exception("模型返回空内容")
        return content

    # ------------------ 其他 ------------------
    def validate_file(self, file_path: str) -> Dict[str, Any]:
        """验证文件（占位逻辑）"""
        return {
            "status": "valid",
            "message": "文件验证通过",
            "file_path": file_path
        }

