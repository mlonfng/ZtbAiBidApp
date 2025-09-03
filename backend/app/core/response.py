"""
响应处理模块
"""
from typing import Any, Dict
from fastapi.responses import JSONResponse

class APIResponse:
    @staticmethod
    def success(data: Any = None, message: str = "操作成功") -> JSONResponse:
        """成功响应"""
        return JSONResponse({
            "code": 200,
            "message": message,
            "data": data,
            "success": True
        })

    @staticmethod
    def error(message: str = "操作失败", code: int = 400, data: Any = None) -> JSONResponse:
        """错误响应（通用）"""
        return JSONResponse({
            "code": code,
            "message": message,
            "data": data,
            "success": False
        }, status_code=code)

    @staticmethod
    def server_error(message: str = "服务器内部错误", data: Any = None) -> JSONResponse:
        """向后兼容：提供 server_error 别名，返回500"""
        return APIResponse.error(message=message, code=500, data=data)

def create_response(success: bool = True, message: str = "操作成功", data: Any = None, code: int = 200) -> Dict[str, Any]:
    """创建响应数据"""
    return {
        "success": success,
        "message": message,
        "data": data or {},
        "code": code
    }

def create_error_response(message: str = "操作失败", code: int = 400, data: Any = None) -> Dict[str, Any]:
    """创建错误响应数据"""
    return {
        "success": False,
        "message": message,
        "data": data or {},
        "code": code
    }
