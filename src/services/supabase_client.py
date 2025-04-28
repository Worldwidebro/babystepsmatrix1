from supabase import create_client
import os
from typing import Optional

class SupabaseClient:
    _instance: Optional['SupabaseClient'] = None
    
    def __init__(self):
        if not SupabaseClient._instance:
            self.url = os.getenv('SUPABASE_URL')
            self.key = os.getenv('SUPABASE_ANON_KEY')
            self.client = create_client(self.url, self.key)
    
    @classmethod
    def get_instance(cls) -> 'SupabaseClient':
        if not cls._instance:
            cls._instance = SupabaseClient()
        return cls._instance
    
    def get_client(self):
        return self.client 