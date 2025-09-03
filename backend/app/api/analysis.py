"""
文件分析API路由
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import asyncio
import uuid
import logging
from datetime import datetime
import os
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter()

# 全局任务存储（实际应用中应使用数据库或Redis）
analysis_tasks = {}

class AnalysisRequest(BaseModel):
    """分析请求模型"""
    project_id: str
    analysis_type: str = "comprehensive"

class AnalysisTaskResponse(BaseModel):
    """分析任务响应模型"""
    task_id: str
    project_id: str
    status: str

@router.post("/start")
async def start_analysis(request: AnalysisRequest):
    """开始文件分析"""
    try:
        print(f"🔍 [API] 开始分析项目: {request.project_id}, 类型: {request.analysis_type}")
        
        # 验证项目ID
        if not request.project_id:
            raise HTTPException(status_code=400, detail="项目ID不能为空")
        
        # 生成任务ID
        task_id = str(uuid.uuid4())[:8]
        
        # 创建分析任务
        analysis_tasks[task_id] = {
            "task_id": task_id,
            "project_id": request.project_id,
            "analysis_type": request.analysis_type,
            "status": "running",
            "start_time": datetime.now().isoformat(),
            "progress": 0,
            "result": None,
            "error": None
        }
        
        # 异步执行分析
        asyncio.create_task(execute_analysis(task_id, request.project_id, request.analysis_type))
        
        print(f"✅ [API] 分析任务已启动: {task_id}")
        
        return {
            "success": True,
            "message": "分析任务已启动",
            "data": {
                "task_id": task_id,
                "project_id": request.project_id,
                "status": "running"
            }
        }
        
    except Exception as e:
        logger.error(f"启动分析任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"启动分析任务失败: {str(e)}")

@router.get("/task/{task_id}/status")
async def get_task_status(task_id: str):
    """获取任务状态"""
    try:
        if task_id not in analysis_tasks:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        task = analysis_tasks[task_id]
        
        return {
            "success": True,
            "message": "获取任务状态成功",
            "data": {
                "task_id": task_id,
                "status": task["status"],
                "progress": task["progress"],
                "start_time": task["start_time"],
                "error_message": task.get("error")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取任务状态失败: {str(e)}")

@router.post("/task/{task_id}/stop")
async def stop_task(task_id: str):
    """停止分析任务"""
    try:
        if task_id not in analysis_tasks:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        task = analysis_tasks[task_id]
        if task["status"] == "running":
            task["status"] = "stopped"
            task["progress"] = 0
            print(f"🛑 [API] 分析任务已停止: {task_id}")
        
        return {
            "success": True,
            "message": "任务已停止",
            "data": {
                "task_id": task_id,
                "status": "stopped"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"停止任务失败: {e}")
        raise HTTPException(status_code=500, detail=f"停止任务失败: {str(e)}")

@router.get("/result/{project_id}")
async def get_analysis_result(project_id: str):
    """获取分析结果"""
    try:
        print(f"📊 [API] 获取项目分析结果: {project_id}")
        
        # 查找该项目的最新完成任务
        latest_task = None
        for task in analysis_tasks.values():
            if (task["project_id"] == project_id and 
                task["status"] == "completed" and 
                task.get("result")):
                if not latest_task or task["start_time"] > latest_task["start_time"]:
                    latest_task = task
        
        if not latest_task:
            # 返回模拟数据
            result_data = generate_mock_analysis_result(project_id)
        else:
            result_data = latest_task["result"]
        
        return {
            "success": True,
            "message": "获取分析结果成功",
            "data": result_data
        }
        
    except Exception as e:
        logger.error(f"获取分析结果失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取分析结果失败: {str(e)}")

@router.post("/export/{project_id}")
async def export_analysis_report(project_id: str):
    """导出分析报告"""
    try:
        print(f"📄 [API] 导出项目分析报告: {project_id}")
        
        # 模拟导出过程
        report_filename = f"analysis_report_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        report_url = f"/static/reports/{report_filename}"
        
        return {
            "success": True,
            "message": "报告导出成功",
            "data": {
                "report_url": report_url,
                "filename": report_filename
            }
        }
        
    except Exception as e:
        logger.error(f"导出报告失败: {e}")
        raise HTTPException(status_code=500, detail=f"导出报告失败: {str(e)}")

async def execute_analysis(task_id: str, project_id: str, analysis_type: str):
    """执行分析任务"""
    try:
        print(f"🔄 [API] 开始执行分析任务: {task_id}")
        
        task = analysis_tasks[task_id]
        
        # 模拟分析过程
        for progress in [10, 30, 50, 70, 90, 100]:
            if task["status"] != "running":
                break
                
            await asyncio.sleep(1)  # 模拟处理时间
            task["progress"] = progress
            print(f"📈 [API] 任务 {task_id} 进度: {progress}%")
        
        if task["status"] == "running":
            # 生成分析结果
            result = generate_mock_analysis_result(project_id)
            
            # 保存结果到项目目录
            await save_analysis_results(project_id, result)
            
            task["status"] = "completed"
            task["progress"] = 100
            task["result"] = result
            task["end_time"] = datetime.now().isoformat()
            
            print(f"✅ [API] 分析任务完成: {task_id}")
        
    except Exception as e:
        logger.error(f"执行分析任务失败: {e}")
        task["status"] = "failed"
        task["error"] = str(e)

def generate_mock_analysis_result(project_id: str) -> Dict[str, Any]:
    """生成模拟分析结果"""
    return {
        "basic_info": {
            "project_name": f"项目_{project_id}",
            "tender_unit": "某某公司",
            "project_number": f"PRJ-{project_id}",
            "tender_method": "公开招标"
        },
        "time_info": {
            "publish_time": "2025-07-01",
            "registration_deadline": "2025-07-15",
            "bid_deadline": "2025-07-20",
            "opening_time": "2025-07-21"
        },
        "technical_requirements": {
            "main_specifications": [
                "符合国家相关技术标准",
                "具备完整的技术方案",
                "提供详细的实施计划"
            ],
            "standards": [
                "ISO 9001质量管理体系",
                "ISO 14001环境管理体系"
            ]
        },
        "commercial_requirements": {
            "budget": "100万元",
            "payment_method": "分期付款",
            "performance_bond": "5%",
            "warranty_period": "1年"
        },
        "qualification_requirements": {
            "required_qualifications": [
                "具有相关行业资质",
                "注册资金不少于500万元",
                "近三年无重大违法记录"
            ],
            "business_requirements": [
                "具有类似项目经验",
                "技术团队不少于10人"
            ]
        },
        "scoring_criteria": {
            "technical_score": {
                "weight": 70,
                "criteria": [
                    "技术方案完整性 (30分)",
                    "实施方案可行性 (25分)",
                    "技术创新性 (15分)"
                ]
            },
            "commercial_score": {
                "weight": 30,
                "criteria": [
                    "投标价格 (20分)",
                    "付款条件 (5分)",
                    "服务承诺 (5分)"
                ]
            }
        },
        "risk_points": [
            "技术方案复杂度较高",
            "实施周期较紧",
            "质量要求严格"
        ],
        "recommendations": [
            "重点关注技术方案的完整性",
            "合理控制投标价格",
            "加强项目管理团队配置"
        ],
        "analysis_stats": {
            "analysis_type": "comprehensive",
            "page_count": 50,
            "char_count": 25000,
            "analysis_time": "2分钟",
            "confidence": 85
        }
    }

async def save_analysis_results(project_id: str, result: Dict[str, Any]):
    """保存分析结果到项目目录"""
    try:
        # 获取项目路径
        project_path = os.environ.get('CURRENT_PROJECT_PATH')
        if not project_path:
            print(f"⚠️ [API] 未找到项目路径，跳过文件保存")
            return
        
        project_dir = Path(project_path)
        if not project_dir.exists():
            print(f"⚠️ [API] 项目目录不存在: {project_path}")
            return
        
        # 生成分析报告
        report_content = generate_analysis_report_content(result)
        report_path = project_dir / "招标文件分析报告.md"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        # 生成制作策略
        strategy_content = generate_strategy_content(result)
        strategy_path = project_dir / "投标文件制作策略.md"
        
        with open(strategy_path, 'w', encoding='utf-8') as f:
            f.write(strategy_content)
        
        print(f"✅ [API] 分析结果已保存到项目目录: {project_path}")
        
    except Exception as e:
        logger.error(f"保存分析结果失败: {e}")

def generate_analysis_report_content(result: Dict[str, Any]) -> str:
    """生成分析报告内容"""
    content = f"""# 招标文件分析报告

