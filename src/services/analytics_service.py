from typing import Dict, Any, List
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass
from .supabase_client import SupabaseClient

@dataclass
class ProductMetrics:
    listing_id: str
    views: int
    conversions: int
    revenue: float
    avg_time_to_purchase: float
    price_elasticity: float
    optimal_price: Dict[str, float]

class AnalyticsService:
    def __init__(self):
        self.supabase = SupabaseClient.get_instance().get_client()
        
    async def track_event(self, event_type: str, listing_id: str, data: Dict[str, Any]):
        """Track a product-related event"""
        try:
            self.supabase.table('product_events').insert({
                'event_type': event_type,
                'listing_id': listing_id,
                'data': data,
                'timestamp': datetime.now().isoformat()
            }).execute()
        except Exception as e:
            print(f"Failed to track event: {str(e)}")

    async def get_product_metrics(self, listing_id: str, days: int = 30) -> ProductMetrics:
        """Calculate metrics for a product over the specified time period"""
        start_date = datetime.now() - timedelta(days=days)
        
        # Get events for the product
        result = self.supabase.table('product_events')\
            .select('*')\
            .eq('listing_id', listing_id)\
            .gte('timestamp', start_date.isoformat())\
            .execute()
        
        events = result.data
        
        # Calculate basic metrics
        views = sum(1 for e in events if e['event_type'] == 'view')
        purchases = [e for e in events if e['event_type'] == 'purchase']
        conversions = len(purchases)
        revenue = sum(p['data'].get('amount', 0) for p in purchases)
        
        # Calculate average time to purchase
        if purchases:
            view_to_purchase_times = []
            for purchase in purchases:
                purchase_time = datetime.fromisoformat(purchase['timestamp'])
                # Find the last view before this purchase
                last_view = next(
                    (e for e in reversed(events) 
                     if e['event_type'] == 'view' 
                     and datetime.fromisoformat(e['timestamp']) < purchase_time),
                    None
                )
                if last_view:
                    view_time = datetime.fromisoformat(last_view['timestamp'])
                    view_to_purchase_times.append((purchase_time - view_time).total_seconds())
            
            avg_time_to_purchase = np.mean(view_to_purchase_times) if view_to_purchase_times else 0
        else:
            avg_time_to_purchase = 0
        
        # Calculate price elasticity and optimal prices
        price_elasticity, optimal_prices = self._calculate_price_optimization(events)
        
        return ProductMetrics(
            listing_id=listing_id,
            views=views,
            conversions=conversions,
            revenue=revenue,
            avg_time_to_purchase=avg_time_to_purchase,
            price_elasticity=price_elasticity,
            optimal_price=optimal_prices
        )
    
    def _calculate_price_optimization(self, events: List[Dict]) -> tuple[float, Dict[str, float]]:
        """Calculate price elasticity and optimal prices based on historical data"""
        purchases = [e for e in events if e['event_type'] == 'purchase']
        
        if not purchases:
            return 0.0, {
                "basic": 29.99,
                "premium": 99.99,
                "enterprise": 499.99
            }
        
        # Group purchases by tier
        tier_data = {}
        for purchase in purchases:
            tier = purchase['data'].get('tier', 'basic')
            price = purchase['data'].get('price', 0)
            if tier not in tier_data:
                tier_data[tier] = {'prices': [], 'quantities': {}}
            
            if price not in tier_data[tier]['quantities']:
                tier_data[tier]['quantities'][price] = 0
            tier_data[tier]['prices'].append(price)
            tier_data[tier]['quantities'][price] += 1
        
        # Calculate elasticity and optimal prices for each tier
        optimal_prices = {}
        total_elasticity = 0
        num_tiers = 0
        
        for tier, data in tier_data.items():
            if len(data['prices']) < 2:
                continue
                
            prices = np.array(list(data['quantities'].keys()))
            quantities = np.array([data['quantities'][p] for p in prices])
            
            # Calculate price elasticity
            price_diff = np.diff(prices)
            quantity_diff = np.diff(quantities)
            avg_price = (prices[:-1] + prices[1:]) / 2
            avg_quantity = (quantities[:-1] + quantities[1:]) / 2
            
            elasticity = np.mean((quantity_diff / avg_quantity) / (price_diff / avg_price))
            total_elasticity += elasticity
            num_tiers += 1
            
            # Find optimal price (maximize revenue)
            revenue = prices * quantities
            optimal_idx = np.argmax(revenue)
            optimal_prices[tier] = float(prices[optimal_idx])
        
        # Fill in missing tiers with default prices
        default_prices = {
            "basic": 29.99,
            "premium": 99.99,
            "enterprise": 499.99
        }
        
        for tier, price in default_prices.items():
            if tier not in optimal_prices:
                optimal_prices[tier] = price
        
        avg_elasticity = total_elasticity / num_tiers if num_tiers > 0 else 0
        
        return avg_elasticity, optimal_prices
    
    async def get_dashboard_data(self) -> Dict[str, Any]:
        """Get aggregated data for the analytics dashboard"""
        # Get all events from the last 30 days
        start_date = datetime.now() - timedelta(days=30)
        result = self.supabase.table('product_events')\
            .select('*')\
            .gte('timestamp', start_date.isoformat())\
            .execute()
        
        events = result.data
        
        # Calculate overall metrics
        total_views = sum(1 for e in events if e['event_type'] == 'view')
        total_purchases = sum(1 for e in events if e['event_type'] == 'purchase')
        total_revenue = sum(
            e['data'].get('amount', 0) 
            for e in events 
            if e['event_type'] == 'purchase'
        )
        
        # Group by product
        products = {}
        for event in events:
            listing_id = event['listing_id']
            if listing_id not in products:
                products[listing_id] = {
                    'views': 0,
                    'purchases': 0,
                    'revenue': 0
                }
            
            if event['event_type'] == 'view':
                products[listing_id]['views'] += 1
            elif event['event_type'] == 'purchase':
                products[listing_id]['purchases'] += 1
                products[listing_id]['revenue'] += event['data'].get('amount', 0)
        
        # Calculate daily trends
        daily_metrics = {}
        for event in events:
            date = datetime.fromisoformat(event['timestamp']).date().isoformat()
            if date not in daily_metrics:
                daily_metrics[date] = {
                    'views': 0,
                    'purchases': 0,
                    'revenue': 0
                }
            
            if event['event_type'] == 'view':
                daily_metrics[date]['views'] += 1
            elif event['event_type'] == 'purchase':
                daily_metrics[date]['purchases'] += 1
                daily_metrics[date]['revenue'] += event['data'].get('amount', 0)
        
        return {
            'overall_metrics': {
                'total_views': total_views,
                'total_purchases': total_purchases,
                'total_revenue': total_revenue,
                'conversion_rate': (total_purchases / total_views * 100) if total_views > 0 else 0
            },
            'products': products,
            'daily_metrics': daily_metrics
        } 