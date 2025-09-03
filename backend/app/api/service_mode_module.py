"""
服务模式模块实现
"""

import tkinter as tk
from tkinter import ttk
import threading
from ..base import BaseModule


class ServiceModeModule(BaseModule):
    """服务模式模块"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.current_mode = None
        self.mode_var = None
        self.status_label = None
    
    def get_module_name(self) -> str:
        return "服务模式"
    
    def get_module_description(self) -> str:
        return "选择和管理服务模式：免费模式、AI智能模式、人工模式"
    
    def get_module_icon(self) -> str:
        return "🔧"
    
    def create_ui(self) -> ttk.Frame:
        """创建服务模式UI"""
        main_frame = ttk.Frame(self.notebook)
        
        # 页面标题
        ttk.Label(main_frame, text="服务模式选择", font=("Arial", 14, "bold")).pack(pady=20)
        
        # 服务模式选择
        mode_frame = ttk.LabelFrame(main_frame, text="服务模式选择", padding="20")
        mode_frame.pack(fill="x", padx=20, pady=20)
        
        self.mode_var = tk.StringVar(value="free")
        
        # 免费模式
        free_frame = ttk.Frame(mode_frame)
        free_frame.pack(fill="x", pady=10)
        
        ttk.Radiobutton(free_frame, text="免费模式", variable=self.mode_var, 
                       value="free", command=self.on_mode_change).pack(anchor=tk.W)
        ttk.Label(free_frame, text="  • 基础功能，有限制", foreground="gray").pack(anchor=tk.W, padx=20)
        ttk.Label(free_frame, text="  • 适合小型项目和测试使用", foreground="gray").pack(anchor=tk.W, padx=20)
        
        # AI智能模式
        ai_frame = ttk.Frame(mode_frame)
        ai_frame.pack(fill="x", pady=10)
        
        ttk.Radiobutton(ai_frame, text="AI智能模式", variable=self.mode_var, 
                       value="ai", command=self.on_mode_change).pack(anchor=tk.W)
        ttk.Label(ai_frame, text="  • AI辅助生成，智能分析", foreground="gray").pack(anchor=tk.W, padx=20)
        ttk.Label(ai_frame, text="  • 自动化程度高，效率提升", foreground="gray").pack(anchor=tk.W, padx=20)
        
        # 人工模式
        manual_frame = ttk.Frame(mode_frame)
        manual_frame.pack(fill="x", pady=10)
        
        ttk.Radiobutton(manual_frame, text="人工模式", variable=self.mode_var, 
                       value="manual", command=self.on_mode_change).pack(anchor=tk.W)
        ttk.Label(manual_frame, text="  • 专业人工服务，定制化", foreground="gray").pack(anchor=tk.W, padx=20)
        ttk.Label(manual_frame, text="  • 质量最高，适合重要项目", foreground="gray").pack(anchor=tk.W, padx=20)
        
        # 操作按钮
        button_frame = ttk.Frame(mode_frame)
        button_frame.pack(fill="x", pady=20)
        
        ttk.Button(button_frame, text="应用设置", command=self.apply_mode).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="查询当前模式", command=self.get_current_mode).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="模式说明", command=self.show_mode_help).pack(side=tk.LEFT, padx=5)
        
        # 状态显示
        status_frame = ttk.LabelFrame(main_frame, text="当前状态", padding="10")
        status_frame.pack(fill="x", padx=20, pady=10)
        
        self.status_label = ttk.Label(status_frame, text="当前模式: 未知", font=("Arial", 12))
        self.status_label.pack(pady=10)
        
        # 模式详情显示
        details_frame = ttk.LabelFrame(main_frame, text="模式详情", padding="10")
        details_frame.pack(fill="both", expand=True, padx=20, pady=10)
        
        self.details_text = tk.Text(details_frame, height=8, wrap=tk.WORD)
        details_scrollbar = ttk.Scrollbar(details_frame, orient="vertical", command=self.details_text.yview)
        self.details_text.configure(yscrollcommand=details_scrollbar.set)
        
        self.details_text.pack(side="left", fill="both", expand=True)
        details_scrollbar.pack(side="right", fill="y")
        
        # 注册UI组件
        self.register_ui_component("status_label", self.status_label)
        self.register_ui_component("details_text", self.details_text)
        
        # 加载当前模式
        self.get_current_mode()
        
        return main_frame
    
    def on_mode_change(self):
        """模式变更事件"""
        mode = self.mode_var.get()
        mode_names = {"free": "免费模式", "ai": "AI智能模式", "manual": "人工模式"}
        self.update_status(f"选择了{mode_names.get(mode, mode)}")
        self.update_mode_details(mode)
    
    def update_mode_details(self, mode):
        """更新模式详情显示"""
        details = {
            "free": """免费模式详情：

