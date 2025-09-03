"""
基础模块类
所有功能模块都继承自这个基类，确保接口一致性和功能完整性
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import threading
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Callable, List, Tuple
from pathlib import Path


class BaseModule(ABC):
    """功能模块基类"""
    
    # 模块版本
    __version__ = "1.0.0"
    
    def __init__(self, parent_notebook: ttk.Notebook, api_client, 
                 status_callback: Optional[Callable] = None,
                 result_callback: Optional[Callable] = None,
                 config_manager=None):
        """
        初始化基础模块
        
        Args:
            parent_notebook: 父级Notebook组件
            api_client: API客户端实例
            status_callback: 状态更新回调函数
            result_callback: 结果显示回调函数
            config_manager: 配置管理器
        """
        self.notebook = parent_notebook
        self.api_client = api_client
        self.status_callback = status_callback or self._default_status_callback
        self.result_callback = result_callback or self._default_result_callback
        self.config_manager = config_manager
        
        # 模块信息
        self.module_name = self.get_module_name()
        self.module_version = self.__version__
        self.module_description = self.get_module_description()
        self.module_icon = self.get_module_icon()
        
        # UI组件
        self.main_frame = None
        self.is_initialized = False
        self.is_visible = False
        
        # 模块状态
        self.module_data = {}
        self.ui_components = {}
        
        # 事件回调
        self.event_callbacks = {}
        
    @abstractmethod
    def get_module_name(self) -> str:
        """获取模块名称"""
        pass
    
    @abstractmethod
    def get_module_description(self) -> str:
        """获取模块描述"""
        pass
    
    def get_module_icon(self) -> str:
        """获取模块图标（可选）"""
        return "📋"
    
    @abstractmethod
    def create_ui(self) -> ttk.Frame:
        """创建模块UI界面"""
        pass
    
    def show(self):
        """显示模块"""
        try:
            # 清除现有标签页
            for tab_id in self.notebook.tabs():
                self.notebook.forget(tab_id)
            
            # 创建或显示模块UI
            if not self.is_initialized:
                self.main_frame = self.create_ui()
                self.is_initialized = True
                self.on_initialize()
            
            # 添加到notebook
            tab_text = f"{self.module_icon} {self.module_name}"
            self.notebook.add(self.main_frame, text=tab_text)
            
            # 选中当前标签页
            self.notebook.select(self.main_frame)
            
            self.is_visible = True
            
            # 模块显示后的回调
            self.on_show()
            
        except Exception as e:
            self.show_error("模块加载错误", f"加载{self.module_name}模块时发生错误: {str(e)}")
    
    def hide(self):
        """隐藏模块"""
        if self.main_frame:
            try:
                self.notebook.forget(self.main_frame)
            except:
                pass
        
        self.is_visible = False
        self.on_hide()
    
    def refresh(self):
        """刷新模块"""
        if self.is_visible:
            self.on_refresh()
    
    def on_initialize(self):
        """模块初始化时的回调，子类可重写"""
        self.update_status(f"{self.module_name}模块初始化完成")
    
    def on_show(self):
        """模块显示时的回调，子类可重写"""
        self.update_status(f"{self.module_name}模块已激活")
    
    def on_hide(self):
        """模块隐藏时的回调，子类可重写"""
        pass
    
    def on_refresh(self):
        """模块刷新时的回调，子类可重写"""
        self.update_status(f"{self.module_name}模块已刷新")
    
    def update_status(self, message: str, level: str = "INFO"):
        """更新状态信息"""
        self.status_callback(f"[{self.module_name}] {message}", level)
    
    def show_result(self, message: str, level: str = "INFO"):
        """显示结果信息"""
        self.result_callback(f"[{self.module_name}] {message}", level)
    
    def _default_status_callback(self, message: str, level: str = "INFO"):
        """默认状态回调"""
        print(f"[{level}] {message}")
    
    def _default_result_callback(self, message: str, level: str = "INFO"):
        """默认结果回调"""
        print(f"[{level}] {message}")
    
    # API请求方法
    def make_api_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """发起API请求"""
        return self.api_client.request(method, endpoint, **kwargs)
    
    def async_api_request(self, method: str, endpoint: str, 
                         success_callback: Optional[Callable] = None,
                         error_callback: Optional[Callable] = None,
                         **kwargs):
        """异步API请求"""
        def make_request():
            try:
                result = self.make_api_request(method, endpoint, **kwargs)
                if result.get("success"):
                    if success_callback:
                        success_callback(result)
                else:
                    if error_callback:
                        error_callback(result)
                    else:
                        self.show_result(f"请求失败: {result.get('message')}", "ERROR")
            except Exception as e:
                error_msg = f"异步请求异常: {str(e)}"
                if error_callback:
                    error_callback({"success": False, "message": error_msg})
                else:
                    self.show_result(error_msg, "ERROR")
        
        threading.Thread(target=make_request, daemon=True).start()
    
    # UI辅助方法
    def create_labeled_entry(self, parent, label_text: str, row: int, 
                           column: int = 0, width: int = 30, 
                           show: str = None, sticky: str = None) -> ttk.Entry:
        """创建带标签的输入框"""
        ttk.Label(parent, text=label_text).grid(
            row=row, column=column, sticky=tk.W, padx=5, pady=2
        )
        entry = ttk.Entry(parent, width=width, show=show)
        entry.grid(row=row, column=column+1, 
                  sticky=sticky or (tk.W, tk.E), padx=5, pady=2)
        return entry
    
    def create_labeled_combobox(self, parent, label_text: str, values: list,
                              row: int, column: int = 0, width: int = 30) -> ttk.Combobox:
        """创建带标签的下拉框"""
        ttk.Label(parent, text=label_text).grid(
            row=row, column=column, sticky=tk.W, padx=5, pady=2
        )
        combobox = ttk.Combobox(parent, values=values, width=width-3, state="readonly")
        combobox.grid(row=row, column=column+1, sticky=(tk.W, tk.E), padx=5, pady=2)
        return combobox
    
    def create_labeled_text(self, parent, label_text: str, height: int = 10,
                          width: int = 50) -> Tuple[ttk.Label, tk.Text, ttk.Scrollbar]:
        """创建带标签的文本框"""
        label = ttk.Label(parent, text=label_text)
        
        text_frame = ttk.Frame(parent)
        text_widget = tk.Text(text_frame, height=height, width=width, wrap=tk.WORD)
        scrollbar = ttk.Scrollbar(text_frame, orient="vertical", command=text_widget.yview)
        text_widget.configure(yscrollcommand=scrollbar.set)
        
        text_widget.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        return label, text_widget, scrollbar
    
    def create_button_frame(self, parent, buttons: List[Tuple[str, Callable]], 
                          pack_side: str = tk.LEFT) -> ttk.Frame:
        """创建按钮框架"""
        button_frame = ttk.Frame(parent)
        
        for text, command in buttons:
            btn = ttk.Button(button_frame, text=text, command=command)
            btn.pack(side=pack_side, padx=5, pady=2)
        
        return button_frame
    
    def create_progress_bar(self, parent, mode: str = "determinate") -> ttk.Progressbar:
        """创建进度条"""
        progress = ttk.Progressbar(parent, mode=mode)
        return progress
    
    def create_treeview(self, parent, columns: List[str], 
                       headings: List[str] = None) -> Tuple[ttk.Treeview, ttk.Scrollbar]:
        """创建树形视图"""
        tree_frame = ttk.Frame(parent)
        
        tree = ttk.Treeview(tree_frame, columns=columns, show="tree headings")
        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=scrollbar.set)
        
        # 设置列标题
        if headings:
            for i, heading in enumerate(headings):
                if i == 0:
                    tree.heading("#0", text=heading)
                else:
                    tree.heading(columns[i-1], text=heading)
        
        tree.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        return tree, scrollbar
    
    # 对话框方法
    def show_info(self, title: str, message: str):
        """显示信息对话框"""
        messagebox.showinfo(title, message)
    
    def show_error(self, title: str, message: str):
        """显示错误对话框"""
        messagebox.showerror(title, message)
    
    def show_warning(self, title: str, message: str):
        """显示警告对话框"""
        messagebox.showwarning(title, message)
    
    def ask_yes_no(self, title: str, message: str) -> bool:
        """显示是否确认对话框"""
        return messagebox.askyesno(title, message)
    
    def ask_ok_cancel(self, title: str, message: str) -> bool:
        """显示确定取消对话框"""
        return messagebox.askokcancel(title, message)
    
    def select_file(self, title: str = "选择文件", 
                   filetypes: List[Tuple[str, str]] = None) -> str:
        """选择文件对话框"""
        if filetypes is None:
            filetypes = [("所有文件", "*.*")]
        
        return filedialog.askopenfilename(title=title, filetypes=filetypes)
    
    def select_files(self, title: str = "选择文件", 
                    filetypes: List[Tuple[str, str]] = None) -> List[str]:
        """选择多个文件对话框"""
        if filetypes is None:
            filetypes = [("所有文件", "*.*")]
        
        files = filedialog.askopenfilenames(title=title, filetypes=filetypes)
        return list(files) if files else []
    
    def select_directory(self, title: str = "选择目录") -> str:
        """选择目录对话框"""
        return filedialog.askdirectory(title=title)
    
    def save_file(self, title: str = "保存文件", 
                 defaultextension: str = ".txt",
                 filetypes: List[Tuple[str, str]] = None) -> str:
        """保存文件对话框"""
        if filetypes is None:
            filetypes = [("文本文件", "*.txt"), ("所有文件", "*.*")]
        
        return filedialog.asksaveasfilename(
            title=title, 
            defaultextension=defaultextension,
            filetypes=filetypes
        )
    
    # 配置管理方法
    def get_config(self, key: str, default=None):
        """获取配置值"""
        if self.config_manager:
            return self.config_manager.get(f"{self.module_name.lower()}.{key}", default)
        return default
    
    def set_config(self, key: str, value):
        """设置配置值"""
        if self.config_manager:
            self.config_manager.set(f"{self.module_name.lower()}.{key}", value)
    
    def save_config(self):
        """保存配置"""
        if self.config_manager:
            self.config_manager.save()
    
    # 事件系统
    def bind_event(self, event_name: str, callback: Callable):
        """绑定事件回调"""
        if event_name not in self.event_callbacks:
            self.event_callbacks[event_name] = []
        self.event_callbacks[event_name].append(callback)
    
    def trigger_event(self, event_name: str, *args, **kwargs):
        """触发事件"""
        if event_name in self.event_callbacks:
            for callback in self.event_callbacks[event_name]:
                try:
                    callback(*args, **kwargs)
                except Exception as e:
                    self.update_status(f"事件回调错误: {str(e)}", "ERROR")
    
    # 模块信息
    def get_module_info(self) -> Dict[str, Any]:
        """获取模块信息"""
        return {
            "name": self.module_name,
            "version": self.module_version,
            "description": self.module_description,
            "icon": self.module_icon,
            "initialized": self.is_initialized,
            "visible": self.is_visible,
            "data_keys": list(self.module_data.keys()),
            "ui_components": list(self.ui_components.keys())
        }
    
    def get_module_status(self) -> Dict[str, Any]:
        """获取模块状态"""
        return {
            "name": self.module_name,
            "initialized": self.is_initialized,
            "visible": self.is_visible,
            "data_count": len(self.module_data),
            "ui_count": len(self.ui_components),
            "event_count": sum(len(callbacks) for callbacks in self.event_callbacks.values())
        }
    
    def cleanup(self):
        """清理模块资源"""
        self.hide()
        self.event_callbacks.clear()
        self.module_data.clear()
        self.ui_components.clear()
        self.is_initialized = False

    # 数据管理方法
    def set_data(self, key: str, value: Any):
        """设置模块数据"""
        self.module_data[key] = value

    def get_data(self, key: str, default=None):
        """获取模块数据"""
        return self.module_data.get(key, default)

    def clear_data(self):
        """清空模块数据"""
        self.module_data.clear()

    # UI组件管理
    def register_ui_component(self, name: str, component):
        """注册UI组件"""
        self.ui_components[name] = component

    def get_ui_component(self, name: str):
        """获取UI组件"""
        return self.ui_components.get(name)

    def update_ui_component(self, name: str, **kwargs):
        """更新UI组件属性"""
        component = self.get_ui_component(name)
        if component:
            for key, value in kwargs.items():
                if hasattr(component, key):
                    setattr(component, key, value)
                elif hasattr(component, 'config'):
                    component.config(**{key: value})
