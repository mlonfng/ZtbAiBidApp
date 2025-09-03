"""
验证API模块
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.validation_service import ValidationService
from ..core.response import APIResponse
import tempfile
import os

router = APIRouter(prefix="/api/validation", tags=["validation"])
validation_service = ValidationService()

@router.post("/file")
async def validate_file(file: UploadFile = File(...)):
    """验证上传的文件"""
    try:
        # 保存临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # 验证文件
        result = validation_service.validate_bid_file(temp_file_path)
        
        # 清理临时文件
        os.unlink(temp_file_path)
        
        if result["valid"]:
            return APIResponse.success(result, "文件验证通过")
        else:
            return APIResponse.error(result["message"], 400, result)
            
    except Exception as e:
        return APIResponse.server_error(f"文件验证失败: {str(e)}")
