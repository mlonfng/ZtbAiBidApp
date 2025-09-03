"""
系统配置管理模块
"""
import json
from pathlib import Path
from typing import Dict, Any, Optional

class ConfigManager:
    def __init__(self):
        self.config_file = Path("app/core/config.json")
        self._config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """加载配置"""
        if self.config_file.exists():
            try:
                return json.loads(self.config_file.read_text(encoding="utf-8"))
            except Exception:
                pass
        return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """获取默认配置"""
        return {
            "database": {
                "url": "sqlite:///ztbai.db",
                "echo": False
            },
            "server": {
                "host": "0.0.0.0",
                "port": 9958
            },
            "ai": {
                "deepseek": {
                    "api_key": "",
                    "base_url": "https://api.deepseek.com/v1",
                    "model": "deepseek-chat"
                }
            }
        }
    
    def get(self, key: str, default: Any = None) -> Any:
        """获取配置值"""
        keys = key.split(".")
        value = self._config
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value

# 全局配置实例
_config_manager = None

def get_config() -> ConfigManager:
    """获取配置管理器"""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigManager()
    return _config_manager
