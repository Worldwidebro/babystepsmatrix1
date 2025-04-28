from typing import Dict, Any, List
from datetime import datetime
from .supabase_client import SupabaseClient
from .antilibrary import UnknownEntry
from .analytics_service import AnalyticsService
from integrations.lovabl_hook import LovablMarketplace, ProductSpec
from pathlib import Path
import os

class LovablPublisher:
    def __init__(self):
        self.supabase = SupabaseClient.get_instance().get_client()
        self.lovabl = LovablMarketplace(os.getenv('LOVABL_API_KEY'))
        self.analytics = AnalyticsService()
        
    async def _create_product_spec(self, unknown: UnknownEntry) -> ProductSpec:
        """Convert an unknown entry to a Lovabl product specification with optimized pricing"""
        # Get analytics data if this is an existing product
        result = self.supabase.table('unknowns')\
            .select('lovabl_listing_id')\
            .eq('id', unknown.id)\
            .execute()
        
        if result.data and result.data[0].get('lovabl_listing_id'):
            # Get optimized pricing from analytics
            metrics = await self.analytics.get_product_metrics(result.data[0]['lovabl_listing_id'])
            price_tiers = metrics.optimal_price
        else:
            # Use default pricing for new products
            price_tiers = {
                "basic": 29.99,
                "premium": 99.99,
                "enterprise": 499.99
            }
        
        return ProductSpec(
            name=f"Knowledge Gap: {unknown.category}",
            description=self._format_description(unknown),
            price_tiers=price_tiers,
            branding={
                "primary_color": "#4A90E2",
                "accent_color": "#50E3C2",
                "logo_url": "https://assets.lovabl.dev/logos/antilibrary.png"
            },
            assets_dir=Path("assets/antilibrary")
        )
    
    def _format_description(self, unknown: UnknownEntry) -> str:
        """Format the unknown entry into a marketable description"""
        return f"""
## Market Intelligence Report

### Overview
{unknown.description}

### Impact Assessment
Potential Market Impact: {unknown.potential_impact * 100}%

### Key Areas
{', '.join(unknown.tags)}

### Related Industries
{', '.join(unknown.related_companies)}

### Last Updated
{unknown.last_updated.strftime('%Y-%m-%d')}

### Status
Current Exploration Phase: {unknown.exploration_status.title()}
"""

    async def publish_high_impact_unknowns(self, impact_threshold: float = 0.8) -> List[Dict[str, Any]]:
        """Publish high-impact unknown entries as Lovabl products"""
        # Get high-impact unknowns from Supabase
        result = self.supabase.table('unknowns')\
            .select('*')\
            .gte('potential_impact', impact_threshold)\
            .eq('exploration_status', 'investigating')\
            .execute()
        
        published_products = []
        
        for item in result.data:
            unknown = UnknownEntry.from_dict(item)
            product_spec = await self._create_product_spec(unknown)
            
            try:
                # Create listing on Lovabl
                listing = self.lovabl.create_listing(product_spec)
                
                # Upload any associated assets
                if product_spec.assets_dir.exists():
                    self.lovabl.upload_assets(listing["id"], product_spec.assets_dir)
                
                # Enable payment processing if Genix key is available
                genix_key = os.getenv('GENIX_KEY')
                if genix_key:
                    self.lovabl.enable_payment_processing(listing["id"], genix_key)
                
                # Update Supabase with publishing info
                self.supabase.table('unknowns')\
                    .update({
                        'lovabl_listing_id': listing["id"],
                        'last_updated': datetime.now().isoformat()
                    })\
                    .eq('id', unknown.id)\
                    .execute()
                
                # Track publishing event
                await self.analytics.track_event(
                    'publish',
                    listing["id"],
                    {
                        'unknown_id': unknown.id,
                        'price_tiers': product_spec.price_tiers
                    }
                )
                
                published_products.append({
                    'unknown_id': unknown.id,
                    'listing_id': listing["id"],
                    'listing_url': f"https://lovabl.dev/listings/{listing['id']}",
                    'price_tiers': product_spec.price_tiers
                })
                
            except Exception as e:
                print(f"Failed to publish unknown {unknown.id}: {str(e)}")
                continue
        
        return published_products 