import contextlib
import io
import json
import sys


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: api_bridge.py <resume_path> <job_text>"}))
        return 1

    resume_path = sys.argv[1]
    job_text = sys.argv[2]

    try:
        # Suppress verbose model/load logs so Node receives clean JSON.
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            from resume_evaluator import evaluate_resume

            result = evaluate_resume(resume_path, job_text)
        print(json.dumps({"success": True, "result": result}))
        return 0
    except Exception as exc:
        print(json.dumps({"success": False, "error": str(exc)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())

