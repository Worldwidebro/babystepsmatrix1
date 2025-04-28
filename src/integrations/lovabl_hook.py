from typing import Dict, Any
import os
import requests
from dataclasses import dataclass
from pathlib import Path

@dataclass
class ProductSpec:
    name: str
    description: str
    price_tiers: Dict[str, float]
    branding: Dict[str, Any]
    assets_dir: Path

class LovablMarketplace:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.lovabl.dev/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def create_listing(self, product_spec: ProductSpec) -> Dict[str, Any]:
        """Create a new product listing on Lovabl marketplace"""
        payload = {
            "name": product_spec.name,
            "description": product_spec.description,
            "price_tiers": product_spec.price_tiers,
            "branding": product_spec.branding
        }
        
        response = requests.post(
            f"{self.base_url}/listings",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def upload_assets(self, listing_id: str, assets_dir: Path) -> bool:
        """Upload product assets to Lovabl CDN"""
        files = []
        for file_path in assets_dir.glob("**/*"):
            if file_path.is_file():
                files.append(
                    ("files", (file_path.name, open(file_path, "rb")))
                )
        
        response = requests.post(
            f"{self.base_url}/listings/{listing_id}/assets",
            headers={"Authorization": f"Bearer {self.api_key}"},
            files=files
        )
        return response.status_code == 200
    
    def enable_payment_processing(self, listing_id: str, genix_key: str) -> bool:
        """Enable Genix Bank payment processing for a listing"""
        payload = {
            "payment_provider": "genix",
            "provider_key": genix_key
        }
        
        response = requests.post(
            f"{self.base_url}/listings/{listing_id}/payments",
            headers=self.headers,
            json=payload
        )
        return response.status_code == 200

def deploy_to_lovabl(product_spec: ProductSpec) -> str:
    """Deploy a product to Lovabl marketplace"""
    api_key = os.getenv("LOVABL_API_KEY")
    if not api_key:
        raise ValueError("LOVABL_API_KEY environment variable not set")
    
    marketplace = LovablMarketplace(api_key)
    
    # Create listing
    listing = marketplace.create_listing(product_spec)
    listing_id = listing["id"]
    
    # Upload assets
    if not marketplace.upload_assets(listing_id, product_spec.assets_dir):
        raise RuntimeError("Failed to upload assets")
    
    # Enable payment processing
    genix_key = os.getenv("GENIX_KEY")
    if genix_key and not marketplace.enable_payment_processing(listing_id, genix_key):
        raise RuntimeError("Failed to enable payment processing")
    
    return f"https://lovabl.dev/listings/{listing_id}" 