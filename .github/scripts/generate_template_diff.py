#!/usr/bin/env python3

"""
This script generates HTML diffs for modified QC templates.

Usage:
    python generate_template_diff.py <modified_templates_file> <output_dir>

Arguments:
    modified_templates_file: File containing list of modified template paths
    output_dir: Directory to save HTML diff files
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

import jsondiff
from jinja2 import Template

# Define HTML template for diff visualization
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>{{ template_name }} Diff: {{ old_rev }} → {{ new_rev }}</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .diff-header { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .diff-info { display: flex; flex-wrap: wrap; gap: 20px; margin: 15px 0; }
        .diff-info div { flex: 1; min-width: 200px; }
        .diff-info strong { display: inline-block; width: 120px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f1f1f1; text-align: left; padding: 10px; }
        td { padding: 10px; border-top: 1px solid #ddd; vertical-align: top; }
        .code { font-family: monospace; }
        .changes { background: #fffdea; }
        .added { background: #e6ffed; }
        .removed { background: #ffeef0; }
        .no-change { color: #666; }
        .step-header { font-weight: bold; }
    </style>
</head>
<body>
    <div class="diff-header">
        <h1>{{ template_name }} - Template Diff</h1>
        <div class="diff-info">
            <div>
                <p><strong>Previous:</strong> Rev {{ old_rev }} ({{ old_date }})</p>
                <p><strong>New:</strong> Rev {{ new_rev }} ({{ new_date }})</p>
            </div>
            <div>
                <p><strong>Created by:</strong> {{ new_created_by }}</p>
                <p><strong>Generated:</strong> {{ generated_date }}</p>
            </div>
        </div>
    </div>
    
    {% if header_changes %}
    <h2>Header Changes</h2>
    <table>
        <tr>
            <th>Field</th>
            <th>Previous Value</th>
            <th>New Value</th>
        </tr>
        {% for field, values in header_changes.items() %}
        <tr class="changes">
            <td class="code">{{ field }}</td>
            <td class="code">{{ values.old }}</td>
            <td class="code">{{ values.new }}</td>
        </tr>
        {% endfor %}
    </table>
    {% endif %}
    
    <h2>Steps Changes</h2>
    {% if not steps_changes %}
    <p class="no-change">No changes to steps</p>
    {% else %}
    <table>
        <tr>
            <th>Code</th>
            <th>Previous</th>
            <th>New</th>
        </tr>
        {% for step_change in steps_changes %}
            <tr class="{{ step_change.type }}">
                <td class="code step-header">{{ step_change.code }}</td>
                <td>
                    {% if step_change.type != 'added' %}
                        <div><strong>Description:</strong> {{ step_change.old.description }}</div>
                        <div><strong>Requirement:</strong> {{ step_change.old.requirement }}</div>
                        <div><strong>Category:</strong> {{ step_change.old.category }}</div>
                        <div><strong>Std time:</strong> {{ step_change.old.std_time }}s</div>
                        <div><strong>Photo required:</strong> {{ step_change.old.photo_required }}</div>
                    {% endif %}
                </td>
                <td>
                    {% if step_change.type != 'removed' %}
                        <div><strong>Description:</strong> {{ step_change.new.description }}</div>
                        <div><strong>Requirement:</strong> {{ step_change.new.requirement }}</div>
                        <div><strong>Category:</strong> {{ step_change.new.category }}</div>
                        <div><strong>Std time:</strong> {{ step_change.new.std_time }}s</div>
                        <div><strong>Photo required:</strong> {{ step_change.new.photo_required }}</div>
                    {% endif %}
                </td>
            </tr>
        {% endfor %}
    </table>
    {% endif %}
</body>
</html>
"""


