from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass
from .supabase_client import SupabaseClient
import random

@dataclass
class Variant:
    id: str
    price_tiers: Dict[str, float]
    views: int = 0
    conversions: int = 0
    revenue: float = 0.0

@dataclass
class ExperimentResult:
    winning_variant_id: str
    confidence_level: float
    lift: float
    variants: Dict[str, Variant]

class ABTestingService:
    def __init__(self):
        self.supabase = SupabaseClient.get_instance().get_client()
    
    async def create_experiment(self, listing_id: str, variants: List[Dict[str, float]]) -> str:
        """Create a new price testing experiment"""
        experiment_id = f"exp_{listing_id}_{datetime.now().strftime('%Y%m%d')}"
        
        try:
            self.supabase.table('price_experiments').insert({
                'id': experiment_id,
                'listing_id': listing_id,
                'variants': [
                    {
                        'id': f"variant_{i}",
                        'price_tiers': variant
                    }
                    for i, variant in enumerate(variants)
                ],
                'start_date': datetime.now().isoformat(),
                'status': 'active'
            }).execute()
            
            return experiment_id
        except Exception as e:
            print(f"Failed to create experiment: {str(e)}")
            return None
    
    async def get_variant(self, listing_id: str) -> Optional[Dict[str, float]]:
        """Get a random variant for a user"""
        result = self.supabase.table('price_experiments')\
            .select('*')\
            .eq('listing_id', listing_id)\
            .eq('status', 'active')\
            .execute()
        
        if not result.data:
            return None
        
        experiment = result.data[0]
        variant = random.choice(experiment['variants'])
        
        # Track variant assignment
        await self._track_variant_view(experiment['id'], variant['id'])
        
        return variant['price_tiers']
    
    async def track_conversion(self, listing_id: str, variant_id: str, amount: float):
        """Track a conversion for a specific variant"""
        result = self.supabase.table('price_experiments')\
            .select('*')\
            .eq('listing_id', listing_id)\
            .eq('status', 'active')\
            .execute()
        
        if not result.data:
            return
        
        experiment = result.data[0]
        
        # Update variant metrics
        await self._track_variant_conversion(experiment['id'], variant_id, amount)
    
    async def _track_variant_view(self, experiment_id: str, variant_id: str):
        """Track a view for a variant"""
        self.supabase.table('experiment_events').insert({
            'experiment_id': experiment_id,
            'variant_id': variant_id,
            'event_type': 'view',
            'timestamp': datetime.now().isoformat()
        }).execute()
    
    async def _track_variant_conversion(self, experiment_id: str, variant_id: str, amount: float):
        """Track a conversion for a variant"""
        self.supabase.table('experiment_events').insert({
            'experiment_id': experiment_id,
            'variant_id': variant_id,
            'event_type': 'conversion',
            'data': {'amount': amount},
            'timestamp': datetime.now().isoformat()
        }).execute()
    
    async def analyze_experiment(self, experiment_id: str) -> ExperimentResult:
        """Analyze experiment results using statistical methods"""
        # Get experiment events
        result = self.supabase.table('experiment_events')\
            .select('*')\
            .eq('experiment_id', experiment_id)\
            .execute()
        
        events = result.data
        
        # Group events by variant
        variants: Dict[str, Variant] = {}
        for event in events:
            variant_id = event['variant_id']
            if variant_id not in variants:
                variants[variant_id] = Variant(
                    id=variant_id,
                    price_tiers={},  # Will be filled from experiment data
                    views=0,
                    conversions=0,
                    revenue=0.0
                )
            
            if event['event_type'] == 'view':
                variants[variant_id].views += 1
            elif event['event_type'] == 'conversion':
                variants[variant_id].conversions += 1
                variants[variant_id].revenue += event['data'].get('amount', 0)
        
        # Find the winning variant
        best_variant = max(variants.values(), key=lambda v: v.revenue)
        
        # Calculate confidence level using chi-square test
        confidence_level = self._calculate_confidence(variants.values())
        
        # Calculate lift
        baseline = min(variants.values(), key=lambda v: v.revenue)
        lift = ((best_variant.revenue / best_variant.views) - 
                (baseline.revenue / baseline.views)) / (baseline.revenue / baseline.views)
        
        return ExperimentResult(
            winning_variant_id=best_variant.id,
            confidence_level=confidence_level,
            lift=lift,
            variants=variants
        )
    
    def _calculate_confidence(self, variants: List[Variant]) -> float:
        """Calculate statistical confidence using chi-square test"""
        if len(variants) < 2:
            return 0.0
        
        # Convert to numpy arrays for calculations
        conversions = np.array([v.conversions for v in variants])
        views = np.array([v.views for v in variants])
        
        # Expected conversions under null hypothesis
        total_conv_rate = conversions.sum() / views.sum()
        expected = views * total_conv_rate
        
        # Chi-square statistic
        chi2 = ((conversions - expected) ** 2 / expected).sum()
        
        # Simplified p-value calculation (could be improved with scipy.stats)
        confidence = 1 - np.exp(-chi2 / 2)
        
        return confidence 