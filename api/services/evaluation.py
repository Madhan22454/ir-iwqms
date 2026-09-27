"""
Result Evaluation Engine

Compares observed parameter values against configured BIS IS 10500 standards
and determines overall sample result: FIT, UNFIT, or UNSATISFACTORY.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from models.master import Parameter, WaterQualityStandard
from models.lab import LabResultEntry


def evaluate_parameter(
    param: Parameter,
    standard: Optional[WaterQualityStandard],
    observed_value: str,
    is_qualitative: bool,
) -> Dict[str, Any]:
    """
    Evaluate a single parameter result against its standard.

    Returns:
        dict with keys: parameter_name, unit, observed, acceptable_limit,
                        permissible_limit, status (PASS | FAIL | ACCEPTABLE | NOT_TESTED)
    """
    result = {
        "parameter_name": param.name,
        "unit": param.unit or "",
        "observed": observed_value,
        "acceptable_limit": None,
        "permissible_limit": None,
        "status": "NOT_TESTED",
        "is_qualitative": is_qualitative,
    }

    if not observed_value or observed_value.strip() == "":
        return result

    if not standard:
        # No standard configured — cannot evaluate
        result["status"] = "NOT_TESTED"
        return result

    result["acceptable_limit"] = standard.qualitative_acceptable if is_qualitative else (
        f"{standard.min_acceptable or ''}–{standard.acceptable_limit or ''}" if standard.min_acceptable
        else str(standard.acceptable_limit or "")
    )
    result["permissible_limit"] = (
        str(standard.permissible_limit) if standard.permissible_limit else result["acceptable_limit"]
    )

    if is_qualitative:
        # e.g. Total Coliform, E. coli — value must be "NOT DETECTED" / "ABSENT" to pass
        acceptable = (standard.qualitative_acceptable or "NOT DETECTED").upper()
        val_upper = observed_value.strip().upper()
        if val_upper in ("NOT DETECTED", "ABSENT", "NIL", "ND"):
            result["status"] = "PASS"
        elif val_upper in ("DETECTED", "PRESENT"):
            result["status"] = "FAIL"
        else:
            result["status"] = "NOT_TESTED"
    else:
        try:
            val = float(observed_value)
            acc = standard.acceptable_limit
            perm = standard.permissible_limit
            mn = standard.min_acceptable

            # Check minimum (e.g. pH >= 6.5)
            if mn is not None and val < mn:
                result["status"] = "FAIL"
            elif acc is not None and val <= acc:
                result["status"] = "PASS"
            elif perm is not None and val <= perm:
                result["status"] = "ACCEPTABLE"  # Within permissible but above acceptable
            else:
                result["status"] = "FAIL"
        except (ValueError, TypeError):
            result["status"] = "NOT_TESTED"

    return result


def evaluate_report(
    db: Session,
    result_entries: List[LabResultEntry],
    standard_type: str = "BIS IS 10500",
) -> Dict[str, Any]:
    """
    Evaluate all parameter results in a report and determine overall result.

    Logic:
      - Any FAIL → UNFIT (if bacteriological parameter) or UNSATISFACTORY (if chemical, unless bacterio fail present)
      - Any bacteriological FAIL (Total Coliform, E. coli) → UNFIT
      - Chemical FAIL only (no bacteriological) → UNSATISFACTORY
      - ACCEPTABLE only (within permissible, above acceptable) → UNSATISFACTORY
      - All PASS or NOT_TESTED → FIT

    Returns:
        {
          overall_result: "FIT" | "UNFIT" | "UNSATISFACTORY",
          parameter_results: [...],
          failed_parameters: [...],
          evaluation_summary: str
        }
    """
    parameter_results = []
    failed_params = []
    has_bacterio_fail = False
    has_chemical_fail = False
    has_acceptable_only = False

    for entry in result_entries:
        param = db.query(Parameter).filter(Parameter.id == entry.parameter_id).first()
        if not param:
            continue

        standard = db.query(WaterQualityStandard).filter(
            WaterQualityStandard.parameter_id == param.id,
            WaterQualityStandard.standard_type == standard_type,
            WaterQualityStandard.is_active == True,
        ).first()

        eval_result = evaluate_parameter(
            param=param,
            standard=standard,
            observed_value=entry.observed_value or "",
            is_qualitative=entry.is_qualitative,
        )
        parameter_results.append(eval_result)

        if eval_result["status"] == "FAIL":
            failed_params.append(eval_result)
            if param.category and param.category.upper() == "BACTERIOLOGICAL":
                has_bacterio_fail = True
            else:
                has_chemical_fail = True
        elif eval_result["status"] == "ACCEPTABLE":
            has_acceptable_only = True

    # Determine overall result
    if has_bacterio_fail:
        overall = "UNFIT"
        summary = "Bacteriological failure detected — water is UNFIT for human consumption."
    elif has_chemical_fail:
        overall = "UNFIT"
        summary = "Chemical parameter(s) exceeded permissible limits — water is UNFIT."
    elif has_acceptable_only:
        overall = "UNSATISFACTORY"
        summary = "Parameter(s) above acceptable limit but within permissible limit — UNSATISFACTORY."
    elif failed_params:
        overall = "UNFIT"
        summary = f"{len(failed_params)} parameter(s) failed evaluation."
    else:
        overall = "FIT"
        summary = "All tested parameters are within acceptable limits — water is FIT."

    return {
        "overall_result": overall,
        "parameter_results": parameter_results,
        "failed_parameters": failed_params,
        "evaluation_summary": summary,
    }