## 基本信息
- 项目名称: {result['basic_info']['project_name']}
- 招标单位: {result['basic_info']['tender_unit']}
- 项目编号: {result['basic_info']['project_number']}
- 招标方式: {result['basic_info']['tender_method']}

## 重要时间节点
- 文件发布时间: {result['time_info']['publish_time']}
- 报名截止时间: {result['time_info']['registration_deadline']}
- 投标截止时间: {result['time_info']['bid_deadline']}
- 开标时间: {result['time_info']['opening_time']}

## 技术要求
### 主要技术指标
{chr(10).join(f"- {spec}" for spec in result['technical_requirements']['main_specifications'])}

### 技术标准
{chr(10).join(f"- {std}" for std in result['technical_requirements']['standards'])}

## 商务要求
- 预算金额: {result['commercial_requirements']['budget']}
- 付款方式: {result['commercial_requirements']['payment_method']}
- 履约保证金: {result['commercial_requirements']['performance_bond']}
- 质保期: {result['commercial_requirements']['warranty_period']}

## 评分标准
### 技术分 ({result['scoring_criteria']['technical_score']['weight']}分)
{chr(10).join(f"- {criterion}" for criterion in result['scoring_criteria']['technical_score']['criteria'])}

### 商务分 ({result['scoring_criteria']['commercial_score']['weight']}分)
{chr(10).join(f"- {criterion}" for criterion in result['scoring_criteria']['commercial_score']['criteria'])}

