from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass
from .supabase_client import SupabaseClient

@dataclass
class Alert:
    id: str
    metric: str
    condition: str
    threshold: float
    triggered: bool
    last_checked: datetime
    last_value: float

@dataclass
class AlertRule:
    metric: str
    condition: str
    threshold: float
    window_minutes: int
    cooldown_minutes: int

class AlertService:
    def __init__(self):
        self.supabase = SupabaseClient.get_instance().get_client()
        self.default_rules = [
            AlertRule("conversion_rate", "<", 1.0, 60, 240),  # Alert if conv rate drops below 1% in last hour
            AlertRule("revenue", "<", 100.0, 1440, 1440),     # Alert if daily revenue below $100
            AlertRule("views", "<", 10, 60, 120),             # Alert if views drop below 10/hour
            AlertRule("price_elasticity", ">", 2.0, 1440, 1440)  # Alert if price elasticity too high
        ]
    
    async def create_alert_rule(self, rule: AlertRule) -> str:
        """Create a new alert rule"""
        alert_id = f"alert_{rule.metric}_{datetime.now().strftime('%Y%m%d%H%M')}"
        
        try:
            self.supabase.table('alert_rules').insert({
                'id': alert_id,
                'metric': rule.metric,
                'condition': rule.condition,
                'threshold': rule.threshold,
                'window_minutes': rule.window_minutes,
                'cooldown_minutes': rule.cooldown_minutes,
                'created_at': datetime.now().isoformat(),
                'last_triggered': None
            }).execute()
            
            return alert_id
        except Exception as e:
            print(f"Failed to create alert rule: {str(e)}")
            return None
    
    async def check_alerts(self) -> List[Alert]:
        """Check all alert rules and generate alerts"""
        # Get active alert rules
        result = self.supabase.table('alert_rules')\
            .select('*')\
            .execute()
        
        rules = result.data
        triggered_alerts = []
        
        for rule in rules:
            # Skip if in cooldown period
            if rule.get('last_triggered'):
                last_trigger = datetime.fromisoformat(rule['last_triggered'])
                cooldown = timedelta(minutes=rule['cooldown_minutes'])
                if datetime.now() - last_trigger < cooldown:
                    continue
            
            # Get metric value for time window
            value = await self._get_metric_value(
                rule['metric'],
                timedelta(minutes=rule['window_minutes'])
            )
            
            # Check if alert should be triggered
            if self._evaluate_condition(value, rule['condition'], rule['threshold']):
                alert = Alert(
                    id=f"alert_{datetime.now().strftime('%Y%m%d%H%M')}",
                    metric=rule['metric'],
                    condition=rule['condition'],
                    threshold=rule['threshold'],
                    triggered=True,
                    last_checked=datetime.now(),
                    last_value=value
                )
                
                # Record alert
                await self._record_alert(alert, rule['id'])
                
                triggered_alerts.append(alert)
        
        return triggered_alerts
    
    async def _get_metric_value(self, metric: str, window: timedelta) -> float:
        """Get the current value of a metric"""
        start_time = datetime.now() - window
        
        if metric == 'conversion_rate':
            result = self.supabase.table('product_events')\
                .select('*')\
                .gte('timestamp', start_time.isoformat())\
                .execute()
            
            events = result.data
            views = sum(1 for e in events if e['event_type'] == 'view')
            conversions = sum(1 for e in events if e['event_type'] == 'purchase')
            
            return (conversions / views * 100) if views > 0 else 0
            
        elif metric == 'revenue':
            result = self.supabase.table('product_events')\
                .select('*')\
                .eq('event_type', 'purchase')\
                .gte('timestamp', start_time.isoformat())\
                .execute()
            
            return sum(e['data'].get('amount', 0) for e in result.data)
            
        elif metric == 'views':
            result = self.supabase.table('product_events')\
                .select('count')\
                .eq('event_type', 'view')\
                .gte('timestamp', start_time.isoformat())\
                .execute()
            
            return len(result.data)
            
        elif metric == 'price_elasticity':
            # Get from analytics service
            return 1.0  # Placeholder
        
        return 0.0
    
    def _evaluate_condition(self, value: float, condition: str, threshold: float) -> bool:
        """Evaluate if a condition is met"""
        if condition == '<':
            return value < threshold
        elif condition == '>':
            return value > threshold
        elif condition == '=':
            return abs(value - threshold) < 0.0001
        return False
    
    async def _record_alert(self, alert: Alert, rule_id: str):
        """Record an alert in the database"""
        try:
            # Record alert
            self.supabase.table('alerts').insert({
                'id': alert.id,
                'rule_id': rule_id,
                'metric': alert.metric,
                'value': alert.last_value,
                'threshold': alert.threshold,
                'triggered_at': datetime.now().isoformat()
            }).execute()
            
            # Update rule's last triggered time
            self.supabase.table('alert_rules')\
                .update({'last_triggered': datetime.now().isoformat()})\
                .eq('id', rule_id)\
                .execute()
                
        except Exception as e:
            print(f"Failed to record alert: {str(e)}")
    
    async def get_recent_alerts(self, hours: int = 24) -> List[Alert]:
        """Get recent alerts"""
        start_time = datetime.now() - timedelta(hours=hours)
        
        result = self.supabase.table('alerts')\
            .select('*')\
            .gte('triggered_at', start_time.isoformat())\
            .order('triggered_at', desc=True)\
            .execute()
        
        return [
            Alert(
                id=alert['id'],
                metric=alert['metric'],
                condition='<',  # Simplified
                threshold=alert['threshold'],
                triggered=True,
                last_checked=datetime.fromisoformat(alert['triggered_at']),
                last_value=alert['value']
            )
            for alert in result.data
        ] 