from typing import Dict, List, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
import json
from pathlib import Path
from .supabase_client import SupabaseClient

@dataclass
class UnknownEntry:
    id: str
    company_id: str
    category: str
    description: str
    potential_impact: float  # 0-1 scale
    discovery_date: datetime
    last_updated: datetime
    related_companies: List[str]
    exploration_status: str  # 'new', 'investigating', 'resolved'
    tags: List[str]

    def to_dict(self):
        data = asdict(self)
        data['discovery_date'] = self.discovery_date.isoformat()
        data['last_updated'] = self.last_updated.isoformat()
        data['related_companies'] = json.dumps(self.related_companies)
        data['tags'] = json.dumps(self.tags)
        return data

    @classmethod
    def from_dict(cls, data: Dict):
        data['discovery_date'] = datetime.fromisoformat(data['discovery_date'])
        data['last_updated'] = datetime.fromisoformat(data['last_updated'])
        data['related_companies'] = json.loads(data['related_companies'])
        data['tags'] = json.loads(data['tags'])
        return cls(**data)

class AntilibraryService:
    def __init__(self):
        self.supabase = SupabaseClient.get_instance().get_client()
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """Ensure the required table exists in Supabase"""
        # Note: Table creation should be handled through migrations
        # This is just a placeholder for the table structure
        pass

    def add_unknown(self, entry: UnknownEntry) -> bool:
        """Add a new unknown entry to the antilibrary"""
        try:
            result = self.supabase.table('unknowns').insert(entry.to_dict()).execute()
            return bool(result.data)
        except Exception as e:
            print(f"Failed to add unknown entry: {str(e)}")
            return False

    def get_company_unknowns(self, company_id: str) -> List[UnknownEntry]:
        """Get all unknown entries for a specific company"""
        result = self.supabase.table('unknowns').select('*').eq('company_id', company_id).execute()
        return [UnknownEntry.from_dict(item) for item in result.data]

    def find_related_unknowns(self, tags: List[str], threshold: float = 0.5) -> List[UnknownEntry]:
        """Find unknown entries related by tags with impact above threshold"""
        # Note: This is a simplified query. In production, you'd want to use proper array operations
        result = self.supabase.table('unknowns').select('*').gte('potential_impact', threshold).execute()
        entries = [UnknownEntry.from_dict(item) for item in result.data]
        return [entry for entry in entries if any(tag in entry.tags for tag in tags)]

    def update_exploration_status(self, entry_id: str, new_status: str) -> bool:
        """Update the exploration status of an unknown entry"""
        try:
            result = self.supabase.table('unknowns').update({
                'exploration_status': new_status,
                'last_updated': datetime.now().isoformat()
            }).eq('id', entry_id).execute()
            return bool(result.data)
        except Exception:
            return False

    def get_high_impact_unknowns(self, impact_threshold: float = 0.8) -> List[UnknownEntry]:
        """Get all unknown entries with high potential impact"""
        result = self.supabase.table('unknowns').select('*').gte('potential_impact', impact_threshold).execute()
        return [UnknownEntry.from_dict(item) for item in result.data]

    def get_company_synergies(self, company_id: str) -> List[Dict]:
        """Find potential synergies between companies based on shared unknowns"""
        company_unknowns = self.get_company_unknowns(company_id)
        synergies = []
        
        for unknown in company_unknowns:
            for related_company in unknown.related_companies:
                if related_company != company_id:
                    synergies.append({
                        'company_id': related_company,
                        'unknown_id': unknown.id,
                        'shared_tags': unknown.tags,
                        'potential_impact': unknown.potential_impact
                    })
        
        return synergies 