• 功能限制：基础文档处理功能
• 项目数量：最多3个项目
• 文件大小：单个文件不超过10MB
• AI功能：不可用
• 技术支持：社区支持
• 适用场景：个人学习、小型测试项目

注意：免费模式仅供体验使用，不建议用于正式项目。""",
            
            "ai": """AI智能模式详情：

• 功能完整：所有AI辅助功能
• 项目数量：无限制
• 文件大小：单个文件不超过100MB
• AI功能：智能分析、自动生成、格式优化
• 技术支持：在线客服支持
• 适用场景：中小型企业、常规投标项目

特色功能：
- 智能招标文件分析
- 自动生成投标文件框架
- AI辅助内容生成
- 格式自动优化""",
            
            "manual": """人工模式详情：

• 功能完整：所有功能 + 人工服务
• 项目数量：无限制
• 文件大小：无限制
• AI功能：全部可用
• 技术支持：专属客服 + 专家指导
• 适用场景：大型企业、重要项目、复杂投标

专属服务：
- 专业顾问一对一指导
- 定制化解决方案
- 人工质量审核
- 24小时技术支持
- 投标策略咨询"""
        }
        
        if self.details_text:
            self.details_text.delete("1.0", tk.END)
            self.details_text.insert("1.0", details.get(mode, "模式详情加载中..."))
    
    def apply_mode(self):
        """应用服务模式"""
        mode = self.mode_var.get()
        
        def apply():
            try:
                result = self.make_api_request("POST", "/service-mode/set", json={"mode": mode})
                
                if result.get("success"):
                    mode_names = {"free": "免费模式", "ai": "AI智能模式", "manual": "人工模式"}
                    mode_name = mode_names.get(mode, mode)
                    
                    self.show_info("成功", f"服务模式已设置为: {mode_name}")
                    self.status_label.config(text=f"当前模式: {mode_name}")
                    self.update_status("服务模式设置成功")
                    
                    # 更新当前模式
                    self.current_mode = mode
                else:
                    error_msg = result.get('message', '设置失败')
                    self.show_error("错误", f"服务模式设置失败: {error_msg}")
                    self.update_status("服务模式设置失败", "ERROR")
            
            except Exception as e:
                error_msg = f"设置服务模式异常: {str(e)}"
                self.show_error("错误", error_msg)
                self.update_status(error_msg, "ERROR")
        
        threading.Thread(target=apply, daemon=True).start()
    
    def get_current_mode(self):
        """获取当前服务模式"""
        def get_mode():
            try:
                result = self.make_api_request("GET", "/service-mode/current")
                
                if result.get("success"):
                    data = result.get("data", {})
                    mode = data.get("mode", "unknown")
                    mode_names = {"free": "免费模式", "ai": "AI智能模式", "manual": "人工模式"}
                    mode_name = mode_names.get(mode, mode)
                    
                    self.mode_var.set(mode)
                    self.status_label.config(text=f"当前模式: {mode_name}")
                    self.current_mode = mode
                    self.update_mode_details(mode)
                    self.update_status("服务模式查询成功")
                else:
                    self.status_label.config(text="当前模式: 查询失败")
                    self.update_status("服务模式查询失败", "ERROR")
            
            except Exception as e:
                self.status_label.config(text="当前模式: 查询异常")
                self.update_status(f"服务模式查询异常: {str(e)}", "ERROR")
        
        threading.Thread(target=get_mode, daemon=True).start()
    
    def show_mode_help(self):
        """显示模式说明"""
        help_text = """服务模式说明

ZtbAi提供三种服务模式，满足不同用户的需求：

🆓 免费模式
- 适合个人用户和小型项目
- 提供基础功能体验
- 有一定的使用限制

🤖 AI智能模式  
- 适合中小企业和常规项目
- 完整的AI辅助功能
- 高效的自动化处理

👨‍💼 人工模式
- 适合大型企业和重要项目
- 专业人工服务支持
- 定制化解决方案

选择建议：
• 初次使用建议选择免费模式体验
• 日常工作推荐AI智能模式
• 重要项目选择人工模式确保质量"""
        
        self.show_info("服务模式说明", help_text)
    
    def on_show(self):
        """模块显示时的回调"""
        super().on_show()
        # 刷新当前模式状态
        self.get_current_mode()
