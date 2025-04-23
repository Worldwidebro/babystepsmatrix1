import yaml
import os
from typing import Dict, List

def load_template() -> Dict:
    """Load the business template configuration"""
    with open('companies/businesses.yaml', 'r') as file:
        data = yaml.safe_load(file)
        return data['business_config_template']

def generate_business_configs():
    """Generate individual configurations for all 82 businesses"""
    with open('companies/businesses.yaml', 'r') as file:
        data = yaml.safe_load(file)
    
    template = data['business_config_template']
    categories = [
        'foundation_companies',
        'innovation_companies',
        'relationship_companies',
        'knowledge_companies'
    ]
    
    # Create output directory if it doesn't exist
    os.makedirs('companies/configurations', exist_ok=True)
    
    # Generate config for each business
    for category in categories:
        companies = data[category]
        for company in companies:
            config = {
                'company_info': company,
                **template  # Include all template configurations
            }
            
            # Customize specific configurations based on company type
            customize_config(config)
            
            # Save individual company configuration
            filename = f"companies/configurations/{company['company_id']}.yaml"
            with open(filename, 'w') as f:
                yaml.dump(config, f, default_flow_style=False)

def customize_config(config: Dict):
    """Customize configuration based on company type"""
    company_type = config['company_info']['type']
    
    # Customize AI models based on company type
    if 'Artificial Intelligence' in company_type:
        config['integrations']['ai_agents']['models'].extend(['llama2', 'falcon'])
    
    # Customize security for financial companies
    if 'Blockchain' in company_type:
        config['security']['compliance']['standards'].append('PCI-DSS')
    
    # Customize analytics for marketing companies
    if 'Marketing' in company_type:
        config['analytics']['metrics'].extend([
            'campaign_performance',
            'conversion_rate',
            'roi'
        ])

if __name__ == "__main__":
    generate_business_configs() 