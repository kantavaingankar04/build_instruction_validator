from pydantic import BaseModel, Field
from typing import List

class BuildStep(BaseModel):
    step_number: int = Field(..., description="The sequential number of the step.")
    phase: str = Field(..., description="The broad phase, e.g., 'Dependencies', 'Java Setup', 'Docker Build'.")
    command: str = Field(..., description="The primary bash command to be executed (e.g., 'sudo yum install').")
    parameters: str = Field(default="", description="Any flags or arguments passed to the command.")
    environment_vars: str = Field(default="", description="Any environment variables exported or used in this step.")

class PackageBuildSpec(BaseModel):
    package_name: str = Field(..., description="The name of the package, e.g., 'Alfresco'.")
    version: str = Field(..., description="The version of the package being built.")
    steps: List[BuildStep] = Field(..., description="The complete, sequential list of required build steps.")

class DiscrepancyItem(BaseModel):
    id: str = Field(..., description="A unique identifier string, e.g., 'missing-1'")
    type: str = Field(..., description="Must be one of: 'MISSING_STEP', 'PARAMETER_MISMATCH', 'VERSION_INCONSISTENCY', 'ADDITIONAL_SCRIPT_STEP'")
    severity: str = Field(..., description="Must be one of: 'CRITICAL', 'WARNING', 'INFO'")
    title: str = Field(..., description="Short descriptive title of the discrepancy.")
    description: str = Field(..., description="Detailed explanation of the discrepancy.")
    biReference: str = Field(..., description="The EXACT bash command snippet from the Wiki. DO NOT say 'Step 2', provide the actual code string.")
    scriptReference: str = Field(..., description="The EXACT bash command snippet from the Script. DO NOT say 'Step 2', provide the actual code string.")
    impact: str = Field(..., description="The impact of this discrepancy on the build process.")
    remediation: str = Field(..., description="Instructions on how to fix this.")
    suggestedPatchSnippet: str = Field(..., description="The exact bash code snippet to add or replace to fix this.")

class DiscrepancyReport(BaseModel):
    complianceScore: float = Field(..., description="Overall compliance score 0-100.")
    summary: str = Field(..., description="A brief executive summary of the comparison.")
    discrepancies: List[DiscrepancyItem] = Field(..., description="The list of identified discrepancies.")