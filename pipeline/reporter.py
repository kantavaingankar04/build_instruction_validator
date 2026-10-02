import os
from jinja2 import Environment, FileSystemLoader

def generate_html_report(report_data: dict, output_filename: str = "discrepancy_report.html"):
    """Injects discrepancy data into the Tailwind HTML template."""
    
    # Set up Jinja2 environment to load the template
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('report_template.html')
    
    # Render the template with our data
    html_out = template.render(report=report_data)
    
    # Save the output HTML file
    with open(output_filename, 'w', encoding="utf-8") as f:
        f.write(html_out)
        
    print(f"\n[UI Generated] Rich HTML dashboard saved to: {output_filename}")