## 关键风险点
{chr(10).join(f"- {risk}" for risk in result['risk_points'])}

## 建议事项
{chr(10).join(f"- {rec}" for rec in result['recommendations'])}

---
*本报告由ZtbAi智能分析系统自动生成*
*生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
    return content

def generate_strategy_content(result: Dict[str, Any]) -> str:
    """生成制作策略内容"""
    content = f"""# 投标文件制作策略

## 核心策略
基于招标文件分析，制定以下投标策略：

### 技术策略
1. **技术方案完整性** - 重点关注技术方案的完整性和可行性
2. **技术创新性** - 在满足基本要求的基础上，适当体现技术创新
3. **实施方案** - 提供详细、可操作的实施计划

### 商务策略
1. **价格策略** - 合理控制投标价格，确保竞争力
2. **付款条件** - 优化付款条件，降低资金压力
3. **服务承诺** - 提供有竞争力的服务承诺

### 资质策略
1. **资质准备** - 确保所有必需资质齐全有效
2. **业绩展示** - 重点展示相关项目经验
3. **团队配置** - 合理配置项目团队

## 制作要点

### 技术标制作要点
- 技术方案要完整、详细、可行
- 实施计划要具体、合理
- 质量保证措施要完善
- 技术创新点要突出

### 商务标制作要点
- 投标价格要有竞争力
- 付款条件要合理
- 履约保证要充分
- 服务承诺要实际

### 资格标制作要点
- 资质证书要齐全
- 业绩证明要充分
- 人员配置要合理
- 财务状况要良好

## 风险控制
{chr(10).join(f"- {risk}" for risk in result['risk_points'])}

## 成功要素
{chr(10).join(f"- {rec}" for rec in result['recommendations'])}

---
*本策略由ZtbAi智能分析系统自动生成*
*生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
    return content