def load_template(file_path):
    """Load a template file from the given path."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading template {file_path}: {e}")
        return None


def get_previous_revision(template_path):
    """Get the previous revision of a template from git history."""
    import subprocess
    
    # Get the current directory
    repo_root = subprocess.check_output(
        ["git", "rev-parse", "--show-toplevel"], text=True
    ).strip()
    
    # Get list of commits that modified this file
    commits = subprocess.check_output(
        ["git", "log", "--format=%H", template_path], text=True
    ).strip().split('\n')
    
    if len(commits) <= 1:
        return None  # No previous revision
    
    # Get previous version of the file
    prev_content = subprocess.check_output(
        ["git", "show", f"{commits[1]}:{template_path}"], text=True
    )
    
    try:
        return json.loads(prev_content)
    except json.JSONDecodeError:
        return None


def generate_diff(old_template, new_template):
    """Generate a structured diff between two template versions."""
    result = {
        "template_name": new_template.get("name", "Unknown Template"),
        "old_rev": old_template.get("revision", "?"),
        "new_rev": new_template.get("revision", "?"),
        "old_date": old_template.get("published_at", "Unknown"),
        "new_date": new_template.get("created_at", "Unknown"),
        "new_created_by": new_template.get("created_by", "Unknown"),
        "generated_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "header_changes": {},
        "steps_changes": []
    }
    
    # Check header field changes (excluding steps)
    header_fields = [
        "id", "name", "revision", "status", "model_id", "stage_id", 
        "created_by", "approved_by"
    ]
    
    for field in header_fields:
        old_value = old_template.get(field)
        new_value = new_template.get(field)
        if old_value != new_value:
            result["header_changes"][field] = {
                "old": old_value,
                "new": new_value
            }
    
    # Process steps changes
    old_steps = {step["code"]: step for step in old_template.get("steps", [])}
    new_steps = {step["code"]: step for step in new_template.get("steps", [])}
    
    # Find modified and unchanged steps
    for code in set(old_steps.keys()) & set(new_steps.keys()):
        old_step = old_steps[code]
        new_step = new_steps[code]
        
        if old_step != new_step:
            result["steps_changes"].append({
                "type": "changes",
                "code": code,
                "old": old_step,
                "new": new_step
            })
    
    # Find added steps
    for code in set(new_steps.keys()) - set(old_steps.keys()):
        result["steps_changes"].append({
            "type": "added",
            "code": code,
            "new": new_steps[code]
        })
    
    # Find removed steps
    for code in set(old_steps.keys()) - set(new_steps.keys()):
        result["steps_changes"].append({
            "type": "removed",
            "code": code,
            "old": old_steps[code]
        })
    
    # Sort step changes by code
    result["steps_changes"].sort(key=lambda x: x["code"])
    
    return result


def render_html_diff(diff_data):
    """Render the diff data as HTML using the template."""
    template = Template(HTML_TEMPLATE)
    return template.render(**diff_data)


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <modified_templates_file> <output_dir>")
        sys.exit(1)
    
    modified_templates_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Read list of modified templates
    with open(modified_templates_file, 'r') as f:
        modified_templates = [line.strip() for line in f if line.strip()]
    
    for template_path in modified_templates:
        print(f"Processing {template_path}...")
        
        # Load current template
        current_template = load_template(template_path)
        if not current_template:
            print(f"  Failed to load current template, skipping")
            continue
        
        # Get previous revision from git history
        previous_template = get_previous_revision(template_path)
        if not previous_template:
            print(f"  No previous revision found, skipping")
            continue
        
        # Generate structured diff
        diff_data = generate_diff(previous_template, current_template)
        
        # Skip if no changes detected
        if not diff_data["header_changes"] and not diff_data["steps_changes"]:
            print(f"  No changes detected, skipping")
            continue
        
        # Render HTML
        html_content = render_html_diff(diff_data)
        
        # Save HTML diff
        template_name = Path(template_path).stem
        output_file = os.path.join(output_dir, f"{template_name}_diff.html")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"  Diff generated: {output_file}")


if __name__ == "__main__":
    main()
