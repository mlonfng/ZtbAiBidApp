"""
��֤APIģ��
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
    """��֤�ϴ����ļ�"""
    try:
        # ������ʱ�ļ�
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # ��֤�ļ�
        result = validation_service.validate_bid_file(temp_file_path)
        
        # ������ʱ�ļ�
        os.unlink(temp_file_path)
        
        if result["valid"]:
            return APIResponse.success(result, "�ļ���֤ͨ��")
        else:
            return APIResponse.error(result["message"], 400, result)
            
    except Exception as e:
        return APIResponse.server_error(f"�ļ���֤ʧ��: {str(e)}")
