"""
模块管理器
负责管理所有功能模块的生命周期、状态和交互
"""

import tkinter as tk
from tkinter import ttk
from typing import Dict, List, Optional, Callable, Any
import logging
from pathlib import Path


class ModuleManager:
    """模块管理器"""
    
    def __init__(self, parent_notebook: ttk.Notebook, api_client, 
                 status_callback: Optional[Callable] = None,
                 result_callback: Optional[Callable] = None,
                 config_manager=None):
        """
        初始化模块管理器
        
        Args:
            parent_notebook: 父级Notebook组件
            api_client: API客户端实例
            status_callback: 状态更新回调函数
            result_callback: 结果显示回调函数
            config_manager: 配置管理器
        """
        self.notebook = parent_notebook
        self.api_client = api_client
        self.status_callback = status_callback
        self.result_callback = result_callback
        self.config_manager = config_manager
        
        # 模块存储
        self.modules: Dict[str, Any] = {}
        self.module_registry: List[tuple] = []
        self.current_module: Optional[str] = None
        
        # 状态管理
        self.is_initialized = False
        self.logger = logging.getLogger(__name__)
        
        # 事件回调
        self.event_callbacks = {
            'module_loaded': [],
            'module_shown': [],
            'module_hidden': [],
            'module_error': []
        }
    
    def register_modules(self, module_registry: List[tuple]):
        """
        注册模块
        
        Args:
            module_registry: 模块注册表 [(name, class, description), ...]
        """
        self.module_registry = module_registry
        self.logger.info(f"注册了 {len(module_registry)} 个模块")
    
    def initialize_modules(self):
        """初始化所有模块"""
        if self.is_initialized:
            return
        
        try:
            for name, module_class, description in self.module_registry:
                try:
                    # 创建模块实例
                    module = module_class(
                        parent_notebook=self.notebook,
                        api_client=self.api_client,
                        status_callback=self.status_callback,
                        result_callback=self.result_callback,
                        config_manager=self.config_manager
                    )
                    
                    self.modules[name] = module
                    self.logger.info(f"模块 {name} 初始化成功")
                    
                    # 触发模块加载事件
                    self._trigger_event('module_loaded', name, module)
                    
                except Exception as e:
                    self.logger.error(f"模块 {name} 初始化失败: {str(e)}")
                    self._trigger_event('module_error', name, str(e))
            
            self.is_initialized = True
            self.logger.info("所有模块初始化完成")
            
        except Exception as e:
            self.logger.error(f"模块初始化过程中发生错误: {str(e)}")
            raise
    
    def show_module(self, module_name: str):
        """显示指定模块"""
        if not self.is_initialized:
            self.initialize_modules()
        
        if module_name not in self.modules:
            self.logger.error(f"模块 {module_name} 不存在")
            return False
        
        try:
            # 隐藏当前模块
            if self.current_module and self.current_module != module_name:
                self.hide_module(self.current_module)
            
            # 显示新模块
            module = self.modules[module_name]
            module.show()
            
            self.current_module = module_name
            self.logger.info(f"显示模块: {module_name}")
            
            # 触发模块显示事件
            self._trigger_event('module_shown', module_name, module)
            
            return True
            
        except Exception as e:
            self.logger.error(f"显示模块 {module_name} 时发生错误: {str(e)}")
            self._trigger_event('module_error', module_name, str(e))
            return False
    
    def hide_module(self, module_name: str):
        """隐藏指定模块"""
        if module_name not in self.modules:
            return False
        
        try:
            module = self.modules[module_name]
            module.hide()
            
            if self.current_module == module_name:
                self.current_module = None
            
            self.logger.info(f"隐藏模块: {module_name}")
            
            # 触发模块隐藏事件
            self._trigger_event('module_hidden', module_name, module)
            
            return True
            
        except Exception as e:
            self.logger.error(f"隐藏模块 {module_name} 时发生错误: {str(e)}")
            return False
    
    def refresh_module(self, module_name: str):
        """刷新指定模块"""
        if module_name not in self.modules:
            return False
        
        try:
            module = self.modules[module_name]
            module.refresh()
            
            self.logger.info(f"刷新模块: {module_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"刷新模块 {module_name} 时发生错误: {str(e)}")
            return False
    
    def get_module(self, module_name: str):
        """获取模块实例"""
        return self.modules.get(module_name)
    
    def get_current_module(self):
        """获取当前显示的模块"""
        if self.current_module:
            return self.modules.get(self.current_module)
        return None
    
    def get_module_list(self) -> List[str]:
        """获取所有模块名称列表"""
        return list(self.modules.keys())
    
    def get_module_info(self, module_name: str) -> Optional[Dict[str, Any]]:
        """获取模块信息"""
        module = self.modules.get(module_name)
        if module:
            return module.get_module_info()
        return None
    
    def get_all_modules_info(self) -> Dict[str, Dict[str, Any]]:
        """获取所有模块信息"""
        info = {}
        for name, module in self.modules.items():
            info[name] = module.get_module_info()
        return info
    
    def get_module_status(self, module_name: str) -> Optional[Dict[str, Any]]:
        """获取模块状态"""
        module = self.modules.get(module_name)
        if module:
            return module.get_module_status()
        return None
    
    def get_all_modules_status(self) -> Dict[str, Dict[str, Any]]:
        """获取所有模块状态"""
        status = {}
        for name, module in self.modules.items():
            status[name] = module.get_module_status()
        return status
    
    def cleanup_module(self, module_name: str):
        """清理指定模块"""
        if module_name not in self.modules:
            return False
        
        try:
            module = self.modules[module_name]
            module.cleanup()
            
            self.logger.info(f"清理模块: {module_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"清理模块 {module_name} 时发生错误: {str(e)}")
            return False
    
    def cleanup_all_modules(self):
        """清理所有模块"""
        for module_name in list(self.modules.keys()):
            self.cleanup_module(module_name)
        
        self.modules.clear()
        self.current_module = None
        self.is_initialized = False
        
        self.logger.info("所有模块已清理")
    
    def bind_event(self, event_name: str, callback: Callable):
        """绑定事件回调"""
        if event_name in self.event_callbacks:
            self.event_callbacks[event_name].append(callback)
    
    def _trigger_event(self, event_name: str, *args, **kwargs):
        """触发事件"""
        if event_name in self.event_callbacks:
            for callback in self.event_callbacks[event_name]:
                try:
                    callback(*args, **kwargs)
                except Exception as e:
                    self.logger.error(f"事件回调错误: {str(e)}")
    
    def get_manager_status(self) -> Dict[str, Any]:
        """获取管理器状态"""
        return {
            "initialized": self.is_initialized,
            "current_module": self.current_module,
            "total_modules": len(self.modules),
            "registered_modules": len(self.module_registry),
            "initialized_modules": sum(1 for m in self.modules.values() if m.is_initialized),
            "visible_modules": sum(1 for m in self.modules.values() if m.is_visible)
        }
    
    def export_modules_config(self, file_path: str):
        """导出模块配置"""
        try:
            config_data = {}
            for name, module in self.modules.items():
                config_data[name] = {
                    "info": module.get_module_info(),
                    "status": module.get_module_status(),
                    "data": module.module_data
                }
            
            import json
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(config_data, f, indent=2, ensure_ascii=False, default=str)
            
            self.logger.info(f"模块配置已导出到: {file_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"导出模块配置失败: {str(e)}")
            return False
    
    def import_modules_config(self, file_path: str):
        """导入模块配置"""
        try:
            import json
            with open(file_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            
            for name, config in config_data.items():
                if name in self.modules:
                    module = self.modules[name]
                    if 'data' in config:
                        module.module_data.update(config['data'])
            
            self.logger.info(f"模块配置已从 {file_path} 导入")
            return True
            
        except Exception as e:
            self.logger.error(f"导入模块配置失败: {str(e)}")
            return False
