"""
系统配置模块实现
完整重构的系统配置模块，包括AI模型配置、主题设置、路径配置等所有功能
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
from datetime import datetime
from typing import Dict, Any, Optional
from ..base import BaseModule


class SystemConfigModule(BaseModule):
    """系统配置模块"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # 配置变量
        self.theme_var = None
        self.path_var = None
        self.language_var = None
        self.auto_save_var = None
        
        # AI配置变量
        self.provider_var = None
        self.current_provider_var = None
        self.provider_status_var = None
        
        # DeepSeek配置变量
        self.deepseek_api_key_var = None
        self.deepseek_base_url_var = None
        self.deepseek_model_var = None
        self.deepseek_max_tokens_var = None
        self.deepseek_temperature_var = None
        self.deepseek_show_password = None
        self.deepseek_api_key_entry = None
        
        # OpenAI配置变量
        self.openai_api_key_var = None
        self.openai_base_url_var = None
        self.openai_model_var = None
        self.openai_show_password = None
        self.openai_api_key_entry = None
        
        # UI组件
        self.deepseek_frame = None
        self.openai_frame = None
        self.config_result_text = None
        
    def get_module_name(self) -> str:
        return "系统配置"
    
    def get_module_description(self) -> str:
        return "管理系统配置，包括AI模型设置、主题配置、路径设置等"
    
    def get_module_icon(self) -> str:
        return "⚙️"
    
    def create_ui(self) -> ttk.Frame:
        """创建系统配置UI"""
        main_frame = ttk.Frame(self.notebook)
        
        # 创建滚动框架
        canvas = tk.Canvas(main_frame)
        scrollbar = ttk.Scrollbar(main_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # 页面标题
        ttk.Label(scrollable_frame, text="系统配置", font=("Arial", 14, "bold")).grid(
            row=0, column=0, columnspan=3, pady=10)
        
        # 创建各个配置区域
        self.create_basic_settings(scrollable_frame)
        self.create_ai_settings(scrollable_frame)
        self.create_ai_config_frames(scrollable_frame)
        self.create_action_buttons(scrollable_frame)
        self.create_result_area(scrollable_frame)
        
        # 配置滚动框架
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # 配置网格权重
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(0, weight=1)
        scrollable_frame.columnconfigure(1, weight=1)
        
        # 加载当前配置
        self.load_unified_config()
        
        return main_frame
    
    def create_basic_settings(self, parent):
        """创建基本设置区域"""
        basic_frame = ttk.LabelFrame(parent, text="基本设置", padding="10")
        basic_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=10)
        
        # 主题设置
        ttk.Label(basic_frame, text="主题:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.theme_var = tk.StringVar(value="浅色")
        theme_combo = ttk.Combobox(basic_frame, textvariable=self.theme_var,
                                  values=["浅色", "深色", "自动"])
        theme_combo.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(10, 0), pady=5)
        
        # 默认路径设置
        ttk.Label(basic_frame, text="默认项目路径:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.path_var = tk.StringVar(value="./projects")
        path_entry = ttk.Entry(basic_frame, textvariable=self.path_var, width=40)
        path_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), padx=(10, 0), pady=5)
        
        # 浏览按钮
        browse_btn = ttk.Button(basic_frame, text="浏览", command=self.browse_path)
        browse_btn.grid(row=1, column=2, padx=(5, 0), pady=5)
        
        # 语言设置
        ttk.Label(basic_frame, text="语言:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.language_var = tk.StringVar(value="中文")
        language_combo = ttk.Combobox(basic_frame, textvariable=self.language_var,
                                     values=["中文", "English"])
        language_combo.grid(row=2, column=1, sticky=(tk.W, tk.E), padx=(10, 0), pady=5)
        
        # 自动保存
        self.auto_save_var = tk.BooleanVar(value=True)
        auto_save_check = ttk.Checkbutton(basic_frame, text="自动保存",
                                         variable=self.auto_save_var)
        auto_save_check.grid(row=3, column=0, columnspan=2, sticky=tk.W, pady=5)
        
        basic_frame.columnconfigure(1, weight=1)
    
    def create_ai_settings(self, parent):
        """创建AI设置区域"""
        ai_frame = ttk.LabelFrame(parent, text="AI模型设置", padding="10")
        ai_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=10)
        
        # 当前提供商状态
        status_frame = ttk.Frame(ai_frame)
        status_frame.grid(row=0, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=5)
        
        ttk.Label(status_frame, text="当前AI提供商:").grid(row=0, column=0, sticky=tk.W)
        self.current_provider_var = tk.StringVar(value="加载中...")
        ttk.Label(status_frame, textvariable=self.current_provider_var, 
                 foreground="blue").grid(row=0, column=1, sticky=tk.W, padx=10)
        
        ttk.Label(status_frame, text="连接状态:").grid(row=0, column=2, sticky=tk.W, padx=(20, 0))
        self.provider_status_var = tk.StringVar(value="检测中...")
        ttk.Label(status_frame, textvariable=self.provider_status_var).grid(
            row=0, column=3, sticky=tk.W, padx=10)
        
        # 提供商选择
        ttk.Label(ai_frame, text="选择AI提供商:").grid(row=1, column=0, sticky=tk.W, pady=10)
        self.provider_var = tk.StringVar(value="deepseek")
        providers = [("DeepSeek (推荐)", "deepseek"), ("OpenAI", "openai"), ("本地模型", "local")]
        
        provider_frame = ttk.Frame(ai_frame)
        provider_frame.grid(row=1, column=1, columnspan=2, sticky=tk.W, pady=10)
        
        for i, (text, value) in enumerate(providers):
            ttk.Radiobutton(provider_frame, text=text, variable=self.provider_var,
                           value=value, command=self.on_provider_change).grid(
                               row=0, column=i, padx=20)
    
    def create_ai_config_frames(self, parent):
        """创建AI配置框架"""
        # DeepSeek配置
        self.deepseek_frame = ttk.LabelFrame(parent, text="DeepSeek配置", padding="10")
        self.deepseek_frame.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=10)
        
        # API密钥
        ttk.Label(self.deepseek_frame, text="API密钥:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.deepseek_api_key_var = tk.StringVar()
        self.deepseek_api_key_entry = ttk.Entry(self.deepseek_frame, 
                                               textvariable=self.deepseek_api_key_var, 
                                               width=45, show="*")
        self.deepseek_api_key_entry.grid(row=0, column=1, padx=10, sticky=(tk.W, tk.E), pady=5)
        
        # 显示/隐藏密码按钮
        self.deepseek_show_password = tk.BooleanVar()
        ttk.Checkbutton(self.deepseek_frame, text="显示", variable=self.deepseek_show_password,
                       command=self.toggle_deepseek_password).grid(row=0, column=2, padx=5)
        
        # 调用地址
        ttk.Label(self.deepseek_frame, text="调用地址:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.deepseek_base_url_var = tk.StringVar(value="https://api.deepseek.com")
        ttk.Entry(self.deepseek_frame, textvariable=self.deepseek_base_url_var, 
                 width=50).grid(row=1, column=1, padx=10, sticky=(tk.W, tk.E), pady=5)
        
        # 模型选择
        ttk.Label(self.deepseek_frame, text="模型:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.deepseek_model_var = tk.StringVar(value="deepseek-chat")
        model_combo = ttk.Combobox(self.deepseek_frame, textvariable=self.deepseek_model_var,
                                  values=["deepseek-chat", "deepseek-coder", "deepseek-math"])
        model_combo.grid(row=2, column=1, padx=10, pady=5, sticky=(tk.W, tk.E))
        
        # 最大Token
        ttk.Label(self.deepseek_frame, text="最大Token:").grid(row=3, column=0, sticky=tk.W, pady=5)
        self.deepseek_max_tokens_var = tk.StringVar(value="4000")
        ttk.Entry(self.deepseek_frame, textvariable=self.deepseek_max_tokens_var, 
                 width=20).grid(row=3, column=1, padx=10, pady=5, sticky=tk.W)
        
        # 温度参数
        ttk.Label(self.deepseek_frame, text="温度参数:").grid(row=4, column=0, sticky=tk.W, pady=5)
        self.deepseek_temperature_var = tk.StringVar(value="0.7")
        ttk.Entry(self.deepseek_frame, textvariable=self.deepseek_temperature_var, 
                 width=20).grid(row=4, column=1, padx=10, pady=5, sticky=tk.W)
        
        self.deepseek_frame.columnconfigure(1, weight=1)
        
        # OpenAI配置（默认隐藏）
        self.openai_frame = ttk.LabelFrame(parent, text="OpenAI配置", padding="10")
        self.openai_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=10)
        self.openai_frame.grid_remove()  # 默认隐藏
        
        # API密钥
        ttk.Label(self.openai_frame, text="API密钥:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.openai_api_key_var = tk.StringVar()
        self.openai_api_key_entry = ttk.Entry(self.openai_frame, 
                                             textvariable=self.openai_api_key_var, 
                                             width=45, show="*")
        self.openai_api_key_entry.grid(row=0, column=1, padx=10, sticky=(tk.W, tk.E), pady=5)
        
        # 显示/隐藏密码按钮
        self.openai_show_password = tk.BooleanVar()
        ttk.Checkbutton(self.openai_frame, text="显示", variable=self.openai_show_password,
                       command=self.toggle_openai_password).grid(row=0, column=2, padx=5)
        
        # 调用地址
        ttk.Label(self.openai_frame, text="调用地址:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.openai_base_url_var = tk.StringVar(value="https://api.openai.com/v1")
        ttk.Entry(self.openai_frame, textvariable=self.openai_base_url_var, 
                 width=50).grid(row=1, column=1, padx=10, sticky=(tk.W, tk.E), pady=5)
        
        # 模型选择
        ttk.Label(self.openai_frame, text="模型:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.openai_model_var = tk.StringVar(value="gpt-3.5-turbo")
        openai_model_combo = ttk.Combobox(self.openai_frame, textvariable=self.openai_model_var,
                                         values=["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"])
        openai_model_combo.grid(row=2, column=1, padx=10, pady=5, sticky=(tk.W, tk.E))
        
        self.openai_frame.columnconfigure(1, weight=1)
    
    def create_action_buttons(self, parent):
        """创建操作按钮"""
        button_frame = ttk.Frame(parent)
        button_frame.grid(row=5, column=0, columnspan=3, pady=20)
        
        ttk.Button(button_frame, text="测试AI连接", 
                  command=self.test_ai_connection).grid(row=0, column=0, padx=10)
        ttk.Button(button_frame, text="保存配置", 
                  command=self.save_unified_config).grid(row=0, column=1, padx=10)
        ttk.Button(button_frame, text="重置默认", 
                  command=self.reset_config).grid(row=0, column=2, padx=10)
        ttk.Button(button_frame, text="刷新状态", 
                  command=self.refresh_config_status).grid(row=0, column=3, padx=10)
    
    def create_result_area(self, parent):
        """创建结果显示区域"""
        result_frame = ttk.LabelFrame(parent, text="操作结果", padding="10")
        result_frame.grid(row=6, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)
        
        self.config_result_text = tk.Text(result_frame, height=10, width=80)
        config_scrollbar = ttk.Scrollbar(result_frame, orient=tk.VERTICAL, 
                                        command=self.config_result_text.yview)
        self.config_result_text.configure(yscrollcommand=config_scrollbar.set)
        
        self.config_result_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        config_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        result_frame.columnconfigure(0, weight=1)
        result_frame.rowconfigure(0, weight=1)
        
        # 注册UI组件
        self.register_ui_component("result_text", self.config_result_text)

    def on_provider_change(self):
        """提供商选择改变时的处理"""
        provider = self.provider_var.get()

        # 显示/隐藏相应的配置框
        if provider == "deepseek":
            if self.deepseek_frame:
                self.deepseek_frame.grid()
            if self.openai_frame:
                self.openai_frame.grid_remove()
        elif provider == "openai":
            if self.deepseek_frame:
                self.deepseek_frame.grid_remove()
            if self.openai_frame:
                self.openai_frame.grid()
        else:  # local
            if self.deepseek_frame:
                self.deepseek_frame.grid_remove()
            if self.openai_frame:
                self.openai_frame.grid_remove()

    def toggle_deepseek_password(self):
        """切换DeepSeek API密钥显示/隐藏"""
        if self.deepseek_show_password.get():
            self.deepseek_api_key_entry.config(show="")
        else:
            self.deepseek_api_key_entry.config(show="*")

    def toggle_openai_password(self):
        """切换OpenAI API密钥显示/隐藏"""
        if self.openai_show_password.get():
            self.openai_api_key_entry.config(show="")
        else:
            self.openai_api_key_entry.config(show="*")

    def browse_path(self):
        """浏览路径"""
        path = filedialog.askdirectory(title="选择默认项目路径")
        if path:
            self.path_var.set(path)
            self.log_message("已选择路径: " + path)

    def log_message(self, message: str, level: str = "INFO"):
        """记录消息到结果区域"""
        if self.config_result_text:
            timestamp = datetime.now().strftime('%H:%M:%S')
            self.config_result_text.insert(tk.END, f"[{timestamp}] {message}\n")
            self.config_result_text.see(tk.END)

        # 同时更新状态
        self.update_status(message, level)

    def load_unified_config(self):
        """加载统一配置"""
        def load():
            try:
                result = self.make_api_request("GET", "/api/unified-config/")
                if result.get('success'):
                    data = result.get('data', {})
                    config = data.get('config', {})

                    # 加载系统配置
                    system_config = config.get('system', {})
                    self.theme_var.set(system_config.get('theme', '浅色'))
                    self.path_var.set(system_config.get('default_path', './projects'))
                    self.language_var.set(system_config.get('language', '中文'))
                    self.auto_save_var.set(system_config.get('auto_save', True))

                    # 加载AI配置
                    ai_models = config.get('ai_models', {})
                    current_provider = system_config.get('current_ai_provider', 'deepseek')

                    self.current_provider_var.set(current_provider)
                    self.provider_var.set(current_provider)

                    # 加载DeepSeek配置
                    if 'deepseek' in ai_models:
                        deepseek_config = ai_models['deepseek']
                        self.deepseek_api_key_var.set(deepseek_config.get('api_key', ''))
                        self.deepseek_base_url_var.set(deepseek_config.get('base_url', 'https://api.deepseek.com'))
                        self.deepseek_model_var.set(deepseek_config.get('model', 'deepseek-chat'))
                        self.deepseek_max_tokens_var.set(str(deepseek_config.get('max_tokens', 4000)))
                        self.deepseek_temperature_var.set(str(deepseek_config.get('temperature', 0.7)))

                        # 更新状态
                        validation = deepseek_config.get('validation', {})
                        if validation.get('valid'):
                            self.provider_status_var.set("✓ 配置有效")
                        else:
                            self.provider_status_var.set(f"✗ {validation.get('message', '配置无效')}")

                    # 加载OpenAI配置
                    if 'openai' in ai_models:
                        openai_config = ai_models['openai']
                        self.openai_api_key_var.set(openai_config.get('api_key', ''))
                        self.openai_base_url_var.set(openai_config.get('base_url', 'https://api.openai.com/v1'))
                        self.openai_model_var.set(openai_config.get('model', 'gpt-3.5-turbo'))

                    self.on_provider_change()
                    self.log_message("配置加载成功")
                else:
                    self.log_message(f"加载失败: {result.get('message')}", "ERROR")

            except Exception as e:
                self.log_message(f"加载异常: {str(e)}", "ERROR")

        threading.Thread(target=load, daemon=True).start()

    def save_unified_config(self):
        """保存统一配置"""
        self.log_message("正在保存配置...")

        def save():
            try:
                # 保存系统配置
                system_data = {
                    "theme": self.theme_var.get(),
                    "default_path": self.path_var.get(),
                    "language": self.language_var.get(),
                    "auto_save": self.auto_save_var.get()
                }

                result = self.make_api_request("PUT", "/api/unified-config/system", json=system_data)
                if result.get('success'):
                    self.log_message("✓ 系统配置保存成功")
                else:
                    self.log_message(f"✗ 系统配置保存失败: {result.get('message', '未知错误')}", "ERROR")
                    return

                # 保存AI配置
                provider = self.provider_var.get()
                ai_data = {}

                if provider == "deepseek":
                    ai_data = {
                        "api_key": self.deepseek_api_key_var.get(),
                        "base_url": self.deepseek_base_url_var.get(),
                        "model": self.deepseek_model_var.get(),
                        "max_tokens": int(self.deepseek_max_tokens_var.get()) if self.deepseek_max_tokens_var.get().isdigit() else 4000,
                        "temperature": float(self.deepseek_temperature_var.get()) if self.deepseek_temperature_var.get().replace('.', '').isdigit() else 0.7,
                        "enabled": True
                    }
                elif provider == "openai":
                    ai_data = {
                        "api_key": self.openai_api_key_var.get(),
                        "base_url": self.openai_base_url_var.get(),
                        "model": self.openai_model_var.get(),
                        "enabled": True
                    }

                if ai_data:
                    result = self.make_api_request("PUT", f"/api/unified-config/ai/{provider}", json=ai_data)
                    if result.get('success'):
                        self.log_message(f"✓ {provider}配置保存成功")

                        # 切换到新提供商
                        switch_result = self.make_api_request("POST", "/api/unified-config/ai/switch",
                                                            json={"provider": provider})
                        if switch_result.get('success'):
                            self.log_message(f"✓ 已切换到 {provider}")
                            self.current_provider_var.set(provider)
                        else:
                            self.log_message(f"切换失败: {switch_result.get('message')}", "ERROR")
                    else:
                        self.log_message(f"✗ {provider}配置保存失败: {result.get('message', '未知错误')}", "ERROR")

            except Exception as e:
                self.log_message(f"保存异常: {str(e)}", "ERROR")

        threading.Thread(target=save, daemon=True).start()

    def test_ai_connection(self):
        """测试AI连接"""
        provider = self.provider_var.get()
        self.log_message(f"正在测试 {provider} 连接...")

        def test():
            try:
                result = self.make_api_request("POST", f"/api/unified-config/ai/{provider}/test")
                if result.get('success'):
                    data = result.get('data', {})
                    self.log_message("✓ 连接测试成功")
                    self.log_message(f"    响应时间: {data.get('response_time', 0):.2f}秒")
                    self.log_message(f"    使用模型: {data.get('model', 'unknown')}")
                    self.provider_status_var.set("✓ 连接正常")
                else:
                    self.log_message(f"✗ 连接测试失败: {result.get('message')}", "ERROR")
                    self.provider_status_var.set("✗ 连接失败")

            except Exception as e:
                self.log_message(f"测试异常: {str(e)}", "ERROR")
                self.provider_status_var.set("✗ 测试异常")

        threading.Thread(target=test, daemon=True).start()

    def reset_config(self):
        """重置配置为默认值"""
        if self.ask_yes_no("确认重置", "确定要重置所有配置为默认值吗？"):
            self.log_message("正在重置配置...")

            def reset():
                try:
                    result = self.make_api_request("POST", "/api/unified-config/reset")
                    if result.get('success'):
                        self.log_message("✓ 配置重置成功")
                        # 重新加载配置
                        self.load_unified_config()
                    else:
                        self.log_message(f"重置失败: {result.get('message')}", "ERROR")

                except Exception as e:
                    self.log_message(f"重置异常: {str(e)}", "ERROR")

            threading.Thread(target=reset, daemon=True).start()

    def refresh_config_status(self):
        """刷新配置状态"""
        self.log_message("正在刷新状态...")

        def refresh():
            try:
                # 重新加载配置
                self.load_unified_config()

                # 测试当前提供商连接
                current_provider = self.current_provider_var.get()
                if current_provider and current_provider != "加载中...":
                    test_result = self.make_api_request("POST", f"/api/unified-config/ai/{current_provider}/test")
                    if test_result.get('success'):
                        self.provider_status_var.set("✓ 连接正常")
                    else:
                        self.provider_status_var.set("✗ 连接异常")

                self.log_message("✓ 状态刷新完成")

            except Exception as e:
                self.log_message(f"刷新异常: {str(e)}", "ERROR")

        threading.Thread(target=refresh, daemon=True).start()

    def export_config(self):
        """导出配置"""
        filename = self.save_file(
            title="导出配置",
            defaultextension=".json",
            filetypes=[("JSON文件", "*.json"), ("所有文件", "*.*")]
        )

        if filename:
            try:
                config_data = {
                    "system": {
                        "theme": self.theme_var.get(),
                        "default_path": self.path_var.get(),
                        "language": self.language_var.get(),
                        "auto_save": self.auto_save_var.get()
                    },
                    "ai": {
                        "provider": self.provider_var.get(),
                        "deepseek": {
                            "api_key": self.deepseek_api_key_var.get(),
                            "base_url": self.deepseek_base_url_var.get(),
                            "model": self.deepseek_model_var.get(),
                            "max_tokens": self.deepseek_max_tokens_var.get(),
                            "temperature": self.deepseek_temperature_var.get()
                        },
                        "openai": {
                            "api_key": self.openai_api_key_var.get(),
                            "base_url": self.openai_base_url_var.get(),
                            "model": self.openai_model_var.get()
                        }
                    }
                }

                import json
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(config_data, f, indent=2, ensure_ascii=False)

                self.log_message(f"✓ 配置已导出到: {filename}")
                self.show_info("成功", f"配置已导出到: {filename}")

            except Exception as e:
                self.log_message(f"导出失败: {str(e)}", "ERROR")
                self.show_error("错误", f"配置导出失败: {str(e)}")

    def import_config(self):
        """导入配置"""
        filename = self.select_file(
            title="导入配置",
            filetypes=[("JSON文件", "*.json"), ("所有文件", "*.*")]
        )

        if filename:
            try:
                import json
                with open(filename, 'r', encoding='utf-8') as f:
                    config_data = json.load(f)

                # 更新UI
                system_config = config_data.get("system", {})
                if "theme" in system_config:
                    self.theme_var.set(system_config["theme"])
                if "default_path" in system_config:
                    self.path_var.set(system_config["default_path"])
                if "language" in system_config:
                    self.language_var.set(system_config["language"])
                if "auto_save" in system_config:
                    self.auto_save_var.set(system_config["auto_save"])

                ai_config = config_data.get("ai", {})
                if "provider" in ai_config:
                    self.provider_var.set(ai_config["provider"])

                deepseek_config = ai_config.get("deepseek", {})
                if deepseek_config:
                    self.deepseek_api_key_var.set(deepseek_config.get("api_key", ""))
                    self.deepseek_base_url_var.set(deepseek_config.get("base_url", ""))
                    self.deepseek_model_var.set(deepseek_config.get("model", ""))
                    self.deepseek_max_tokens_var.set(deepseek_config.get("max_tokens", ""))
                    self.deepseek_temperature_var.set(deepseek_config.get("temperature", ""))

                openai_config = ai_config.get("openai", {})
                if openai_config:
                    self.openai_api_key_var.set(openai_config.get("api_key", ""))
                    self.openai_base_url_var.set(openai_config.get("base_url", ""))
                    self.openai_model_var.set(openai_config.get("model", ""))

                self.on_provider_change()
                self.log_message(f"✓ 配置已从 {filename} 导入")
                self.show_info("成功", f"配置已从 {filename} 导入")

            except Exception as e:
                self.log_message(f"导入失败: {str(e)}", "ERROR")
                self.show_error("错误", f"配置导入失败: {str(e)}")

    def clear_log(self):
        """清空日志"""
        if self.config_result_text:
            self.config_result_text.delete("1.0", tk.END)
            self.log_message("日志已清空")

    def on_show(self):
        """模块显示时的回调"""
        super().on_show()
        # 刷新配置状态
        self.refresh_config_status()
