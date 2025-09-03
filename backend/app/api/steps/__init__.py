"""
Step API模块
实现统一规范v3的标准Step API架构
"""

from .service_mode import router as service_mode_router
from .bid_analysis import router as bid_analysis_router
from .file_formatting import router as file_formatting_router
from .material_management import router as material_management_router
from .framework_generation import router as framework_generation_router
from .content_generation import router as content_generation_router
from .format_config import router as format_config_router
from .document_export import router as document_export_router

__all__ = [
    "service_mode_router",
    "bid_analysis_router", 
    "file_formatting_router",
    "material_management_router",
    "framework_generation_router",
    "content_generation_router",
    "format_config_router",
    "document_export_router"
]
