from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List
from services.analytics_service import AnalyticsService
from services.ab_testing import ABTestingService, AlertRule
from services.alert_service import AlertService

router = APIRouter()
analytics = AnalyticsService()
ab_testing = ABTestingService()
alerts = AlertService()

@router.get("/dashboard")
async def get_dashboard():
    """Get analytics dashboard data"""
    try:
        return await analytics.get_dashboard_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products/{listing_id}/metrics")
async def get_product_metrics(listing_id: str, days: int = 30):
    """Get metrics for a specific product"""
    try:
        metrics = await analytics.get_product_metrics(listing_id, days)
        return {
            'listing_id': metrics.listing_id,
            'views': metrics.views,
            'conversions': metrics.conversions,
            'revenue': metrics.revenue,
            'conversion_rate': (metrics.conversions / metrics.views * 100) if metrics.views > 0 else 0,
            'avg_time_to_purchase': metrics.avg_time_to_purchase,
            'price_elasticity': metrics.price_elasticity,
            'optimal_prices': metrics.optimal_price
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/{listing_id}")
async def track_event(listing_id: str, event_type: str, data: Dict[str, Any]):
    """Track a product-related event"""
    try:
        await analytics.track_event(event_type, listing_id, data)
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# A/B Testing Routes
@router.post("/experiments")
async def create_experiment(listing_id: str, variants: List[Dict[str, float]] = Body(...)):
    """Create a new price testing experiment"""
    try:
        experiment_id = await ab_testing.create_experiment(listing_id, variants)
        if not experiment_id:
            raise HTTPException(status_code=400, detail="Failed to create experiment")
        return {'experiment_id': experiment_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/experiments/{experiment_id}")
async def get_experiment_results(experiment_id: str):
    """Get results for an experiment"""
    try:
        results = await ab_testing.analyze_experiment(experiment_id)
        return {
            'winning_variant': results.winning_variant_id,
            'confidence_level': results.confidence_level,
            'lift': results.lift,
            'variants': {
                variant_id: {
                    'views': variant.views,
                    'conversions': variant.conversions,
                    'revenue': variant.revenue,
                    'conversion_rate': (variant.conversions / variant.views * 100) if variant.views > 0 else 0
                }
                for variant_id, variant in results.variants.items()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/experiments/{listing_id}/variant")
async def get_variant(listing_id: str):
    """Get a variant for a user"""
    try:
        variant = await ab_testing.get_variant(listing_id)
        if not variant:
            raise HTTPException(status_code=404, detail="No active experiment found")
        return variant
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Alert Routes
@router.post("/alerts/rules")
async def create_alert_rule(rule: AlertRule = Body(...)):
    """Create a new alert rule"""
    try:
        alert_id = await alerts.create_alert_rule(rule)
        if not alert_id:
            raise HTTPException(status_code=400, detail="Failed to create alert rule")
        return {'alert_id': alert_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts/recent")
async def get_recent_alerts(hours: int = 24):
    """Get recent alerts"""
    try:
        return await alerts.get_recent_alerts(hours)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts/check")
async def check_alerts():
    """Manually trigger alert checks"""
    try:
        triggered = await alerts.check_alerts()
        return {
            'triggered_alerts': len(triggered),
            'alerts': [
                {
                    'id': alert.id,
                    'metric': alert.metric,
                    'condition': alert.condition,
                    'threshold': alert.threshold,
                    'value': alert.last_value,
                    'triggered_at': alert.last_checked.isoformat()
                }
                for alert in triggered
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 